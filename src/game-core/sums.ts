/**
 * Multiplication facts, and what counts as knowing one.
 *
 * A sum is not a place. It has no name to spell, no aliases, no region and no
 * near miss — ADR-017's whole apparatus exists because "Friesland" for Fryslân
 * is a different kind of wrong from "Zwolle", and a number has no such shades.
 * 56 is right and everything else is not.
 *
 * That is why this is its own module rather than a widening of `Item`. The
 * scheduler is shared, because spacing is spacing; the judging is not, because
 * judging a name and judging a number have nothing in common but the word.
 */

import type { Niveau } from './types';

export interface SumItem {
  /** `tafel-7x8`. */
  readonly id: string;
  /** Which table this belongs to: 7 in "de tafel van 7". */
  readonly table: number;
  readonly by: number;
  readonly antwoord: number;
}

export interface SumSet {
  /** `tafel-7`. */
  readonly id: string;
  readonly tafel: number;
  /** How early a child is expected to meet it. Decides the order, nothing else. */
  readonly niveau: Niveau;
  readonly contentVersie: string;
  readonly items: readonly SumItem[];
}

/**
 * The sum as it is read aloud and shown.
 *
 * A multiplication sign, not the letter x and not an asterisk: `×` is what a
 * child sees in a schoolbook, and the two lookalikes are the kind of detail
 * that makes a product feel like it was made by someone who was not paying
 * attention.
 */
export function sumText(sum: SumItem): string {
  return `${sum.table} × ${sum.by}`;
}

/**
 * What a child typed, judged.
 *
 * Whitespace goes, and so does everything that is not a digit or a leading
 * minus — a child on a phone keyboard hits a stray space or a full stop, and
 * failing them for that would be measuring the keyboard rather than the table.
 * Anything left that is not a plain number is wrong rather than an error: the
 * screen asked for a number.
 */
export function judgeSum(typed: string, sum: SumItem): boolean {
  const cleaned = typed.trim().replace(/\s+/g, '');
  if (!/^-?\d+$/.test(cleaned)) return false;
  return Number(cleaned) === sum.antwoord;
}

/**
 * Three wrong answers for a multiple-choice sum.
 *
 * The neighbours of a place come from the geodata (ADR-036); the neighbours of
 * a sum come from arithmetic, and they are the mistakes children actually make:
 * one row up and one row down the table — the answer to the sum before and the
 * sum after — and then the sum with the digits of the table and the multiplier
 * swapped in the other direction. Everything after that is off-by-a-small-
 * number, which is the shape of a slip in counting on.
 *
 * Never zero and never negative, and never the right answer twice.
 */
export function sumDistractors(sum: SumItem, count = 3): number[] {
  const near = [
    sum.antwoord - sum.table,
    sum.antwoord + sum.table,
    sum.antwoord - sum.by,
    sum.antwoord + sum.by,
    sum.antwoord + 1,
    sum.antwoord - 1,
    sum.antwoord + 10,
    sum.antwoord * 2,
  ];

  const out: number[] = [];
  for (const candidate of near) {
    if (out.length >= count) break;
    if (candidate <= 0 || candidate === sum.antwoord || out.includes(candidate)) continue;
    out.push(candidate);
  }

  // A table of one leaves almost nothing near: 1 × 1 = 1 has no room below it.
  // Counting upwards is a poor distractor and a better one than a short list.
  for (let step = 2; out.length < count; step++) {
    const candidate = sum.antwoord + step;
    if (!out.includes(candidate)) out.push(candidate);
  }

  return out;
}
