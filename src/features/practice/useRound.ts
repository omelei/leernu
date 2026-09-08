import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildOptions,
  composeRound,
  COMBO_THRESHOLD,
  countMastered,
  emptyState,
  judgeAnswer,
  review,
  type AnswerVerdict,
  type Item,
  type RoundRule,
  type ItemState,
  type StreakChange,
} from '@/game-core';
import { loadGeoSet, loadPointSet, type Detailniveau, type GeoSet } from '@/content/loadGeo';
import { loadAllItems, loadItemSets } from '@/content/loadSets';
import { loadNeighbours } from '@/content/loadNeighbours';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { recordRoundFinished } from '@/store/streakStore';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';
import type { AnswerLayer } from './MapCanvas';

/**
 * One round of "wijs aan".
 *
 * A round covers the **whole set** where the set is small enough to be covered:
 * all twelve provinces, all twelve capitals, all five islands. For a set that
 * size it is the honest thing to do — a child asked ten of twelve cannot tell
 * which two they were let off, and "ik ken ze allemaal" is what they are
 * working towards.
 *
 * Eighty cities cannot be one round. Twenty minutes without a stopping point is
 * not practice, it is endurance, and the child who quits halfway has learned
 * that the exercise is unfinishable. So a large set is sampled to
 * MAX_ROUND questions and met again next round, which is what spaced repetition
 * is for in the first place.
 *
 * The order comes from the Leitner scheduler either way, so the items a child
 * keeps missing come round first. Everything is written to the device as it
 * happens: a child who closes the tab halfway keeps what they answered.
 */

/**
 * Long enough to be worth doing, short enough to finish. Matched to the twelve
 * provinces, which is the round length the design was drawn around.
 */
const MAX_ROUND = 15;

export type SetId =
  'nl-provincies' | 'nl-hoofdsteden' | 'nl-waddeneilanden' | 'nl-wateren' | 'nl-steden';

/**
 * How a child answers. Pointing tests where something is; naming it is a
 * different thing and often the harder one — and choosing between four names is
 * the step in between, where the answer is on the screen and the child has to
 * know which of the four it is.
 */
export type PracticeMode = 'wijs-aan' | 'meerkeuze' | 'hoe-heet-dit' | 'bliksemronde' | 'overleven';

/*
 * The split between practising and practising under pressure used to be two
 * arrays here. It lives in `features/module/forms.ts` now, with the order, the
 * icons and the reason under each name — one list, in the order a child meets
 * them, rather than a fact about modes that a screen had to reassemble.
 */

/**
 * How a round ends is the only thing the two challenge modes change — the map,
 * the judging and the scheduler are identical — so it is a value rather than a
 * set of `if (mode === …)` scattered through the hook. The type itself lives in
 * game-core, because the tables end a round the same three ways.
 */
export type { RoundRule };

/**
 * Sixty seconds and three lives.
 *
 * Both are pressure, and pressure is the point — but neither may punish. A lost
 * life costs no coins, a finished clock is still a finished round for the
 * streak, and nothing here is ranked against another child (spec §10). What
 * they add is a reason to answer without hesitating, which is the difference
 * between knowing where Zwolle is and working it out each time.
 */
export const ROUND_RULE: Record<PracticeMode, RoundRule> = {
  'wijs-aan': { kind: 'fixed', aantal: MAX_ROUND },
  meerkeuze: { kind: 'fixed', aantal: MAX_ROUND },
  'hoe-heet-dit': { kind: 'fixed', aantal: MAX_ROUND },
  bliksemronde: { kind: 'tijd', seconden: 60 },
  overleven: { kind: 'levens', levens: 3 },
};

/**
 * Which way a child answers. One mode types, one chooses, the rest point. Kept
 * separate from the mode so a future timed typing round is a table change, not
 * a rewrite.
 */
export function typesTheAnswer(mode: PracticeMode): boolean {
  return mode === 'hoe-heet-dit';
}

export function choosesTheAnswer(mode: PracticeMode): boolean {
  return mode === 'meerkeuze';
}

/**
 * Both of these show the map rather than ask a child to touch it. Choosing and
 * typing ask the same question — what is this place called — and differ only in
 * how much help the screen gives with the answer.
 */
export function readsTheMap(mode: PracticeMode): boolean {
  return typesTheAnswer(mode) || choosesTheAnswer(mode);
}

/** How many questions to prepare. An endless round still needs a finite pool. */
const ENDLESS_POOL = 60;

/**
 * The four names for one question, resolved from ids to items.
 *
 * A closure over the set rather than a function of it, because the two lookups
 * it builds are the same for every question in the round and rebuilding them
 * eighty times would be work for nothing.
 */
function optionDealer(all: readonly Item[]): (item: Item) => Item[] {
  const neighbours = loadNeighbours();
  const byId = new Map(all.map((item) => [item.id, item]));
  const pool = all.map((item) => item.id);

  return (item) => {
    const ids = buildOptions({
      answerId: item.id,
      neighbours: neighbours.get(item.id) ?? [],
      pool,
    });

    return ids.map((id) => byId.get(id)).filter((option): option is Item => option !== undefined);
  };
}

export const SET_IDS: readonly SetId[] = [
  'nl-provincies',
  'nl-hoofdsteden',
  'nl-waddeneilanden',
  'nl-wateren',
  'nl-steden',
];

/**
 * Everything on the map at once: the Topomix.
 *
 * Not a set in `content/sets` and deliberately not one. Its questions are the
 * same items with the same ids, so a province answered inside the mix moves the
 * same Leitner box as the same province answered inside the provinces — a sixth
 * file would have meant a child learning Drenthe twice to fill two boxes
 * (ADR-063).
 *
 * What it costs is that a round no longer has one answer layer. A question
 * about a province is answered on the provinces themselves; the next one, about
 * a capital, is answered on a layer of points over them. So the layer belongs
 * to the question rather than to the round, and every layer the round can reach
 * is loaded before the first question — five small files, none over nine
 * kilobytes.
 */
export const MIX_SET_ID = 'nl-mix';

/** A round is one set, or the mix of all of them. */
export type RoundSetId = SetId | typeof MIX_SET_ID;

export function isMixSet(id: string): id is typeof MIX_SET_ID {
  return id === MIX_SET_ID;
}

/** Which sets a round draws from. One, or all five. */
export function setsInRound(id: RoundSetId): readonly SetId[] {
  return isMixSet(id) ? SET_IDS : [id];
}

/**
 * What the child is being asked to find. It does not follow from `answers`:
 * capitals and seas are both points, but "wijs de stad aan" and "wijs het water
 * aan" are different sentences. Naming it per set beats inferring it, which is
 * how the water case ended up as a special case in the screen.
 */
export type Noemer = 'gebied' | 'stad' | 'eiland' | 'water';

/**
 * Written out per member rather than as `{ noemer } & (…)`, so narrowing on
 * `answers` needs nothing clever from the compiler.
 */
export type SetShape =
  | { readonly answers: 'background'; readonly noemer: Noemer }
  | { readonly answers: 'points'; readonly bestand: string; readonly noemer: Noemer }
  | {
      readonly answers: 'shapes';
      readonly bestand: string;
      readonly niveau: Detailniveau;
      readonly noemer: Noemer;
    };

/**
 * Names live in i18n; only the map behaviour belongs here. `answers` says what
 * the child is choosing between — the country itself, a layer of shapes on top
 * of it, or a layer of points — and carries the file that layer comes from, so
 * adding a set is one entry here rather than a branch at the load site.
 */
export const SETS: Record<SetId, SetShape> = {
  'nl-provincies': { answers: 'background', noemer: 'gebied' },
  'nl-hoofdsteden': { answers: 'points', bestand: 'hoofdsteden', noemer: 'stad' },
  'nl-waddeneilanden': {
    answers: 'shapes',
    bestand: 'waddeneilanden',
    niveau: 'detail',
    noemer: 'eiland',
  },
  'nl-wateren': { answers: 'points', bestand: 'wateren', noemer: 'water' },
  'nl-steden': { answers: 'points', bestand: 'steden', noemer: 'stad' },
};

/** One switch, so a new set cannot forget to load its own layer. */
export async function loadAnswerLayer(shape: SetShape): Promise<AnswerLayer> {
  switch (shape.answers) {
    case 'background':
      return { kind: 'background' };
    case 'points':
      return { kind: 'points', set: await loadPointSet(shape.bestand) };
    case 'shapes':
      return { kind: 'shapes', set: await loadGeoSet(shape.bestand, shape.niveau) };
  }
}

export interface RoundQuestion {
  readonly item: Item;
  /** Which set it came from, which decides the layer it is answered on. */
  readonly setId: SetId;
  /** The shape or point that answers it. */
  readonly answerId: string;
  /**
   * Meerkeuze only: the four names to choose between, in the order they are
   * shown, the right one among them. Dealt once when the round is composed —
   * a component that re-renders must not deal them again, or the options would
   * move under a child's finger.
   */
  readonly options: readonly Item[] | null;
}

export type RoundPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface RoundState {
  readonly phase: RoundPhase;
  readonly setId: RoundSetId;
  readonly practiceMode: PracticeMode;
  /**
   * What the child is being asked to find, for the question on screen.
   *
   * On the round rather than looked up from the set by the screen, because in
   * the mix the two disagree: one question asks for a province and the next for
   * a sea, and "wijs het gebied aan" over a dot in the North Sea is the wrong
   * sentence.
   */
  readonly noemer: Noemer;
  /** How this round ends. The result screen needs it: "9 van 60" is a lie in a
   * round that was never going to ask sixty. */
  readonly rule: RoundRule;
  /** The provinces, always: the country a child orients by. */
  readonly geo: GeoSet | null;
  /** What is being answered, ready for the canvas. */
  readonly answers: AnswerLayer | null;
  readonly namesById: ReadonlyMap<string, string>;
  readonly question: RoundQuestion | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly combo: number;
  readonly chosenId: string | null;
  readonly lastCorrect: boolean;
  /** Present after a typed answer: how it was judged (ADR-017). */
  readonly verdict: AnswerVerdict | null;
  /** Items answered wrongly, for the result screen. */
  readonly missed: readonly Item[];
  /**
   * How many more items in this set the child now remembers than when the round
   * started. Never negative: a round can move an item down a box, and telling a
   * child they finished with less than they began is not what this figure is
   * for. It reports what was gained, or nothing.
   */
  readonly gained: number;
  readonly answeredCount: number;
  /** Bliksemronde only: whole seconds left, or null in every other mode. */
  readonly secondsLeft: number | null;
  /** Overleven only: lives remaining, or null in every other mode. */
  readonly livesLeft: number | null;
  /** Set once the round ends: the streak after this round, and how it got there. */
  readonly streak: StreakChange | null;
  /** Set once the round ends: what it earned. */
  readonly reward: RoundOutcome | null;
  readonly error: string | null;
}

export function useRound(setId: RoundSetId, practiceMode: PracticeMode) {
  const [geo, setGeo] = useState<GeoSet | null>(null);
  /** One layer per set the round can reach. A single set leaves one entry. */
  const [layers, setLayers] = useState<ReadonlyMap<SetId, AnswerLayer>>(new Map());
  const [items, setItems] = useState<Item[]>([]);
  /**
   * Everything in the same region, not just this round's set. ADR-017 is
   * explicit that an answer must not be right or wrong depending on which
   * exercise a child happens to be doing: writing "Drenthe" when asked for a
   * capital is naming a real place, and deserves "bijna" rather than a cross.
   */
  const [catalogue, setCatalogue] = useState<Item[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  /**
   * How many items in this set were remembered before the round started.
   *
   * K8's whole point: the score is what happened, and what changed is the
   * product. Without a reading from before, "two more than when you sat down"
   * cannot be said — and it is the only sentence on that screen a child could
   * not have worked out for themselves.
   */
  const masteredAtStart = useRef(0);
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('loading');
  const [chosenId, setChosen] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missed, setMissed] = useState<Item[]>([]);
  const rule = ROUND_RULE[practiceMode];
  const [secondsLeft, setSecondsLeft] = useState(rule.kind === 'tijd' ? rule.seconden : 0);
  const [livesLeft, setLivesLeft] = useState(rule.kind === 'levens' ? rule.levens : 0);
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [streak, setStreak] = useState<StreakChange | null>(null);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  /** Correct answers given while five or more were already right in a row. */
  const [comboAnswers, setComboAnswers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef<number>(0);
  /**
   * Wall-clock end of a bliksemronde, set once when the round starts. A counter
   * that decrements on a tick loses whatever the tick was late by, and over
   * sixty seconds on a school Chromebook that is not nothing.
   */
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const wanted = setsInRound(setId);
        const sets = loadItemSets().filter((candidate) =>
          (wanted as readonly string[]).includes(candidate.id),
        );
        if (sets.length === 0) throw new Error(`Onbekende set: ${setId}`);

        const [loadedGeo, loadedLayers, loadedStates] = await Promise.all([
          loadGeoSet('provincies', 'region'),
          Promise.all(sets.map((set) => loadAnswerLayer(SETS[set.id as SetId]))),
          loadItemStates(),
        ]);
        if (cancelled) return;

        const layerBySet = new Map<SetId, AnswerLayer>(
          sets.map((set, at) => [set.id as SetId, loadedLayers[at] as AnswerLayer]),
        );

        // Which set an item came from, so the question can be answered on the
        // right layer and asked in the right words.
        const setOfItem = new Map<string, SetId>();
        for (const set of sets) {
          for (const item of set.items) setOfItem.set(item.id, set.id as SetId);
        }

        const all = sets
          .flatMap((set) => set.items)
          .filter((item) => item.geometrieRef !== undefined);
        const picked = composeRound({
          items: all,
          states: loadedStates,
          size: Math.min(all.length, rule.kind === 'fixed' ? rule.aantal : ENDLESS_POOL),
          now: new Date(),
        });

        // Dealt here rather than per render: options that move under a child's
        // finger are worse than no options. Only built for the mode that has
        // them, so the other four never touch the neighbour lists.
        //
        // One dealer per set, not one over everything. Three provinces beside a
        // capital are not four answers to the same question — they are a give-
        // away — and in the mix a single pool would hand out exactly that.
        const dealers = choosesTheAnswer(practiceMode)
          ? new Map(
              sets.map((set) => [
                set.id as SetId,
                optionDealer(set.items.filter((item) => item.geometrieRef !== undefined)),
              ]),
            )
          : null;

        const round = picked.map((item) => {
          const from = setOfItem.get(item.id) as SetId;
          return {
            item,
            setId: from,
            answerId: item.geometrieRef as string,
            options: dealers ? (dealers.get(from)?.(item) ?? null) : null,
          };
        });

        sessionId.current = await startSession(
          practiceMode,
          round.map((question) => question.item.id),
          setId,
        );
        if (cancelled) return;

        setGeo(loadedGeo);
        setLayers(layerBySet);
        setItems([...all]);
        setCatalogue(loadAllItems().filter((item) => item.regioSet === sets[0]?.regioSet));
        setStates(loadedStates);
        masteredAtStart.current = countMastered(
          loadedStates,
          all.map((item) => item.id),
        );
        setQuestions(round);
        setPhase(round.length > 0 ? 'asking' : 'finished');
        askedAt.current = performance.now();
        if (rule.kind === 'tijd') deadline.current = Date.now() + rule.seconden * 1000;
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setId, rule, practiceMode]);

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.geometrieRef) map.set(item.geometrieRef, item.naam);
    }
    // In points mode the provinces are still drawn, and a screen reader should
    // not read a dimmed background shape as if it were an answer — but a name
    // is better than a source spelling if it ever does.
    return map;
  }, [items]);

  const question = questions[index] ?? null;

  /** One answer, however it was given: pointed at or typed. */
  const settle = useCallback(
    (params: {
      readonly correct: boolean;
      /** What to light up as the child's answer, if anything. */
      readonly chosenForMap: string | null;
      /** Stored on the attempt for later item analysis. */
      readonly recorded: string | null;
      readonly judged: AnswerVerdict | null;
      /**
       * False only for "ik weet het niet". Every other wrong answer costs one:
       * three lives are what makes overleven a survival round.
       */
      readonly spendsALife: boolean;
    }) => {
      if (phase !== 'asking' || !question || !sessionId.current) return;

      const { correct } = params;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(question.item.id) ?? emptyState(question.item.id);
      const nextState = review(previous, correct, new Date());

      setChosen(params.chosenForMap);
      setVerdict(params.judged);
      setLastCorrect(correct);
      setPhase('revealed');
      const nextCombo = correct ? combo + 1 : 0;
      setCombo(nextCombo);
      if (nextCombo >= COMBO_THRESHOLD) setComboAnswers(comboAnswers + 1);
      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, question.item]);

      setStates(new Map(states).set(question.item.id, nextState));

      if (!correct && params.spendsALife && rule.kind === 'levens') setLivesLeft(livesLeft - 1);

      void saveAnswer({
        sessionId: sessionId.current,
        mode: practiceMode,
        itemId: question.item.id,
        correct,
        responseMs,
        chosen: params.recorded,
        nextState,
      });
    },
    [
      phase,
      question,
      states,
      combo,
      comboAnswers,
      correctCount,
      answeredCount,
      missed,
      rule,
      livesLeft,
      practiceMode,
    ],
  );

  /** "Aanwijzen": the child pointed at a shape or a city. */
  const pick = useCallback(
    (answerId: string) => {
      if (!question) return;
      const correct = answerId === question.answerId;
      settle({
        correct,
        chosenForMap: answerId,
        recorded: correct ? null : answerId,
        judged: null,
        spendsALife: true,
      });
    },
    [question, settle],
  );

  /**
   * "Meerkeuze": the child picked one of four names.
   *
   * A wrong pick travels to the map, the same way a near miss does when typing:
   * "you said Drenthe, and Drenthe is here" teaches something, where a red cross
   * beside a word teaches nothing. There is no near miss to judge — every option
   * on the screen was put there by us, so a wrong one is simply wrong.
   */
  const choose = useCallback(
    (itemId: string) => {
      if (!question) return;

      const correct = itemId === question.item.id;
      const chosen = items.find((candidate) => candidate.id === itemId);

      settle({
        correct,
        chosenForMap: chosen?.geometrieRef ?? null,
        recorded: correct ? null : itemId,
        judged: null,
        spendsALife: true,
      });
    },
    [question, items, settle],
  );

  /**
   * "Ik weet het niet". Drawn on K3 at every size, and it does something no
   * other control does: it lets a child stop guessing.
   *
   * Scored as not known, because that is what it is — the item goes back to box
   * one and the round counts it among the answered. What it does not do is cost
   * a life. A button that costs exactly what a wrong guess costs is a button
   * nobody presses, because a guess is right one time in twelve; making it
   * cheaper is what buys the honesty, and honesty is what the scheduler needs.
   *
   * In a bliksemronde it still costs the seconds it took, which is the pressure
   * that round already applies and enough of it.
   */
  const giveUp = useCallback(() => {
    settle({
      correct: false,
      chosenForMap: null,
      // Its own value, not 'onbekend': "I did not know" and "you typed
      // something that is not a place" are different things to have done, and
      // an attempt row that cannot tell them apart cannot be read later.
      recorded: 'weet-niet',
      judged: null,
      spendsALife: false,
    });
  }, [settle]);

  /**
   * "Hoe heet dit": the child typed a name. ADR-017 decides, and a near miss —
   * naming a different real place — is scored wrong but shown as its own thing.
   */
  const submit = useCallback(
    (typed: string) => {
      if (!question) return;

      const judged = judgeAnswer(typed, question.item, catalogue);
      const correct = judged.kind === 'correct';

      // On a near miss the map travels from the place they named to the right
      // one, which is the same lesson the pointing mode gives for free.
      const confused =
        judged.kind === 'near-miss' ? (judged.confusedWith.geometrieRef ?? null) : null;

      settle({
        correct,
        chosenForMap: confused,
        // The normalised text, never raw input: an attempt row is data, and a
        // free-text column is how a data model quietly grows one.
        recorded: correct
          ? null
          : judged.kind === 'near-miss'
            ? judged.confusedWith.id
            : 'onbekend',
        judged,
        spendsALife: true,
      });
    },
    [question, catalogue, settle],
  );

  const finish = useCallback(() => {
    // The clock, the last life and the stop button can all arrive at once.
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount, answeredCount);

    // A round counts for the day even when it was stopped early: the child
    // turned up and did the work, which is the only thing a streak measures.
    void recordRoundFinished().then((change) => {
      setStreak(change);

      const ids = items.map((item) => item.id);
      void applyRoundRewards({
        correct: correctCount,
        answered: answeredCount,
        comboAnswers,
        snapshot: {
          setId,
          perfectRound: answeredCount > 0 && correctCount === answeredCount,
          // The badge asks for the whole set, not a round stopped while ahead.
          completeRound: answeredCount === questions.length,
          streakDays: change.state.huidigeStreak,
          mastered: countMastered(states, ids),
          setSize: ids.length,
          roundsFinished: 1,
          mode: practiceMode,
          correct: correctCount,
        },
      }).then(setReward);
    });
  }, [
    phase,
    correctCount,
    answeredCount,
    comboAnswers,
    items,
    questions.length,
    setId,
    states,
    practiceMode,
  ]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    // Out of lives, or out of questions. A timed round ends on the clock
    // instead, which is handled by the interval below.
    if ((rule.kind === 'levens' && livesLeft <= 0) || index + 1 >= questions.length) {
      finish();
      return;
    }

    setIndex(index + 1);
    setChosen(null);
    setVerdict(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions.length, finish, rule, livesLeft]);

  /**
   * The clock. Ticks four times a second so the number on screen is not up to a
   * second behind what it claims, and reads the deadline rather than counting
   * down, so a busy frame costs no time.
   *
   * WCAG 2.2.1 asks that time limits be adjustable, with an exception where the
   * limit is essential to the activity. Here it is the activity: a bliksemronde
   * without a clock is just wijs-aan. The other three modes have no clock at
   * all, so nothing a child needs is behind a timer.
   */
  useEffect(() => {
    if (rule.kind !== 'tijd') return;
    if (phase === 'loading' || phase === 'finished') return;

    const tick = () => {
      const over = Math.max(0, Math.ceil(((deadline.current ?? 0) - Date.now()) / 1000));
      setSecondsLeft(over);
      if (over === 0) finish();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [rule, phase, finish]);

  /**
   * A lightning round moves on by itself: making a child press Volgende while a
   * clock runs is charging them for the button. A wrong answer gets twice as
   * long, because the thing worth seeing is where it actually was.
   */
  useEffect(() => {
    if (rule.kind !== 'tijd' || phase !== 'revealed') return;
    const id = setTimeout(next, lastCorrect ? 900 : 1800);
    return () => clearTimeout(id);
  }, [rule, phase, lastCorrect, next]);

  /** Ends the round early. What was answered is already saved. */
  const stop = useCallback(() => {
    if (phase === 'finished') return;
    finish();
  }, [phase, finish]);

  const state: RoundState = {
    phase,
    setId,
    noemer: SETS[question?.setId ?? (isMixSet(setId) ? 'nl-provincies' : setId)].noemer,
    practiceMode,
    rule,
    geo,
    // The layer the question on screen is answered on. Falls back to the last
    // question rather than to nothing, because the result screen draws a map
    // after the questions have run out and a null layer there is a blank one.
    answers: (() => {
      const op = question ?? questions[questions.length - 1] ?? null;
      return op === null ? null : (layers.get(op.setId) ?? null);
    })(),
    namesById,
    question,
    index,
    total: questions.length,
    correctCount,
    combo,
    chosenId,
    lastCorrect,
    verdict,
    missed,
    gained: Math.max(
      0,
      countMastered(
        states,
        items.map((item) => item.id),
      ) - masteredAtStart.current,
    ),
    answeredCount,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    streak,
    reward,
    error,
  };

  return { state, pick, choose, submit, giveUp, next, stop };
}
