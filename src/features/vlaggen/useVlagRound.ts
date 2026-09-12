import { useCallback } from 'react';
import {
  afleiderFase,
  composeRound,
  metFouten,
  OPTIES,
  OPTIES_ALLES,
  VLAGDIPLOMA_VRAGEN,
  vlagOpties,
  type RoundRule,
  type VlagItem,
} from '@/game-core';
import {
  alleVlaggen,
  isVlagFouten,
  loadVlagSet,
  vlagPool,
  type VlagSet,
} from '@/content/loadVlaggen';
import { useRoundCore, type RondeFase, type RondeKern } from '@/features/round/useRoundCore';
import { voorlaad } from './vlagSrc';

/**
 * One round of flags.
 *
 * The bookkeeping is `useRoundCore`'s (ADR-101); what is here is the flags'
 * own: which flags, which wrong answers beside each one, and which way round
 * each question is asked.
 *
 * **Both ways round, like the clock.** "Vlag zoeken" gives a name and shows
 * flags; "Meerkeuze" shows a flag and gives names. The oefentoets and overleven
 * alternate between the two, because a test asks both and a child who can only
 * go one way has learned half of it.
 *
 * **The wrong answers get harder as the round goes** (`afleiderFase`): other
 * werelddelen first, then the same werelddeel, then the look-alikes. That is a
 * property of the question's place in the round, so it holds in every way of
 * asking, and in overleven it is what makes the round harder the longer a child
 * survives.
 *
 * A wrong answer is kept for the result screen and not asked again in the same
 * round, which is what the tables and the clock do (ADR-101).
 */

export type VlagMode =
  'vlag-zoeken' | 'vlag-meerkeuze' | 'vlag-gemengd' | 'overleven' | 'vlag-diploma';

/**
 * Ten questions, about two minutes, and three lives for overleven. The diploma
 * asks twenty — fewer on a werelddeel that has fewer flags, which the round
 * gets for free by being composed from the set (ADR-104).
 */
export const VLAG_ROUND_RULE: Record<VlagMode, RoundRule> = {
  'vlag-zoeken': { kind: 'fixed', aantal: 10 },
  'vlag-meerkeuze': { kind: 'fixed', aantal: 10 },
  'vlag-gemengd': { kind: 'fixed', aantal: 10 },
  overleven: { kind: 'levens', levens: 3 },
  'vlag-diploma': { kind: 'fixed', aantal: VLAGDIPLOMA_VRAGEN },
};

/**
 * A diploma is sat, not practised: nothing is said until the end, so it is
 * always asked the way the oefentoets asks (ADR-085), whatever the page passed.
 * "Geen hints" in the brief, and in this product the only hint there is is the
 * answer arriving half a second later.
 */
function isDiploma(mode: VlagMode): boolean {
  return mode === 'vlag-diploma';
}

/** Which way round one question is asked. */
export type VlagRichting = 'zoeken' | 'meerkeuze';

export function richtingVan(mode: VlagMode, index: number): VlagRichting {
  if (mode === 'vlag-zoeken') return 'zoeken';
  if (mode === 'vlag-meerkeuze') return 'meerkeuze';
  return index % 2 === 0 ? 'zoeken' : 'meerkeuze';
}

export type VlagPhase = RondeFase;

export interface VlagQuestion {
  readonly vlag: VlagItem;
  readonly richting: VlagRichting;
  /** The answer and its wrong answers, in the order shown. Dealt once. */
  readonly opties: readonly VlagItem[];
}

/** `given` is the flag the child chose, or null when they said they did not know. */
export type VlagRoundState = RondeKern<VlagSet, VlagQuestion, VlagItem, VlagItem> & {
  readonly mode: VlagMode;
};

/** The item a question is about, for the core. At module level so it is stable. */
const vlagVan = (question: VlagQuestion): VlagItem => question.vlag;

/**
 * How many options. Four, and six when flags are the options on a set that
 * holds a whole werelddeel: four flags out of fifty-four are too easy to tell
 * apart by elimination. Names stay at four; six words is a reading exercise.
 */
function optieAantal(set: VlagSet, richting: VlagRichting): number {
  return richting === 'zoeken' && set.onderwerp === 'alle' ? OPTIES_ALLES : OPTIES;
}

export function useVlagRound(
  setId: string,
  mode: VlagMode,
  aantal: number | null = null,
  toetsstand = false,
) {
  const { kern, settle, next, stop } = useRoundCore<VlagSet, VlagQuestion, VlagItem, VlagItem>({
    setId,
    mode,
    basisRegel: VLAG_ROUND_RULE[mode],
    // A diploma is its own length, like the tafeldiploma.
    aantal: isDiploma(mode) ? null : aantal,
    toetsstand: toetsstand || isDiploma(mode),
    itemVan: vlagVan,
    stel: (states, rule) => {
      const set = loadVlagSet(setId);
      if (!set) throw new Error(`Onbekende vlaggenset: ${setId}`);

      const basis = rule.kind === 'fixed' ? set.items : vlagPool(setId);
      const pool = isVlagFouten(setId) ? metFouten(basis, states) : basis;

      const picked = composeRound({
        items: pool,
        states,
        size: rule.kind === 'fixed' ? rule.aantal : pool.length,
        now: new Date(),
      });

      const alle = alleVlaggen();
      const questions = picked.map((vlag, index) => {
        const richting = richtingVan(mode, index);
        return {
          vlag,
          richting,
          opties: vlagOpties({
            antwoord: vlag,
            pool: alle,
            fase: afleiderFase(index),
            aantal: optieAantal(set, richting) - 1,
          }),
        };
      });

      voorlaad(questions.flatMap((question) => question.opties));

      return { set, itemIds: set.items.map((vlag) => vlag.id), questions };
    },
  });

  const question = kern.question;

  /** The flag or the name the child chose. Either way it is one of the options. */
  const choose = useCallback(
    (vlag: VlagItem) => {
      if (!question) return;
      const correct = vlag.id === question.vlag.id;
      settle({ correct, given: vlag, recorded: correct ? null : vlag.id });
    },
    [question, settle],
  );

  /**
   * "Ik weet het niet": scored as not known, and it costs no life (ADR-048).
   */
  const giveUp = useCallback(
    () => settle({ correct: false, given: null, recorded: 'weet-niet', spendsALife: false }),
    [settle],
  );

  const state: VlagRoundState = { ...kern, mode };

  return { state, choose, giveUp, next, stop };
}
