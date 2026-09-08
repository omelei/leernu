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
  type RoundRule,
  type StreakChange,
  type SumItem,
  type SumSet,
} from '@/game-core';
import { loadSumSet, loadSumSets } from '@/content/loadSums';
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

export type SumMode = 'som-typen' | 'som-meerkeuze' | 'bliksemronde' | 'overleven';

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

/**
 * A clock and three lives, the same two the map offers and for the same reason
 * (ADR-021): pressure, and neither of them punishes.
 *
 * They run over all twelve tables rather than the chosen one. A table is ten
 * sums, and a lightning round that runs out of questions after eleven seconds
 * is not a lightning round — what the clock is for is a child who already knows
 * them meeting them all in one go.
 */
export const SUM_CHALLENGE_MODES: readonly SumMode[] = ['bliksemronde', 'overleven'];

export const SUM_ROUND_RULE: Record<SumMode, RoundRule> = {
  'som-typen': { kind: 'fixed', aantal: 10 },
  'som-meerkeuze': { kind: 'fixed', aantal: 10 },
  bliksemronde: { kind: 'tijd', seconden: 60 },
  overleven: { kind: 'levens', levens: 3 },
};

/**
 * Which way a child answers. Typing everywhere except the one mode built to be
 * easier — including under the clock, because choosing between four numbers
 * against a stopwatch measures reading speed rather than the table.
 */
export function typesTheSum(mode: SumMode): boolean {
  return mode !== 'som-meerkeuze';
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
  /** How this round ends. The result screen needs it to count honestly. */
  readonly rule: RoundRule;
  /** Bliksemronde only: whole seconds left. */
  readonly secondsLeft: number | null;
  /** Overleven only: lives remaining. */
  readonly livesLeft: number | null;
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

  const rule = SUM_ROUND_RULE[mode];
  const [secondsLeft, setSecondsLeft] = useState(rule.kind === 'tijd' ? rule.seconden : 0);
  const [livesLeft, setLivesLeft] = useState(rule.kind === 'levens' ? rule.levens : 0);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef(0);
  const masteredAtStart = useRef(0);
  /**
   * Wall-clock end of a timed round, set once. Counting down on a tick loses
   * whatever each tick was late by, and over sixty seconds on a school
   * Chromebook that is not nothing.
   */
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const loaded = loadSumSet(setId);
        if (!loaded) throw new Error(`Onbekende tafel: ${setId}`);

        const loadedStates = await loadItemStates();
        if (cancelled) return;

        // A fixed round is the chosen table. A round that ends on a clock or on
        // lives draws from all twelve, because ten sums would run out long
        // before the minute does — and a child who reaches for the clock is one
        // who already knows a table, not one still learning this one.
        const pool =
          rule.kind === 'fixed' ? loaded.items : loadSumSets().flatMap((set) => set.items);

        // In the order the scheduler wants it: what a child keeps missing comes
        // round first, even inside ten sums.
        const picked = composeRound({
          items: pool,
          states: loadedStates,
          size: rule.kind === 'fixed' ? rule.aantal : pool.length,
          now: new Date(),
        });

        const round = picked.map((sum) => ({
          sum,
          options: typesTheSum(mode) ? null : optionsFor(sum, Math.random),
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
        if (rule.kind === 'tijd') deadline.current = Date.now() + rule.seconden * 1000;
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setId, mode, rule]);

  const question = questions[index] ?? null;

  /** One answer, however it arrived: typed, chosen, or not given at all. */
  const settle = useCallback(
    (answer: number | null, spendsALife = true) => {
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

      if (!correct && spendsALife && rule.kind === 'levens') setLivesLeft(livesLeft - 1);

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
    [
      phase,
      question,
      states,
      combo,
      comboAnswers,
      answeredCount,
      correctCount,
      missed,
      mode,
      rule,
      livesLeft,
    ],
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
  const giveUp = useCallback(() => settle(null, false), [settle]);

  const finish = useCallback(() => {
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount, answeredCount);

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

    // Out of lives, or out of questions. A timed round ends on the clock
    // instead, which is the interval below.
    if ((rule.kind === 'levens' && livesLeft <= 0) || index + 1 >= questions.length) {
      finish();
      return;
    }

    setIndex(index + 1);
    setGiven(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions, finish, rule, livesLeft]);

  /**
   * The clock. Four ticks a second so the number is not up to a second behind
   * what it claims, and it reads the deadline rather than counting down, so a
   * busy frame costs no time.
   *
   * WCAG 2.2.1 wants time limits adjustable, with an exception where the limit
   * is the activity. Here it is: a bliksemronde without a clock is just typing.
   * The two learning modes have no clock at all.
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
   * A timed round moves on by itself: making a child press Volgende while a
   * clock runs is charging them for the button. A wrong answer gets twice as
   * long, because the thing worth seeing is what it actually was.
   */
  useEffect(() => {
    if (rule.kind !== 'tijd' || phase !== 'revealed') return;
    const id = setTimeout(next, lastCorrect ? 900 : 1800);
    return () => clearTimeout(id);
  }, [rule, phase, lastCorrect, next]);

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
    rule,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    streak,
    reward,
    error,
  };

  return { state, submit, choose, giveUp, next, stop: finish };
}
