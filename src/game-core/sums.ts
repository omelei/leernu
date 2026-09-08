/**
 * Arithmetic facts, and what counts as knowing one.
 *
 * A sum is not a place. It has no name to spell, no aliases, no region and no
 * near miss — ADR-017's whole apparatus exists because "Friesland" for Fryslân
 * is a different kind of wrong from "Zwolle", and a number has no such shades.
 * 56 is right and everything else is not.
 *
 * That is why this is its own module rather than a widening of `Item`. The
 * scheduler is shared, because spacing is spacing; the judging is not, because
 * judging a name and judging a number have nothing in common but the word.
 *
 * It used to be multiplication only, and a sum was `{ table, by }` — the shape
 * of a table rather than the shape of a sum. Four operations later that shape
 * would have had to lie about three of them, so a sum now carries two numbers
 * and the sign between them (ADR-062). The ids did not change: `tafel-7x8` is
 * what a child's Leitner box is filed under, and a rename would have thrown
 * away every box in the product to tidy up a field name.
 */

import type { Niveau } from './types';

/**
 * The four operations, in Dutch because they are content rather than code: the
 * generator writes these words into the JSON and a person reading the content
 * should not have to translate them back.
 */
export type SumOp = 'keer' | 'delen' | 'plus' | 'min';

/**
 * What a child sees between the two numbers.
 *
 * `×` and `−`, not the letter x and not a hyphen: these are what a schoolbook
 * prints, and the lookalikes are the kind of detail that makes a product feel
 * like it was made by someone who was not paying attention. The division sign
 * is the colon Dutch primary school uses, never the obelus.
 */
export const SUM_SIGN: Record<SumOp, string> = {
  keer: '×',
  delen: ':',
  plus: '+',
  min: '−',
};

export interface SumItem {
  /** `tafel-7x8`, `deel-56-7`, `plus-8+7`. Stable: a Leitner box is filed under it. */
  readonly id: string;
  readonly op: SumOp;
  readonly links: number;
  readonly rechts: number;
  readonly antwoord: number;
}

export interface SumSet {
  /** `tafel-7`, `deel-7`, `plus-100`. */
  readonly id: string;
  /** Null for a mix, whose items each carry their own sign. */
  readonly op: SumOp | null;
  /**
   * Which table this belongs to, for the sets that are one — a table and its
   * division facts. Null for plus and min, which are not organised by table.
   */
  readonly tafel: number | null;
  /** How early a child is expected to meet it. Decides the order, nothing else. */
  readonly niveau: Niveau;
  readonly contentVersie: string;
  readonly items: readonly SumItem[];
}

/** The sum as it is read aloud and shown. */
export function sumText(sum: SumItem): string {
  return `${sum.links} ${SUM_SIGN[sum.op]} ${sum.rechts}`;
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
 * a sum come from arithmetic, and they are the mistakes children actually make.
 * Which mistakes those are depends on the operation, which is why this is a
 * table of candidate lists rather than one list:
 *
 * **Times** — one row up and one row down the table, then the same for the
 * multiplier. Both are the answer to the sum next door, which is the slip a
 * child makes when they recite a table and lose their place.
 *
 * **Divide** — the answer is small, so a row up or down is one and two either
 * way. Nothing here is off by ten: nobody divides and lands a decade out.
 *
 * **Plus and minus** — ten either way first, because a forgotten carry is the
 * mistake of the whole operation, then one either way for a miscount.
 *
 * Never zero and never negative, and never the right answer twice.
 */
export function sumDistractors(sum: SumItem, count = 3): number[] {
  const near = candidatesFor(sum);

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

function candidatesFor(sum: SumItem): number[] {
  const { antwoord, links, rechts } = sum;

  if (sum.op === 'keer') {
    return [
      antwoord - links,
      antwoord + links,
      antwoord - rechts,
      antwoord + rechts,
      antwoord + 1,
      antwoord - 1,
      antwoord + 10,
      antwoord * 2,
    ];
  }

  if (sum.op === 'delen') {
    return [antwoord + 1, antwoord - 1, antwoord + 2, antwoord - 2, antwoord + 3, antwoord * 2];
  }

  return [
    antwoord + 10,
    antwoord - 10,
    antwoord + 1,
    antwoord - 1,
    antwoord + 2,
    antwoord - 2,
    antwoord + 20,
    antwoord - 20,
  ];
}
