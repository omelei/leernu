import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COMBO_THRESHOLD,
  composeRound,
  countMastered,
  emptyState,
  judgeSum,
  review,
  sumDistractors,
  type ItemState,
  type StreakChange,
  type SumItem,
  type SumSet,
} from '@/game-core';
import { loadSumSet } from '@/content/loadSums';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { recordRoundFinished } from '@/store/streakStore';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';

/**
 * One round of tables.
 *
 * This is a second copy of the round wiring, and that is a decision rather than
 * an accident (ADR-049). `useRound` is six hundred lines of map: geometry to
 * load, an answer layer, a name index, near misses, touch targets. A round of
 * sums shares none of it and shares the two things that matter — the Leitner
 * schedule and what gets written down — by importing them.
 *
 * Pulling a common round out of the two now would mean guessing which parts are
 * general from a sample of two, and the guess would be made under the map's
 * shape because the map got there first. The third module is when that guess
 * becomes an observation.
 *
 * A round is the whole table. Ten sums is what a table has and what the design
 * puts on the module card, and "de tafel van 7 ken ik" is only sayable about
 * all of it.
 */

export type SumMode = 'som-typen' | 'som-meerkeuze';

/**
 * Typing first, choosing second, and the opposite way round from topography.
 *
 * On a map, choosing between four names is easier than producing one, so it
 * comes first. A number is different: the four options are all plausible
 * products and a child who cannot do the sum can still often reject three, so
 * multiple choice measures less here than typing does. It is the way back in
 * when typing is going badly, not the way in.
 */
export const SUM_MODES: readonly SumMode[] = ['som-typen', 'som-meerkeuze'];

export function typesTheSum(mode: SumMode): boolean {
  return mode === 'som-typen';
}

export type SumPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface SumQuestion {
  readonly sum: SumItem;
  /** Meerkeuze only: four numbers, the right one among them, in shown order. */
  readonly options: readonly number[] | null;
}

export interface SumRoundState {
  readonly phase: SumPhase;
  readonly set: SumSet | null;
  readonly mode: SumMode;
  readonly question: SumQuestion | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly answeredCount: number;
  readonly combo: number;
  /** What the child answered, or null when they said they did not know. */
  readonly given: number | null;
  readonly lastCorrect: boolean;
  readonly missed: readonly SumItem[];
  /** How many more sums in this table the child now remembers. Never negative. */
  readonly gained: number;
  readonly streak: StreakChange | null;
  readonly reward: RoundOutcome | null;
  readonly error: string | null;
}

/** Four options: the answer and three wrong ones, dealt once. */
function optionsFor(sum: SumItem, rng: () => number): number[] {
  const all = [sum.antwoord, ...sumDistractors(sum)];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = all[i] as number;
    const b = all[j] as number;
    all[i] = b;
    all[j] = a;
  }
  return all;
}

export function useSumRound(setId: string, mode: SumMode) {
  const [set, setSet] = useState<SumSet | null>(null);
  const [questions, setQuestions] = useState<SumQuestion[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [phase, setPhase] = useState<SumPhase>('loading');
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboAnswers, setComboAnswers] = useState(0);
  const [missed, setMissed] = useState<SumItem[]>([]);
  const [streak, setStreak] = useState<StreakChange | null>(null);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef(0);
  const masteredAtStart = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const loaded = loadSumSet(setId);
        if (!loaded) throw new Error(`Onbekende tafel: ${setId}`);

        const loadedStates = await loadItemStates();
        if (cancelled) return;

        // The whole table, in the order the scheduler wants it: what a child
        // keeps missing comes round first even inside ten sums.
        const picked = composeRound({
          items: loaded.items,
          states: loadedStates,
          size: loaded.items.length,
          now: new Date(),
        });

        const round = picked.map((sum) => ({
          sum,
          options: mode === 'som-meerkeuze' ? optionsFor(sum, Math.random) : null,
        }));

        sessionId.current = await startSession(
          mode,
          round.map((question) => question.sum.id),
        );
        if (cancelled) return;

        masteredAtStart.current = countMastered(
          loadedStates,
          loaded.items.map((sum) => sum.id),
        );

        setSet(loaded);
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
  }, [setId, mode]);

  const question = questions[index] ?? null;

  /** One answer, however it arrived: typed, chosen, or not given at all. */
  const settle = useCallback(
    (answer: number | null) => {
      if (phase !== 'asking' || !question || !sessionId.current) return;

      const correct = answer !== null && answer === question.sum.antwoord;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(question.sum.id) ?? emptyState(question.sum.id);
      const nextState = review(previous, correct, new Date());

      setGiven(answer);
      setLastCorrect(correct);
      setPhase('revealed');

      const nextCombo = correct ? combo + 1 : 0;
      setCombo(nextCombo);
      if (nextCombo >= COMBO_THRESHOLD) setComboAnswers(comboAnswers + 1);
      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, question.sum]);

      setStates(new Map(states).set(question.sum.id, nextState));

      void saveAnswer({
        sessionId: sessionId.current,
        mode,
        itemId: question.sum.id,
        correct,
        responseMs,
        // ADR-048's distinction, in the other module: not knowing and getting
        // it wrong are different things to have done.
        chosen: correct ? null : answer === null ? 'weet-niet' : String(answer),
        nextState,
      });
    },
    [phase, question, states, combo, comboAnswers, answeredCount, correctCount, missed, mode],
  );

  const submit = useCallback(
    (typed: string) => {
      if (!question) return;
      const cleaned = typed.trim().replace(/\s+/g, '');
      // Judged by game-core so the rule lives in one place; parsed here only to
      // show the child what they answered.
      const correct = judgeSum(typed, question.sum);
      settle(correct ? question.sum.antwoord : Number(cleaned));
    },
    [question, settle],
  );

  const choose = useCallback((value: number) => settle(value), [settle]);
  const giveUp = useCallback(() => settle(null), [settle]);

  const finish = useCallback(() => {
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount);

    void recordRoundFinished().then((change) => {
      setStreak(change);

      const ids = (set?.items ?? []).map((sum) => sum.id);
      void applyRoundRewards({
        correct: correctCount,
        answered: answeredCount,
        comboAnswers,
        snapshot: {
          setId,
          perfectRound: answeredCount > 0 && correctCount === answeredCount,
          completeRound: answeredCount === questions.length,
          streakDays: change.state.huidigeStreak,
          mastered: countMastered(states, ids),
          setSize: ids.length,
          roundsFinished: 1,
          mode,
          correct: correctCount,
        },
      }).then(setReward);
    });
  }, [phase, correctCount, answeredCount, comboAnswers, set, setId, mode, questions, states]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;
    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    setIndex(index + 1);
    setGiven(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions, finish]);

  const state: SumRoundState = {
    phase,
    set,
    mode,
    question,
    index,
    total: questions.length,
    correctCount,
    answeredCount,
    combo,
    given,
    lastCorrect,
    missed,
    gained: Math.max(
      0,
      countMastered(
        states,
        (set?.items ?? []).map((sum) => sum.id),
      ) - masteredAtStart.current,
    ),
    streak,
    reward,
    error,
  };

  return { state, submit, choose, giveUp, next, stop: finish };
}
