import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  composeRound,
  emptyState,
  judgeAnswer,
  review,
  type AnswerVerdict,
  type Item,
  type ItemState,
} from '@/game-core';
import { loadGeoSet, loadPointSet, type GeoSet, type PointSet } from '@/content/loadGeo';
import { loadAllItems, loadItemSets } from '@/content/loadSets';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { recordRoundFinished } from '@/store/streakStore';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';
import { COMBO_THRESHOLD, countMastered } from '@/game-core';
import type { StreakChange } from '@/game-core';
import type { AnswerLayer } from './MapCanvas';

/**
 * One round of "wijs aan".
 *
 * A round covers the **whole set** — all twelve provinces, all twelve capitals
 * — rather than a sample. For a set this size that is the honest thing to do:
 * a child asked ten of twelve cannot tell which two they were let off, and
 * "ik ken ze allemaal" is the thing they are actually working towards.
 *
 * The order still comes from the Leitner scheduler, so the items a child keeps
 * missing come round first. Everything is written to the device as it happens: a
 * child who closes the tab halfway keeps what they answered.
 */

export type SetId = 'nl-provincies' | 'nl-hoofdsteden' | 'nl-waddeneilanden';

/**
 * How a child answers. Pointing tests where something is; typing tests whether
 * they can name it, which is a different thing and often the harder one.
 */
export type PracticeMode = 'wijs-aan' | 'hoe-heet-dit';

export const PRACTICE_MODES: readonly PracticeMode[] = ['wijs-aan', 'hoe-heet-dit'];

export const SET_IDS: readonly SetId[] = [
  'nl-provincies',
  'nl-hoofdsteden',
  'nl-waddeneilanden',
];

/**
 * Names live in i18n; only the map behaviour belongs here. `answers` says what
 * the child is choosing between — the country itself, a layer of shapes on top
 * of it, or a layer of points.
 */
export const SETS: Record<SetId, { readonly answers: 'background' | 'shapes' | 'points' }> = {
  'nl-provincies': { answers: 'background' },
  'nl-hoofdsteden': { answers: 'points' },
  'nl-waddeneilanden': { answers: 'shapes' },
};

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
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [streak, setStreak] = useState<StreakChange | null>(null);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  /** Correct answers given while five or more were already right in a row. */
  const [comboAnswers, setComboAnswers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef<number>(0);
  const layer = SETS[setId].answers;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const set = loadItemSets().find((candidate) => candidate.id === setId);
        if (!set) throw new Error(`Onbekende set: ${setId}`);

        const [loadedGeo, loadedAnswers, loadedStates] = await Promise.all([
          loadGeoSet('provincies', 'region'),
          layer === 'points'
            ? loadPointSet('hoofdsteden').then((set) => ({ kind: 'points', set }) as AnswerLayer)
            : layer === 'shapes'
              ? loadGeoSet('waddeneilanden', 'detail').then(
                  (set) => ({ kind: 'shapes', set }) as AnswerLayer,
                )
              : Promise.resolve({ kind: 'background' } as AnswerLayer),
          loadItemStates(),
        ]);
        if (cancelled) return;

        const all = set.items.filter((item) => item.geometrieRef !== undefined);
        const picked = composeRound({
          items: all,
          states: loadedStates,
          size: all.length,
          now: new Date(),
        });

        const round = picked.map((item) => ({
          item,
          answerId: item.geometrieRef as string,
        }));

        sessionId.current = await startSession(
          'wijs-aan',
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
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setId, layer]);

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

      void saveAnswer({
        sessionId: sessionId.current,
        mode: 'wijs-aan',
        itemId: question.item.id,
        correct,
        responseMs,
        chosen: params.recorded,
        nextState,
      });
    },
    [phase, question, states, combo, comboAnswers, correctCount, answeredCount, missed],
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
        recorded: correct ? null : (judged.kind === 'near-miss' ? judged.confusedWith.id : 'onbekend'),
        judged,
      });
    },
    [question, catalogue, settle],
  );

  const finish = useCallback(() => {
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
        },
      }).then(setReward);
    });
  }, [correctCount, answeredCount, comboAnswers, items, questions.length, setId, states]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    if (index + 1 >= questions.length) {
      finish();
      return;
    }

    setIndex(index + 1);
    setChosen(null);
    setVerdict(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions.length, finish]);

  /** Ends the round early. What was answered is already saved. */
  const stop = useCallback(() => {
    if (phase === 'finished') return;
    finish();
  }, [phase, finish]);

  const state: RoundState = {
    phase,
    setId,
    practiceMode,
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
    streak,
    reward,
    error,
  };

  return { state, pick, submit, next, stop };
}
