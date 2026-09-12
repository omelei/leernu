import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  COMBO_THRESHOLD,
  countMastered,
  emptyState,
  review,
  type ItemState,
  type ModeId,
  type RoundRule,
  type Schedulable,
  type StreakChange,
} from '@/game-core';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { recordRoundFinished } from '@/store/streakStore';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';

/**
 * The bookkeeping of a round, once, for every module that asks one question at
 * a time on a stage of its own.
 *
 * ADR-092 wrote this down as owed: the tables and the clock each carried the
 * same hundred lines between composing a round and handing out its rewards —
 * the index, the phase, the counts, the combo, the lives, the clock, the
 * toetsstand, the session record — and a fourth module would have made it four.
 * What a module still owns is the question: which items, in which order, with
 * which options, and how an answer is judged. It hands the core a composed
 * round and a verdict per answer; the core does the rest the same way for all
 * of them (ADR-101).
 *
 * The map's round is not on it, and that is a decision rather than a gap. It
 * answers on layers, judges near misses and draws a mix across sets, and those
 * are threaded through its bookkeeping rather than beside it. Moving it here
 * would be a change to the most-used round in the product for no child-visible
 * gain.
 */

export type RondeFase = 'loading' | 'asking' | 'revealed' | 'finished';

/** What a module hands the core once it knows what the round will ask. */
export interface RondeOpzet<S, Q> {
  readonly set: S;
  /**
   * The set's own items. "Gained" and the rewards count over these and never
   * over a wider pool: a minute of tables that reached into all twelve still
   * reports what moved in the one that was chosen.
   */
  readonly itemIds: readonly string[];
  readonly questions: readonly Q[];
}

export interface RondeKernOpties<S, Q, T extends Schedulable> {
  readonly setId: string;
  readonly mode: ModeId;
  /**
   * How a round of this way ends when nobody chooses a length. Must be a stable
   * object — a value from a module's rule table — because the round is composed
   * again whenever it changes.
   */
  readonly basisRegel: RoundRule;
  /** The length a child chose, or null. Only replaces a fixed round's own. */
  readonly aantal: number | null;
  readonly toetsstand: boolean;
  /**
   * Composes the round from the boxes. Called once per set, way and rule; may
   * throw, and what it throws is shown rather than crashing the screen.
   */
  readonly stel: (
    states: ReadonlyMap<string, ItemState>,
    rule: RoundRule,
  ) => RondeOpzet<S, Q> | Promise<RondeOpzet<S, Q>>;
  /** The item a question is about. Must be stable: a function at module level. */
  readonly itemVan: (question: Q) => T;
  /** True where one wrong answer ends the round, which is the tafeldiploma. */
  readonly stoptBijFout?: boolean;
}

/** One answer, as the module judged it. */
export interface Beoordeeld<A> {
  readonly correct: boolean;
  /** What the screen quotes back, or null for "ik weet het niet". */
  readonly given: A | null;
  /** What the attempt record stores: null when right, 'weet-niet', or the answer. */
  readonly recorded: string | null;
  /**
   * False only for "ik weet het niet". Every other wrong answer costs a life:
   * three of them are what makes overleven a survival round (ADR-048).
   */
  readonly spendsALife?: boolean;
}

export interface RondeKern<S, Q, T, A> {
  readonly phase: RondeFase;
  readonly set: S | null;
  readonly question: Q | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly answeredCount: number;
  readonly combo: number;
  readonly given: A | null;
  readonly lastCorrect: boolean;
  readonly missed: readonly T[];
  /** How many more of the set the child now remembers. Never negative. */
  readonly gained: number;
  readonly rule: RoundRule;
  /** Bliksemronde only: whole seconds left. */
  readonly secondsLeft: number | null;
  /** Overleven only: lives remaining. */
  readonly livesLeft: number | null;
  readonly streak: StreakChange | null;
  readonly reward: RoundOutcome | null;
  /** Whether this round keeps its answers to itself until the end (ADR-085). */
  readonly toetsstand: boolean;
  readonly error: string | null;
}

export function useRoundCore<S, Q, T extends Schedulable, A>(opties: RondeKernOpties<S, Q, T>) {
  const { setId, mode, basisRegel, aantal, toetsstand, itemVan, stoptBijFout = false } = opties;

  const [set, setSet] = useState<S | null>(null);
  const [itemIds, setItemIds] = useState<readonly string[]>([]);
  const [questions, setQuestions] = useState<readonly Q[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [phase, setPhase] = useState<RondeFase>('loading');
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<A | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboAnswers, setComboAnswers] = useState(0);
  const [missed, setMissed] = useState<T[]>([]);
  const [streak, setStreak] = useState<StreakChange | null>(null);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoised: `rule` is a dependency of the effect that composes the round, so
  // a fresh object every render would start a new round on every render.
  const rule = useMemo<RoundRule>(
    () => (aantal !== null && basisRegel.kind === 'fixed' ? { kind: 'fixed', aantal } : basisRegel),
    [basisRegel, aantal],
  );
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

  // The composer is a closure over the module's own arguments and is new every
  // render. It is read at the moment the round is composed rather than being a
  // reason to compose it again.
  const stel = useRef(opties.stel);
  useLayoutEffect(() => {
    stel.current = opties.stel;
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const loadedStates = await loadItemStates();
        if (cancelled) return;

        const opzet = await stel.current(loadedStates, rule);
        if (cancelled) return;

        sessionId.current = await startSession(
          mode,
          opzet.questions.map((question) => itemVan(question).id),
          setId,
        );
        if (cancelled) return;

        masteredAtStart.current = countMastered(loadedStates, opzet.itemIds);

        setSet(opzet.set);
        setItemIds(opzet.itemIds);
        setStates(loadedStates);
        setQuestions(opzet.questions);
        setPhase(opzet.questions.length > 0 ? 'asking' : 'finished');
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
  }, [setId, mode, rule, itemVan]);

  const question = questions[index] ?? null;

  /** One answer, however it arrived: typed, chosen, or not given at all. */
  const settle = useCallback(
    (antwoord: Beoordeeld<A>) => {
      if (phase !== 'asking' || question === null || !sessionId.current) return;

      const item = itemVan(question);
      const { correct } = antwoord;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(item.id) ?? emptyState(item.id);
      const nextState = review(previous, correct, new Date());

      setGiven(antwoord.given);
      setLastCorrect(correct);
      setPhase('revealed');

      const nextCombo = correct ? combo + 1 : 0;
      setCombo(nextCombo);
      if (nextCombo >= COMBO_THRESHOLD) setComboAnswers(comboAnswers + 1);
      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, item]);

      setStates(new Map(states).set(item.id, nextState));

      if (!correct && antwoord.spendsALife !== false && rule.kind === 'levens') {
        setLivesLeft(livesLeft - 1);
      }

      void saveAnswer({
        sessionId: sessionId.current,
        mode,
        itemId: item.id,
        correct,
        responseMs,
        chosen: antwoord.recorded,
        nextState,
      });
    },
    [
      phase,
      question,
      itemVan,
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

  const finish = useCallback(() => {
    // The clock, the last life and the stop button can all arrive at once.
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount, answeredCount);

    // A round counts for the day even when it was stopped early: the child
    // turned up and did the work, which is the only thing a streak measures.
    void recordRoundFinished().then((change) => {
      setStreak(change);

      void applyRoundRewards({
        correct: correctCount,
        answered: answeredCount,
        comboAnswers,
        snapshot: {
          setId,
          perfectRound: answeredCount > 0 && correctCount === answeredCount,
          completeRound: answeredCount === questions.length,
          streakDays: change.state.huidigeStreak,
          mastered: countMastered(states, itemIds),
          setSize: itemIds.length,
          roundsFinished: 1,
          mode,
          correct: correctCount,
        },
      }).then(setReward);
    });
  }, [phase, correctCount, answeredCount, comboAnswers, setId, questions, states, itemIds, mode]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    // Out of lives, out of questions, or — where one mistake ends it — out of
    // the attempt. A timed round ends on the clock instead, below.
    if (
      (rule.kind === 'levens' && livesLeft <= 0) ||
      (stoptBijFout && !lastCorrect) ||
      index + 1 >= questions.length
    ) {
      finish();
      return;
    }

    setIndex(index + 1);
    setGiven(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, rule, livesLeft, stoptBijFout, lastCorrect, index, questions, finish]);

  /**
   * The clock. Four ticks a second so the number is not up to a second behind
   * what it claims, and it reads the deadline rather than counting down, so a
   * busy frame costs no time.
   *
   * WCAG 2.2.1 wants time limits adjustable, with an exception where the limit
   * is the activity. Here it is: a bliksemronde without a clock is just
   * answering. The ways that teach have no clock at all.
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
    if (toetsstand || rule.kind !== 'tijd' || phase !== 'revealed') return;
    const id = setTimeout(next, lastCorrect ? 900 : 1800);
    return () => clearTimeout(id);
  }, [toetsstand, rule, phase, lastCorrect, next]);

  /**
   * And a toetsstand moves on at once, with nothing shown in between. Before
   * the paint rather than after it: `useEffect` would let the revealed frame
   * reach the screen for a sixtieth of a second, and a green flash nobody can
   * read is worse than either telling a child or not telling them.
   */
  useLayoutEffect(() => {
    if (!toetsstand || phase !== 'revealed') return;
    next();
  }, [toetsstand, phase, next]);

  const kern: RondeKern<S, Q, T, A> = {
    phase,
    set,
    question,
    index,
    total: questions.length,
    correctCount,
    answeredCount,
    combo,
    given,
    lastCorrect,
    missed,
    gained: Math.max(0, countMastered(states, itemIds) - masteredAtStart.current),
    rule,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    streak,
    reward,
    toetsstand,
    error,
  };

  return { kern, settle, next, stop: finish };
}
