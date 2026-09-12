import { useCallback } from 'react';
import {
  composeRound,
  judgeKlok,
  klokDigitaal,
  klokDistractors,
  metFouten,
  type KlokItem,
  type KlokSet,
  type RoundRule,
} from '@/game-core';
import { KLOK_FOUTEN_ID, klokPool, loadKlokSet } from '@/content/loadKlok';
import { useRoundCore, type RondeFase, type RondeKern } from '@/features/round/useRoundCore';

/**
 * One round of the clock.
 *
 * The bookkeeping every round shares — the schedule, the session record, the
 * three ways a round ends, the combo, the streak and the rewards — is
 * `useRoundCore` (ADR-101, paying what ADR-092 wrote down as owed). What is
 * left here is what makes it the clock.
 *
 * And what is genuinely the clock's is the direction. Rekenen and topografie
 * ask one way round; this asks both — read this face, and pick the face that
 * says this. That is why `KlokQuestion` carries times rather than rendered
 * answers: the options are the same four items either way, and which of the
 * two is drawn on the stage is the screen's business.
 */

export type KlokMode =
  'klok-meerkeuze' | 'klok-welke-klok' | 'klok-typen' | 'bliksemronde' | 'overleven';

/*
 * Which of these a child is offered, in which order and with what said about
 * each, lives in `features/module/forms.ts`. What stays here is how a round of
 * each one ends.
 *
 * The clock and the lives are the same two the other modules offer and for the
 * same reason (ADR-021): pressure, and neither of them punishes. They run over
 * the whole face rather than the chosen step; see the pool in `stel` below.
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

export type KlokPhase = RondeFase;

export interface KlokQuestion {
  readonly tijd: KlokItem;
  /** Four times, the right one among them, in shown order. Null when typing. */
  readonly opties: readonly KlokItem[] | null;
}

/** What the core keeps as the answer: the time chosen, and what was typed. */
interface KlokAntwoord {
  readonly tijd: KlokItem | null;
  readonly getypt: string | null;
}

export type KlokRoundState = Omit<
  RondeKern<KlokSet, KlokQuestion, KlokItem, KlokAntwoord>,
  'given'
> & {
  readonly mode: KlokMode;
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
};

/** The item a question is about, for the core. At module level so it is stable. */
const tijdVan = (question: KlokQuestion): KlokItem => question.tijd;

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
  const { kern, settle, next, stop } = useRoundCore<KlokSet, KlokQuestion, KlokItem, KlokAntwoord>({
    setId,
    mode,
    basisRegel: KLOK_ROUND_RULE[mode],
    aantal,
    toetsstand,
    itemVan: tijdVan,
    stel: (states, rule) => {
      const loaded = loadKlokSet(setId);
      if (!loaded) throw new Error(`Onbekende klokset: ${setId}`);

      // A fixed round is the chosen step. A round that ends on a clock or on
      // lives draws from the whole face, because twelve whole hours would run
      // out long before the minute does — and a child who reaches for the
      // stopwatch is one who can already read the thing.
      const alles = rule.kind === 'fixed' ? loaded.items : klokPool(setId);
      // "Oefen je fouten": only the faces with a mistake against them, read
      // from the boxes as the round starts (ADR-103).
      const pool = setId === KLOK_FOUTEN_ID ? metFouten(alles, states) : alles;

      const picked = composeRound({
        items: pool,
        states,
        size: rule.kind === 'fixed' ? rule.aantal : pool.length,
        now: new Date(),
      });

      return {
        set: loaded,
        itemIds: loaded.items.map((tijd) => tijd.id),
        questions: picked.map((tijd) => ({
          tijd,
          opties: typesTheKlok(mode) ? null : optiesVoor(tijd, Math.random),
        })),
      };
    },
  });

  const question = kern.question;

  /**
   * One answer, however it arrived: typed, chosen, or not given at all.
   *
   * @param antwoord the time the child answered, or null for "ik weet het niet"
   *   — and also for a typed answer that was not a time. Those two are not the
   *   same thing to have done, which is why `ruw` carries what was typed: the
   *   screen can then say "je typte kwart" rather than pretending nothing came.
   */
  const answer = useCallback(
    (antwoord: KlokItem | null, ruw: string | null = null, spendsALife = true) => {
      if (!question) return;

      const correct = antwoord !== null && antwoord.id === question.tijd.id;
      // ADR-048's distinction, in the third module: not knowing and getting it
      // wrong are different things to have done, and a child who typed
      // something that is not a time has done the second one.
      const gegeven = antwoord === null && ruw === null ? 'weet-niet' : (ruw ?? '');

      settle({
        correct,
        given: { tijd: antwoord, getypt: ruw },
        recorded: correct ? null : gegeven,
        spendsALife,
      });
    },
    [question, settle],
  );

  const submit = useCallback(
    (typed: string) => {
      if (!question) return;
      // Judged by game-core so the rule lives in one place — including the part
      // that accepts the afternoon, and the part that forgives a full stop.
      const correct = judgeKlok(typed, question.tijd);
      answer(correct ? question.tijd : null, typed.trim());
    },
    [question, answer],
  );

  const choose = useCallback((tijd: KlokItem) => answer(tijd, klokDigitaal(tijd)), [answer]);
  const giveUp = useCallback(() => answer(null, null, false), [answer]);

  const state: KlokRoundState = {
    ...kern,
    mode,
    given: kern.given?.tijd ?? null,
    getypt: kern.given?.getypt ?? null,
  };

  return { state, submit, choose, giveUp, next, stop };
}
