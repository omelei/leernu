/**
 * Klokkijken: a time on a face, and what counts as having read it.
 *
 * The third kind of thing this product asks about, and it is neither of the
 * first two. A place has a name to spell, aliases and a near miss (ADR-017); a
 * sum has one number that is right and no shades (`sums.ts`). A time has
 * something neither of them has: **two notations for one fact.** "half acht"
 * and "7:30" are the same reading, and a child who can say one and not write
 * the other has learned half of it.
 *
 * So the item is the fact — an hour and a minute on a twelve-hour face — and
 * the notations are functions of it. Nothing here stores the words, and that is
 * deliberate: `klokVorm` returns the *shape* of what is said and `features/klok`
 * puts the Dutch on it through `t()`, so the one module in this product whose
 * content is a sentence does not smuggle a dictionary into the pure layer.
 *
 * The ids are stable, because a Leitner box is filed under one: `klok-07-30` is
 * half past seven wherever it is asked and whichever way it is answered.
 */

import type { Niveau } from './types';

/** How fine the times in a set are, in minutes. The teaching order, as a number. */
export type KlokStap = 60 | 30 | 15 | 5;

export interface KlokItem {
  /** `klok-07-30`. Stable: a Leitner box is filed under it. */
  readonly id: string;
  /** 1–12, the way a face shows it rather than the way a phone does. */
  readonly uur: number;
  /** 0–55, in steps of five. */
  readonly minuut: number;
}

export interface KlokSet {
  /** `klok-heel`, `klok-half`, `klok-kwart`, `klok-vijf`. */
  readonly id: string;
  /** Null for a mix, whose items each sit at their own step. */
  readonly stap: KlokStap | null;
  /** How early a child is expected to meet it. Decides the order, nothing else. */
  readonly niveau: Niveau;
  readonly contentVersie: string;
  readonly items: readonly KlokItem[];
}

export const MINUTEN_PER_UUR = 60;

/**
 * The finest step the content goes to.
 *
 * Five minutes, so a face has a hundred and forty-four readings on it rather
 * than seven hundred and twenty. Where that line is drawn is a content
 * judgement and it is made in `tools/content/build-klok.mjs`; what it is doing
 * here is arithmetic, because a distractor five minutes out has to land on a
 * position the module actually teaches.
 */
const STAP = 5;

/** The hour the twelve-hour face rolls over to. `12 → 1`, not `12 → 13`. */
export function volgendUur(uur: number): number {
  return (uur % 12) + 1;
}

/**
 * One time, normalised and named.
 *
 * The hour wraps into 1–12 and the minute into 0–59, so arithmetic on a time —
 * which is what every distractor below is — cannot produce `13:65` or an id
 * nothing is filed under.
 */
export function klokItem(uur: number, minuut: number): KlokItem {
  const ronde = 12 * MINUTEN_PER_UUR;
  const totaal = (((uur * MINUTEN_PER_UUR + minuut) % ronde) + ronde) % ronde;
  const heel = Math.floor(totaal / MINUTEN_PER_UUR);
  const opFace = heel === 0 ? 12 : heel;
  const rest = totaal % MINUTEN_PER_UUR;

  return { id: klokId(opFace, rest), uur: opFace, minuut: rest };
}

export function klokId(uur: number, minuut: number): string {
  return `klok-${String(uur).padStart(2, '0')}-${String(minuut).padStart(2, '0')}`;
}

/**
 * The time as a digital clock shows it: `7:30`.
 *
 * Twelve-hour and not zero-padded, because it is the reading of *this* face and
 * a child writing it down writes "7:30". What a child may also type is wider
 * than what is shown here — see `judgeKlok`.
 */
export function klokDigitaal(item: KlokItem): string {
  return `${item.uur}:${String(item.minuut).padStart(2, '0')}`;
}

/**
 * How a time is said out loud, in parts.
 *
 * Dutch says a clock in eight shapes and every one of them names an hour: half
 * past seven is "half acht", and twenty past seven is "tien voor half acht".
 * The hour that gets named is therefore not always the hour the little hand is
 * nearest — it is the one the half belongs to — which is the single thing that
 * makes Dutch clock reading hard and the reason this is a type rather than a
 * format string.
 *
 * The words live in `i18n`; this says which words, and about which hour.
 */
export type KlokVorm =
  | { readonly soort: 'uur'; readonly uur: number }
  | { readonly soort: 'over'; readonly aantal: number; readonly uur: number }
  | { readonly soort: 'kwart-over'; readonly uur: number }
  | { readonly soort: 'voor-half'; readonly aantal: number; readonly uur: number }
  | { readonly soort: 'half'; readonly uur: number }
  | { readonly soort: 'over-half'; readonly aantal: number; readonly uur: number }
  | { readonly soort: 'kwart-voor'; readonly uur: number }
  | { readonly soort: 'voor'; readonly aantal: number; readonly uur: number };

export function klokVorm(item: KlokItem): KlokVorm {
  const { uur, minuut } = item;
  const straks = volgendUur(uur);

  if (minuut === 0) return { soort: 'uur', uur };
  if (minuut === 15) return { soort: 'kwart-over', uur };
  if (minuut === 30) return { soort: 'half', uur: straks };
  if (minuut === 45) return { soort: 'kwart-voor', uur: straks };
  if (minuut < 15) return { soort: 'over', aantal: minuut, uur };
  if (minuut < 30) return { soort: 'voor-half', aantal: 30 - minuut, uur: straks };
  if (minuut < 45) return { soort: 'over-half', aantal: minuut - 30, uur: straks };
  return { soort: 'voor', aantal: MINUTEN_PER_UUR - minuut, uur: straks };
}

/**
 * Where the two hands point, in degrees clockwise from twelve.
 *
 * The little hand moves with the minutes and that is not a detail: a face
 * showing half past seven has its hour hand exactly between the 7 and the 8,
 * and a drawing that parked it on the 7 would be teaching a child to read a
 * clock that does not exist.
 */
export function klokHoeken(item: KlokItem): { readonly uur: number; readonly minuut: number } {
  return {
    uur: (item.uur % 12) * 30 + item.minuut * 0.5,
    minuut: item.minuut * 6,
  };
}

/**
 * What a child typed, judged.
 *
 * Read generously and then compared exactly, which is the same trade `judgeSum`
 * makes. A child writes half past seven as `7:30`, `7.30`, `730`, `07:30` or
 * `7 30`, and every one of those is the right answer written by somebody who
 * knows what time it is. What is not accepted is a wrong time typed neatly.
 *
 * **The afternoon counts.** A face showing half past seven is 07:30 in the
 * morning and 19:30 after school, and both are true readings of it. A child who
 * types 19:30 has not made a mistake, and telling them they have would be
 * teaching them that a clock stops meaning anything after noon.
 */
export function judgeKlok(typed: string, item: KlokItem): boolean {
  const gelezen = leesTijd(typed);
  if (gelezen === null) return false;

  const [uur, minuut] = gelezen;
  if (minuut !== item.minuut) return false;
  return uur === item.uur || uur === middagUur(item.uur);
}

/** The same position on the twenty-four hour clock. Noon reads as 0, not as 24. */
function middagUur(uur: number): number {
  return uur === 12 ? 0 : uur + 12;
}

/** An hour and a minute, or null when what was typed is not a time at all. */
function leesTijd(typed: string): readonly [number, number] | null {
  // `u` is what a Dutch child writes on paper — "7u30" — and the separators are
  // whatever the keyboard put nearest their thumb.
  const schoon = typed.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,;u]/g, ':');

  const delen = /^(\d{1,2}):(\d{1,2})$/.exec(schoon);
  if (delen) return begrensd(Number(delen[1]), Number(delen[2]));

  // "730" and "0730": no separator at all, which is what a numeric keyboard
  // invites. The last two digits are the minutes, whatever is left is the hour.
  const aaneen = /^(\d{3,4})$/.exec(schoon)?.[1];
  if (aaneen) return begrensd(Number(aaneen.slice(0, -2)), Number(aaneen.slice(-2)));

  return null;
}

function begrensd(uur: number, minuut: number): readonly [number, number] | null {
  if (uur > 23 || minuut > 59) return null;
  return [uur, minuut] as const;
}

/**
 * Three wrong times, and they are the mistakes children actually make.
 *
 * The neighbours of a place come from the geodata and the neighbours of a sum
 * from arithmetic. The neighbours of a time come from the four ways a clock is
 * misread, in the order they cost a child marks:
 *
 * **An hour out.** "Half acht" is half past *seven*, and the whole of Dutch
 * clock reading turns on that. A child who reads it as half past eight has made
 * the mistake this module exists for, so it is the first wrong answer offered.
 *
 * **Over for voor.** Quarter past for quarter to, ten past for ten to: the same
 * distance from the hour, on the wrong side of it. That is the minute hand read
 * as a mirror image.
 *
 * **The hands swapped.** The big hand taken for the little one, which is what
 * happens before a child has noticed that one of them is shorter.
 *
 * **Five minutes out.** A miscount round the rim, and the mildest of the four —
 * last, and the one that fills up a short list.
 */
export function klokDistractors(item: KlokItem, count = 3): KlokItem[] {
  const gespiegeld = item.minuut === 0 ? 30 : MINUTEN_PER_UUR - item.minuut;

  const kandidaten: KlokItem[] = [
    klokItem(item.uur + 1, item.minuut),
    klokItem(item.uur, gespiegeld),
    // The hands read the wrong way round: the minute hand's position taken for
    // an hour, and the hour's for a minute.
    klokItem(item.minuut / STAP, (item.uur % 12) * STAP),
    klokItem(item.uur, item.minuut + STAP),
    klokItem(item.uur, item.minuut - STAP),
    klokItem(item.uur - 1, item.minuut),
  ];

  const uit: KlokItem[] = [];
  for (const kandidaat of kandidaten) {
    if (uit.length >= count) break;
    if (kandidaat.id === item.id || uit.some((eerder) => eerder.id === kandidaat.id)) continue;
    uit.push(kandidaat);
  }

  // A face has a hundred and forty-four five-minute positions on it, so this
  // only ever runs when the list above collided with itself — which it can, at
  // twelve o'clock. Walking round the rim is a poorer distractor and a better
  // one than a short list.
  for (let stap = 2; uit.length < count; stap++) {
    const kandidaat = klokItem(item.uur, item.minuut + stap * STAP);
    if (kandidaat.id !== item.id && !uit.some((eerder) => eerder.id === kandidaat.id)) {
      uit.push(kandidaat);
    }
  }

  return uit;
}
