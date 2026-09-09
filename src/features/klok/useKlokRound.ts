import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  COMBO_THRESHOLD,
  composeRound,
  countMastered,
  emptyState,
  judgeKlok,
  klokDigitaal,
  klokDistractors,
  review,
  type ItemState,
  type KlokItem,
  type KlokSet,
  type RoundRule,
  type StreakChange,
} from '@/game-core';
import { klokPool, loadKlokSet } from '@/content/loadKlok';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import { recordRoundFinished } from '@/store/streakStore';
import { applyRoundRewards, type RoundOutcome } from '@/store/rewardStore';

/**
 * One round of the clock.
 *
 * This is the third copy of the round wiring, and `useSumRound` said in as many
 * words that the third module is when the guess about what is shared becomes an
 * observation. It is, and here is the observation, written down rather than
 * acted on in the same change that needed it:
 *
 * **What all three share** is the Leitner schedule, the session record, the
 * three ways a round ends, the combo, the streak and the rewards — everything
 * from `composeRound` down to `applyRoundRewards`, which is already imported
 * rather than copied. **What none of them share** is the question: a map needs
 * geometry and an answer layer, a sum needs a keypad, a clock needs a face and
 * asks in two directions. The duplication is the hundred lines of bookkeeping
 * between those two, and extracting it is a change to three working round hooks
 * at once — which is a change of its own, with its own test run, and not a
 * passenger on the one that adds a module (ADR-092).
 *
 * What is genuinely new here is the direction. Rekenen and topografie ask one
 * way round; this asks both — read this face, and pick the face that says this.
 * That is why `KlokQuestion` carries times rather than rendered answers: the
 * options are the same four items either way, and which of the two is drawn on
 * the stage is the screen's business.
 */

export type KlokMode =
  | 'klok-meerkeuze'
  | 'klok-welke-klok'
  | 'klok-typen'
  | 'bliksemronde'
  | 'overleven';

/*
 * Which of these a child is offered, in which order and with what said about
 * each, lives in `features/module/forms.ts`. What stays here is how a round of
 * each one ends.
 *
 * The clock and the lives are the same two the other modules offer and for the
 * same reason (ADR-021): pressure, and neither of them punishes. They run over
 * the whole face rather than the chosen step; see the pool in `boot` below.
 */
export const KLOK_ROUND_RULE: Record<KlokMode, RoundRule> = {
  'klok-meerkeuze': { kind: 'fixed', aantal: 10 },
  'klok-welke-klok': { kind: 'fixed', aantal: 10 },
  'klok-typen': { kind: 'fixed', aantal: 10 },
  bliksemronde: { kind: 'tijd', seconden: 60 },
  overleven: { kind: 'levens', levens: 3 },
};

/**
 * Which way a child answers. Typing everywhere except the two modes that are
 * built to be easier — including under the clock and the lives, for the reason
 * rekenen gives: choosing between four answers against a stopwatch measures
 * reading speed rather than whether the face was read.
 */
export function typesTheKlok(mode: KlokMode): boolean {
  return mode !== 'klok-meerkeuze' && mode !== 'klok-welke-klok';
}

/**
 * Which way round the question is asked.
 *
 * False everywhere except "welke klok": there the words are the question and
 * four faces are the answer, which is the half of clock reading a child cannot
 * be tested on by being shown a clock. It is not multiple choice with the
 * question and the answer swapped over — what the child is looking at differs,
 * so it is a mode of its own.
 */
export function wijstDeKlokAan(mode: KlokMode): boolean {
  return mode === 'klok-welke-klok';
}

export type KlokPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface KlokQuestion {
  readonly tijd: KlokItem;
  /** Four times, the right one among them, in shown order. Null when typing. */
  readonly opties: readonly KlokItem[] | null;
}

export interface KlokRoundState {
  readonly phase: KlokPhase;
  readonly set: KlokSet | null;
  readonly mode: KlokMode;
  readonly question: KlokQuestion | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly answeredCount: number;
  readonly combo: number;
  /** What the child answered, or null when they said they did not know. */
  readonly given: KlokItem | null;
  /**
   * What the answer looked like when it arrived: the keystrokes for a typed
   * one, the time in figures for a chosen one, and null for "ik weet het
   * niet". It is what the attempt record stores — the screen quotes `given`
   * back where there is one, because a child who pressed a word should not be
   * shown a number.
   */
  readonly getypt: string | null;
  readonly lastCorrect: boolean;
  readonly missed: readonly KlokItem[];
  /** How many more faces on this set the child now remembers. Never negative. */
  readonly gained: number;
  readonly rule: RoundRule;
  /** Bliksemronde only: whole seconds left. */
  readonly secondsLeft: number | null;
  /** Overleven only: lives remaining. */
  readonly livesLeft: number | null;
  readonly streak: StreakChange | null;
  readonly reward: RoundOutcome | null;
  /** Whether this round kept its answers to itself until the end (ADR-085). */
  readonly toetsstand: boolean;
  readonly error: string | null;
}

/** Four times: the right one and three wrong ones, dealt once. */
function optiesVoor(tijd: KlokItem, rng: () => number): KlokItem[] {
  const alle = [tijd, ...klokDistractors(tijd)];
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = alle[i] as KlokItem;
    const b = alle[j] as KlokItem;
    alle[i] = b;
    alle[j] = a;
  }
  return alle;
}

/**
 * @param aantal how many faces the child asked for, or null for the round's own
 *   length.
 *
 * Toetsstand: a round that keeps its answers to itself until the end, the same
 * switch the other two modules carry and the same argument (ADR-085).
 */
export function useKlokRound(
  setId: string,
  mode: KlokMode,
  aantal: number | null = null,
  toetsstand = false,
) {
  const [set, setSet] = useState<KlokSet | null>(null);
  const [questions, setQuestions] = useState<KlokQuestion[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [phase, setPhase] = useState<KlokPhase>('loading');
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<KlokItem | null>(null);
  const [getypt, setGetypt] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboAnswers, setComboAnswers] = useState(0);
  const [missed, setMissed] = useState<KlokItem[]>([]);
  const [streak, setStreak] = useState<StreakChange | null>(null);
  const [reward, setReward] = useState<RoundOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoised: `rule` is a dependency of the effect that composes the round, so
  // a fresh object every render would start a new round on every render.
  const rule = useMemo<RoundRule>(() => {
    const base = KLOK_ROUND_RULE[mode];
    return aantal !== null && base.kind === 'fixed' ? { kind: 'fixed', aantal } : base;
  }, [mode, aantal]);
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
        const loaded = loadKlokSet(setId);
        if (!loaded) throw new Error(`Onbekende klokset: ${setId}`);

        const loadedStates = await loadItemStates();
        if (cancelled) return;

        // A fixed round is the chosen step. A round that ends on a clock or on
        // lives draws from the whole face, because twelve whole hours would run
        // out long before the minute does — and a child who reaches for the
        // stopwatch is one who can already read the thing.
        const pool = rule.kind === 'fixed' ? loaded.items : klokPool(setId);

        const picked = composeRound({
          items: pool,
          states: loadedStates,
          size: rule.kind === 'fixed' ? rule.aantal : pool.length,
          now: new Date(),
        });

        const round = picked.map((tijd) => ({
          tijd,
          opties: typesTheKlok(mode) ? null : optiesVoor(tijd, Math.random),
        }));

        sessionId.current = await startSession(
          mode,
          round.map((question) => question.tijd.id),
          setId,
        );
        if (cancelled) return;

        masteredAtStart.current = countMastered(
          loadedStates,
          loaded.items.map((tijd) => tijd.id),
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

  /**
   * One answer, however it arrived: typed, chosen, or not given at all.
   *
   * @param antwoord the time the child answered, or null for "ik weet het niet"
   *   — and also for a typed answer that was not a time. Those two are not the
   *   same thing to have done, which is why `ruw` carries what was typed: the
   *   screen can then say "je typte kwart" rather than pretending nothing came.
   */
  const settle = useCallback(
    (antwoord: KlokItem | null, ruw: string | null = null, spendsALife = true) => {
      if (phase !== 'asking' || !question || !sessionId.current) return;

      const correct = antwoord !== null && antwoord.id === question.tijd.id;
      // ADR-048's distinction, in the third module: not knowing and getting it
      // wrong are different things to have done, and a child who typed
      // something that is not a time has done the second one.
      const gegeven = antwoord === null && ruw === null ? 'weet-niet' : (ruw ?? '');
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(question.tijd.id) ?? emptyState(question.tijd.id);
      const nextState = review(previous, correct, new Date());

      setGiven(antwoord);
      setGetypt(ruw);
      setLastCorrect(correct);
      setPhase('revealed');

      const nextCombo = correct ? combo + 1 : 0;
      setCombo(nextCombo);
      if (nextCombo >= COMBO_THRESHOLD) setComboAnswers(comboAnswers + 1);
      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, question.tijd]);

      setStates(new Map(states).set(question.tijd.id, nextState));

      if (!correct && spendsALife && rule.kind === 'levens') setLivesLeft(livesLeft - 1);

      void saveAnswer({
        sessionId: sessionId.current,
        mode,
        itemId: question.tijd.id,
        correct,
        responseMs,
        chosen: correct ? null : gegeven,
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
      // Judged by game-core so the rule lives in one place — including the part
      // that accepts the afternoon, and the part that forgives a full stop.
      const correct = judgeKlok(typed, question.tijd);
      settle(correct ? question.tijd : null, typed.trim());
    },
    [question, settle],
  );

  const choose = useCallback((tijd: KlokItem) => settle(tijd, klokDigitaal(tijd)), [settle]);
  const giveUp = useCallback(() => settle(null, null, false), [settle]);

  const finish = useCallback(() => {
    if (phase === 'finished') return;
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount, answeredCount);

    void recordRoundFinished().then((change) => {
      setStreak(change);

      const ids = (set?.items ?? []).map((tijd) => tijd.id);
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

    // Out of lives or out of questions. A timed round ends on the clock
    // instead, which is the interval below.
    if ((rule.kind === 'levens' && livesLeft <= 0) || index + 1 >= questions.length) {
      finish();
      return;
    }

    setIndex(index + 1);
    setGiven(null);
    setGetypt(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions, finish, rule, livesLeft]);

  /**
   * The clock. Four ticks a second so the number is not up to a second behind
   * what it claims, and it reads the deadline rather than counting down, so a
   * busy frame costs no time.
   *
   * WCAG 2.2.1 wants time limits adjustable, with an exception where the limit
   * is the activity. Here it is: a bliksemronde without a clock is just reading.
   * The three learning modes have no clock at all.
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
   * long, because the thing worth seeing is what the time actually was.
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

  const state: KlokRoundState = {
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
    getypt,
    lastCorrect,
    missed,
    gained: Math.max(
      0,
      countMastered(
        states,
        (set?.items ?? []).map((tijd) => tijd.id),
      ) - masteredAtStart.current,
    ),
    rule,
    secondsLeft: rule.kind === 'tijd' ? secondsLeft : null,
    livesLeft: rule.kind === 'levens' ? livesLeft : null,
    streak,
    reward,
    toetsstand,
    error,
  };

  return { state, submit, choose, giveUp, next, stop: finish };
}
