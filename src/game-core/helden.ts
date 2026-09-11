import { earnedAt, plekOf, PER_REEKS, REEKSEN, type Reeks } from './collection';
import { levelFor } from './rewards';

/**
 * Heroes, stars and chests (ADR-096, ADR-097).
 *
 * Ten correct answers are a star. Five stars are a chest, and a chest holds one
 * of the twelve heroes. Three duplicates move a hero up a reeks — bronze,
 * silver, gold, platinum, ultra. The level ladder stays beside it, counted in
 * the same answers.
 *
 * **Nothing here is chance.** ADR-096 made which hero a chest holds a draw;
 * ADR-097 reverses that, and spec §4.5 and ADR-067's first condition stand
 * again. A chest offers three heroes and the child turns one over. Until the
 * twelve are held the three are heroes this child does not have, so **every
 * chest gives a hero you did not have**: twelve chests, twelve heroes, six
 * hundred correct answers, the same for every child. After that the three are
 * heroes not yet at ultra, and the choice is which one climbs.
 *
 * The order the three are taken from is fixed and the same for everybody, so
 * **the choice changes when, never whether**: taking a favourite first shifts
 * the rest forward, and the child ends with all twelve either way.
 *
 * Pure, like the rest of game-core: it decides what a chest may offer and what
 * choosing one does, and it reads no clock, no store and no random source.
 */

/** Correct answers that make one star. */
export const GOED_PER_STER = 10;
/** Stars that make one chest. */
export const STERREN_PER_KIST = 5;
/** Correct answers that make one chest: fifty. */
export const GOED_PER_KIST = GOED_PER_STER * STERREN_PER_KIST;
/** Duplicates that move a hero up one reeks. */
export const DUBBELEN_PER_REEKS = 3;
/** The twelve drawings there are. A hero is one of them in one material. */
export const AANTAL_HELDEN = PER_REEKS;
/** How many a chest lays out to choose between. */
export const KEUZE_PER_KIST = 3;

/**
 * The order a chest works through the twelve.
 *
 * Fixed, and the same for every child, so there is no random number anywhere in
 * the reward path and two children who practise as much end with as much. It is
 * not the drawing order, because a chest that offered places 0, 1 and 2 first
 * would read as a list rather than as an offer.
 */
export const KIST_VOLGORDE: readonly number[] = [4, 9, 1, 11, 6, 2, 8, 0, 10, 5, 3, 7];

export interface Held {
  /** Which of the twelve: its place in the order they are drawn, `STICKERS[plek]`. */
  readonly plek: number;
  readonly reeks: Reeks;
  /** Duplicates towards the next reeks, nought to two. */
  readonly dubbelen: number;
}

export interface HeldenStand {
  /** The heroes a child has, by place. */
  readonly helden: readonly Held[];
  /** How many chests have been opened, ever. What is still owed is the rest. */
  readonly kistenOpen: number;
}

/**
 * What one chest did.
 *
 * `vol` — a hero already at ultra — is unreachable since ADR-097, because a
 * hero at ultra is never offered. It stays in the union so a row written by an
 * older version still reads, and so there is still something to say if one ever
 * turns up.
 */
export type KistSoort = 'nieuw' | 'dubbel' | 'hoger' | 'vol';

export interface KistUitkomst {
  readonly plek: number;
  /** The hero's reeks after the chest. */
  readonly reeks: Reeks;
  /** Its duplicates after the chest. */
  readonly dubbelen: number;
  readonly soort: KistSoort;
  /**
   * Which chest handed it over, counting from one.
   *
   * ADR-084 asks a reward to say what it is, which reeks it is in, and which
   * moment handed it over. The parcel said "niveau 34"; a chest says which
   * chest, and without it the third of those three was missing.
   */
  readonly kist: number;
}

export function sterrenVoor(correct: number): number {
  return Math.floor(Math.max(0, correct) / GOED_PER_STER);
}

export function kistenVoor(correct: number): number {
  return Math.floor(Math.max(0, correct) / GOED_PER_KIST);
}

/** How many of the next chest's five stars are already there. */
export function sterrenInKist(correct: number): number {
  return sterrenVoor(correct) % STERREN_PER_KIST;
}

/** Correct answers still to go before the next chest, one to fifty. */
export function goedTotKist(correct: number): number {
  return GOED_PER_KIST - (Math.max(0, correct) % GOED_PER_KIST);
}

/** How many of the current star's ten are in. Shown during a round (ADR-099). */
export function goedInSter(correct: number): number {
  return Math.max(0, correct) % GOED_PER_STER;
}

/**
 * How full the next chest is, 0 to 1.
 *
 * The bar in the child's own column measures this rather than the level
 * (ADR-099): a bar should fill towards the thing that hands something over, and
 * since ADR-096 a level hands out nothing.
 */
export function kistProgress(correct: number): number {
  return (Math.max(0, correct) % GOED_PER_KIST) / GOED_PER_KIST;
}

/** The reeks above this one, or null at ultra. */
export function volgendeReeks(reeks: Reeks): Reeks | null {
  return REEKSEN[REEKSEN.indexOf(reeks) + 1] ?? null;
}

/** The reeks below this one, or null at bronze. Named when a hero climbs. */
export function vorigeReeks(reeks: Reeks): Reeks | null {
  const at = REEKSEN.indexOf(reeks);
  return at <= 0 ? null : (REEKSEN[at - 1] ?? null);
}

/** Whether this hero has nowhere left to climb. */
function opUltra(held: Held | undefined): boolean {
  return held !== undefined && volgendeReeks(held.reeks) === null;
}

/**
 * What a child who climbed the old ladder starts with, so nobody loses anything.
 *
 * Every animal they held becomes that hero, in the highest reeks they held it
 * in: a child with the fox in bronze and in silver has the fox, in silver. The
 * chests their answers already paid for count as opened — they were paid out as
 * animals — so the first chest arrives at the next fifty, not as a pile.
 *
 * A new child comes through here too, with nought answers: level one, and the
 * three the ladder always started with. A child always has one (ADR-067).
 */
export function uitLadder(correct: number): HeldenStand {
  const beste = new Map<number, Reeks>();
  const earned = earnedAt(levelFor(correct));

  for (let nth = 1; nth <= earned; nth++) {
    const { plek, reeks } = plekOf(nth);
    // Later places are in later reeksen, so the last one seen is the highest.
    beste.set(plek, reeks);
  }

  const helden = [...beste.entries()]
    .sort(([a], [b]) => a - b)
    .map(([plek, reeks]) => ({ plek, reeks, dubbelen: 0 }));

  return { helden, kistenOpen: kistenVoor(correct) };
}

/**
 * The three a chest lays out.
 *
 * While any of the twelve is missing they are the first three missing ones in
 * `KIST_VOLGORDE`, so a chest can never hand over something the child already
 * has. Once all twelve are held they are the first three not at ultra, and
 * choosing is deciding who climbs.
 *
 * Fewer than three near the end, and one is a choice between one thing — which
 * is honest, because there is nothing else left to offer. Empty only when every
 * hero is at ultra: that is the end of the collection, and "ultra" is the word
 * this product uses for the end (ADR-080).
 */
export function aanbod(stand: HeldenStand): readonly number[] {
  const held = new Map(stand.helden.map((een) => [een.plek, een] as const));
  const ontbreekt = KIST_VOLGORDE.filter((plek) => !held.has(plek));

  const bron =
    ontbreekt.length > 0 ? ontbreekt : KIST_VOLGORDE.filter((plek) => !opUltra(held.get(plek)));

  return bron.slice(0, KEUZE_PER_KIST);
}

/**
 * One chest, opened on the hero the child chose.
 *
 * A hero not yet held arrives in bronze. One already held counts a duplicate,
 * and the third moves it up a reeks with its duplicates back to nought.
 *
 * A place the chest did not offer falls back to the first one it did, rather
 * than throwing: this runs behind a button, and a stale press should hand over
 * the obvious thing instead of taking the screen down. `aanbod` is the rule and
 * this is the only place that applies it.
 */
export function openKist(
  stand: HeldenStand,
  keuze: number,
): { readonly stand: HeldenStand; readonly uitkomst: KistUitkomst } {
  const aangeboden = aanbod(stand);
  const plek = aangeboden.includes(keuze) ? keuze : (aangeboden[0] ?? keuze);
  const al = stand.helden.find((held) => held.plek === plek);
  const kist = stand.kistenOpen + 1;

  let held: Held;
  let soort: KistSoort;

  if (!al) {
    held = { plek, reeks: REEKSEN[0], dubbelen: 0 };
    soort = 'nieuw';
  } else {
    const hoger = volgendeReeks(al.reeks);
    if (hoger === null) {
      held = al;
      soort = 'vol';
    } else if (al.dubbelen + 1 >= DUBBELEN_PER_REEKS) {
      held = { plek, reeks: hoger, dubbelen: 0 };
      soort = 'hoger';
    } else {
      held = { ...al, dubbelen: al.dubbelen + 1 };
      soort = 'dubbel';
    }
  }

  const helden = [...stand.helden.filter((ander) => ander.plek !== plek), held].sort(
    (a, b) => a.plek - b.plek,
  );

  return {
    stand: { helden, kistenOpen: kist },
    uitkomst: { plek, reeks: held.reeks, dubbelen: held.dubbelen, soort, kist },
  };
}

/**
 * What one of the three on offer would do, without doing it.
 *
 * The cards say so before the child presses: three things that do not say what
 * they are is not a choice, it is three buttons.
 */
export function watKistDoet(stand: HeldenStand, keuze: number): KistUitkomst {
  return openKist(stand, keuze).uitkomst;
}

/**
 * Chests these answers have paid for and nobody has chosen from yet.
 *
 * Almost always none. One when a round crossed a fifty, and more only when a
 * long round crossed several. A chest earned and never opened — a round left
 * halfway, a screen closed — is still owed at the end of the next round,
 * because this is a subtraction and not an event.
 */
export function kistenTeGoed(stand: HeldenStand, correct: number): number {
  return Math.max(0, kistenVoor(correct) - stand.kistenOpen);
}
