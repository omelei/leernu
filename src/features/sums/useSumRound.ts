import { useCallback } from 'react';
import {
  alleenDeze,
  composeRound,
  judgeSum,
  metFouten,
  sumDistractors,
  type RoundRule,
  type SumItem,
  type SumSet,
} from '@/game-core';
import { loadSumSet, sumPool } from '@/content/loadSums';
import { useRoundCore, type RondeFase, type RondeKern } from '@/features/round/useRoundCore';

/**
 * One round of tables.
 *
 * What a round of sums shares with every other round — the schedule, the
 * session record, the three ways it ends, the combo, the streak and the
 * rewards — lives in `useRoundCore` (ADR-101). What is left here is what makes
 * it sums: which sums, in which order, with which four numbers, and how a typed
 * answer is judged.
 *
 * A round is the whole table. Ten sums is what a table has and what the design
 * puts on the module card, and "de tafel van 7 ken ik" is only sayable about
 * all of it.
 */

export type SumMode = 'som-typen' | 'som-meerkeuze' | 'bliksemronde' | 'overleven' | 'tafeldiploma';

/*
 * Which of these a child is offered, in which order and with what said about
 * each, lives in `features/module/forms.ts` — including the reason typing comes
 * before choosing here and the other way round on a map. What stays here is how
 * a round of each one ends, because that is the hook's own business.
 *
 * The clock and the lives are the same two the map offers and for the same
 * reason (ADR-021): pressure, and neither of them punishes. They run over all
 * twelve tables rather than the chosen one; see the pool in `stel` below.
 */

export const SUM_ROUND_RULE: Record<SumMode, RoundRule> = {
  'som-typen': { kind: 'fixed', aantal: 10 },
  'som-meerkeuze': { kind: 'fixed', aantal: 10 },
  bliksemronde: { kind: 'tijd', seconden: 60 },
  overleven: { kind: 'levens', levens: 3 },
  // Ten, like any round of a table — the difference is not the length but that
  // it ends on the first mistake. See `stopsOnAMistake`.
  tafeldiploma: { kind: 'fixed', aantal: 10 },
};

/**
 * A diploma is passed or it is not: one wrong answer ends the attempt.
 *
 * It is not a life lost — there is no counter and nothing to survive — and it
 * is not a punishment either. The round stops, the result screen says which sum
 * it was, and the child can sit it again straight away. That is what makes it
 * a test rather than a longer round, and it is the only thing in the product
 * that can be failed.
 */
export function stopsOnAMistake(mode: SumMode): boolean {
  return mode === 'tafeldiploma';
}

/**
 * A diploma asks the table in its own order, one to ten.
 *
 * Everywhere else the Leitner scheduler decides, because practice should start
 * with what a child keeps missing. A test should not: "de tafel van 7" is a
 * thing a child recites in order, and a diploma that shuffled it would be
 * asking something the child was never taught.
 */
function inTableOrder(mode: SumMode): boolean {
  return mode === 'tafeldiploma';
}

/**
 * Which way a child answers. Typing everywhere except the one mode built to be
 * easier — including under the clock, because choosing between four numbers
 * against a stopwatch measures reading speed rather than the table.
 */
export function typesTheSum(mode: SumMode): boolean {
  return mode !== 'som-meerkeuze';
}

export type SumPhase = RondeFase;

export interface SumQuestion {
  readonly sum: SumItem;
  /** Meerkeuze only: four numbers, the right one among them, in shown order. */
  readonly options: readonly number[] | null;
}

/**
 * The round as the screens read it: the shared bookkeeping, and which way it
 * was asked. `given` is the number the child answered, or null when they said
 * they did not know. `toetsstand` is needed twice — while the round runs, so
 * nothing is coloured in between, and afterwards, because a round that asked
 * without helping is the one round in this product that has earned a mark.
 */
export type SumRoundState = RondeKern<SumSet, SumQuestion, SumItem, number> & {
  readonly mode: SumMode;
};

/** The item a question is about, for the core. At module level so it is stable. */
const somVan = (question: SumQuestion): SumItem => question.sum;

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

/**
 * @param aantal how many sums the child asked for, or null for the round's own
 *   length. A diploma ignores it: it is the whole table or it is not a diploma.
 * @param toetsstand a round that keeps its answers to itself until the end —
 *   the same switch the map's rounds carry, and the same argument (ADR-085): a
 *   child who has only ever practised with the answer arriving half a second
 *   later has practised something no test will ask of them.
 * @param alleen "Herhaal je fouten": the ids of the sums the last round got
 *   wrong, which are then the whole round (ADR-111). Null for a normal round.
 */
export function useSumRound(
  setId: string,
  mode: SumMode,
  aantal: number | null = null,
  toetsstand = false,
  alleen: readonly string[] | null = null,
) {
  const { kern, settle, next, stop } = useRoundCore<SumSet, SumQuestion, SumItem, number>({
    setId,
    mode,
    basisRegel: SUM_ROUND_RULE[mode],
    aantal: mode === 'tafeldiploma' ? null : aantal,
    toetsstand,
    itemVan: somVan,
    stoptBijFout: stopsOnAMistake(mode),
    stel: (states, rule) => {
      const loaded = loadSumSet(setId);
      if (!loaded) throw new Error(`Onbekende tafel: ${setId}`);

      // A fixed round is the chosen set. A round that ends on a clock or on
      // lives draws from everything of the same kind, because ten sums would
      // run out long before the minute does — and a child who reaches for the
      // clock is one who already knows a table, not one still learning this
      // one. What it does not do is reach across kinds: a minute of tables
      // stays a minute of tables (`sumPool`).
      const eigen = rule.kind === 'fixed' ? loaded.items : sumPool(setId);
      // "Herhaal je fouten" is what the last round got wrong and nothing else,
      // wherever it came from: a minute of tables reaches past the chosen one
      // (ADR-111).
      const alles = alleen ? alleenDeze(alleen, loaded.items, sumPool(setId)) : eigen;
      // "Oefen je fouten" is every sum this child has ever had wrong, in the
      // scheduler's order, which puts the ones they keep missing first. Read
      // from the boxes at the moment the round starts rather than from a list
      // made when the page loaded: a child who has just put one right should
      // not be asked it again because a card was stale (ADR-078).
      const pool = setId === 'fouten' && !alleen ? metFouten(alles, states) : alles;

      // In the order the scheduler wants it: what a child keeps missing comes
      // round first, even inside ten sums. A diploma is the exception and
      // asks the table straight through.
      const picked = inTableOrder(mode)
        ? [...loaded.items].slice(0, rule.kind === 'fixed' ? rule.aantal : loaded.items.length)
        : composeRound({
            items: pool,
            states,
            size: rule.kind === 'fixed' ? rule.aantal : pool.length,
            now: new Date(),
          });

      return {
        set: loaded,
        itemIds: loaded.items.map((sum) => sum.id),
        questions: picked.map((sum) => ({
          sum,
          options: typesTheSum(mode) ? null : optionsFor(sum, Math.random),
        })),
      };
    },
  });

  const question = kern.question;

  /** One answer, however it arrived: typed, chosen, or not given at all. */
  const answer = useCallback(
    (given: number | null, spendsALife = true) => {
      if (!question) return;
      const correct = given !== null && given === question.sum.antwoord;
      settle({
        correct,
        given,
        // ADR-048's distinction, in the other module: not knowing and getting
        // it wrong are different things to have done.
        recorded: correct ? null : given === null ? 'weet-niet' : String(given),
        spendsALife,
      });
    },
    [question, settle],
  );

  const submit = useCallback(
    (typed: string) => {
      if (!question) return;
      const cleaned = typed.trim().replace(/\s+/g, '');
      // Judged by game-core so the rule lives in one place; parsed here only to
      // show the child what they answered.
      const correct = judgeSum(typed, question.sum);
      answer(correct ? question.sum.antwoord : Number(cleaned));
    },
    [question, answer],
  );

  const choose = useCallback((value: number) => answer(value), [answer]);
  const giveUp = useCallback(() => answer(null, false), [answer]);

  const state: SumRoundState = { ...kern, mode };

  return { state, submit, choose, giveUp, next, stop };
}
