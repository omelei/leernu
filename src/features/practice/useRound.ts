import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  composeRound,
  COMBO_THRESHOLD,
  countMastered,
  emptyState,
  judgeAnswer,
  review,
  type AnswerVerdict,
  type Item,
  type ItemState,
  type StreakChange,
} from '@/game-core';
import { loadGeoSet, loadPointSet, type Detailniveau, type GeoSet } from '@/content/loadGeo';
import { loadAllItems, loadItemSets } from '@/content/loadSets';
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
 * How a child answers. Pointing tests where something is; typing tests whether
 * they can name it, which is a different thing and often the harder one.
 */
export type PracticeMode = 'wijs-aan' | 'hoe-heet-dit' | 'bliksemronde' | 'overleven';

/**
 * Split by what a child is doing, not by how the hook implements it. The first
 * two are practice; the last two are practice with pressure on top and belong
 * behind the ones a child should start with.
 */
export const LEARNING_MODES: readonly PracticeMode[] = ['wijs-aan', 'hoe-heet-dit'];
export const CHALLENGE_MODES: readonly PracticeMode[] = ['bliksemronde', 'overleven'];

/**
 * How a round ends. This is the only thing the two new modes change — the map,
 * the judging and the scheduler are identical — so it is worth being a value
 * rather than a set of `if (mode === …)` scattered through the hook.
 *
 * `vast` asks a list and stops. `tijd` and `levens` keep asking until the clock
 * or the lives run out, so they draw from the whole set rather than a round's
 * worth.
 */
export type RoundRule =
  | { readonly kind: 'vast'; readonly aantal: number }
  | { readonly kind: 'tijd'; readonly seconden: number }
  | { readonly kind: 'levens'; readonly levens: number };

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
  'wijs-aan': { kind: 'vast', aantal: MAX_ROUND },
  'hoe-heet-dit': { kind: 'vast', aantal: MAX_ROUND },
  bliksemronde: { kind: 'tijd', seconden: 60 },
  overleven: { kind: 'levens', levens: 3 },
};

/**
 * Which way a child answers. Only one mode types; the rest point. Kept separate
 * from the mode so a future timed typing round is a table change, not a rewrite.
 */
export function typesTheAnswer(mode: PracticeMode): boolean {
  return mode === 'hoe-heet-dit';
}

/** How many questions to prepare. An endless round still needs a finite pool. */
const ENDLESS_POOL = 60;

export const SET_IDS: readonly SetId[] = [
  'nl-provincies',
  'nl-hoofdsteden',
  'nl-waddeneilanden',
  'nl-wateren',
  'nl-steden',
];

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
  /** The shape or point that answers it. */
  readonly answerId: string;
}

export type RoundPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface RoundState {
  readonly phase: RoundPhase;
  readonly setId: SetId;
  readonly practiceMode: PracticeMode;
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

export function useRound(setId: SetId, practiceMode: PracticeMode) {
  const [geo, setGeo] = useState<GeoSet | null>(null);
  const [answers, setAnswers] = useState<AnswerLayer | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  /**
   * Everything in the same region, not just this round's set. ADR-017 is
   * explicit that an answer must not be right or wrong depending on which
   * exercise a child happens to be doing: writing "Drenthe" when asked for a
   * capital is naming a real place, and deserves "bijna" rather than a cross.
   */
  const [catalogue, setCatalogue] = useState<Item[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
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
  const shape = SETS[setId];

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const set = loadItemSets().find((candidate) => candidate.id === setId);
        if (!set) throw new Error(`Onbekende set: ${setId}`);

        const [loadedGeo, loadedAnswers, loadedStates] = await Promise.all([
          loadGeoSet('provincies', 'region'),
          loadAnswerLayer(shape),
          loadItemStates(),
        ]);
        if (cancelled) return;

        const all = set.items.filter((item) => item.geometrieRef !== undefined);
        const picked = composeRound({
          items: all,
          states: loadedStates,
          size: Math.min(all.length, rule.kind === 'vast' ? rule.aantal : ENDLESS_POOL),
          now: new Date(),
        });

        const round = picked.map((item) => ({
          item,
          answerId: item.geometrieRef as string,
        }));

        sessionId.current = await startSession(
          practiceMode,
          round.map((question) => question.item.id),
        );
        if (cancelled) return;

        setGeo(loadedGeo);
        setAnswers(loadedAnswers);
        setItems([...all]);
        setCatalogue(loadAllItems().filter((item) => item.regioSet === set.regioSet));
        setStates(loadedStates);
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
  }, [setId, shape, rule, practiceMode]);

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

      if (!correct && rule.kind === 'levens') setLivesLeft(livesLeft - 1);

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

  /** "Wijs aan": the child pointed at a shape or a city. */
  const pick = useCallback(
    (answerId: string) => {
      if (!question) return;
      const correct = answerId === question.answerId;
      settle({
        correct,
        chosenForMap: answerId,
        recorded: correct ? null : answerId,
        judged: null,
      });
    },
    [question, settle],
  );

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
      });
    },
    [question, catalogue, settle],
  );

  const finish = useCallback(() => {
    // The clock, the last life and the stop button can all arrive at once.
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount);

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
    practiceMode,
    rule,
    geo,
    answers,
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
    answeredCount,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    streak,
    reward,
    error,
  };

  return { state, pick, submit, next, stop };
}
