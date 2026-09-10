import { earnedAt, plekOf, PER_REEKS, REEKSEN, type Reeks } from './collection';
import { levelFor } from './rewards';

/**
 * Heroes, stars and chests (ADR-096).
 *
 * Ten correct answers are a star. Five stars are a chest, and a chest holds one
 * of the twelve heroes. A hero a child already has counts as a duplicate, and
 * three duplicates move that hero up a reeks — bronze, silver, gold, platinum,
 * ultra. The level ladder stays beside it, counted in the same answers.
 *
 * **Which hero is in a chest is chance.** That is the one thing here that is,
 * and it is the owner's decision against spec §4.5 and ADR-067, taken knowingly
 * and written down in ADR-096. Everything around it is not: whether there is a
 * chest, and what it costs, is arithmetic on correct answers and nothing else.
 * Nothing can be bought, nothing arrives by waiting, and every hero is equally
 * likely — the rules say so on the collection page, in those words.
 *
 * Pure, like the rest of game-core: the draw comes in as a number between 0 and
 * 1, so the chance lives in the store and a test can hand in any draw it likes.
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

/** What one chest did: a new hero, a duplicate, a hero going up, or nothing left to go. */
export type KistSoort = 'nieuw' | 'dubbel' | 'hoger' | 'vol';

export interface KistUitkomst {
  readonly plek: number;
  /** The hero's reeks after the chest. */
  readonly reeks: Reeks;
  /** Its duplicates after the chest. */
  readonly dubbelen: number;
  readonly soort: KistSoort;
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

/** The reeks above this one, or null at ultra. */
export function volgendeReeks(reeks: Reeks): Reeks | null {
  return REEKSEN[REEKSEN.indexOf(reeks) + 1] ?? null;
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
 * One chest, opened with one draw between 0 and 1.
 *
 * The draw picks one of the twelve, each equally likely. A hero not yet held
 * arrives in bronze. One already held counts a duplicate, and the third moves it
 * up a reeks with its duplicates back to nought. One already at ultra has
 * nowhere to go, and the chest says so rather than pretending otherwise.
 */
export function openKist(
  stand: HeldenStand,
  trek: number,
): { readonly stand: HeldenStand; readonly uitkomst: KistUitkomst } {
  const plek = Math.min(AANTAL_HELDEN - 1, Math.max(0, Math.floor(trek * AANTAL_HELDEN)));
  const al = stand.helden.find((held) => held.plek === plek);

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
    stand: { helden, kistenOpen: stand.kistenOpen + 1 },
    uitkomst: { plek, reeks: held.reeks, dubbelen: held.dubbelen, soort },
  };
}

/**
 * Every chest these answers have paid for and nobody has opened yet, in order.
 *
 * Almost always none. One when a round crossed a fifty, and more only when a
 * long round crossed several.
 */
export function openVerdiend(
  stand: HeldenStand,
  correct: number,
  trek: () => number,
): { readonly stand: HeldenStand; readonly uitkomsten: readonly KistUitkomst[] } {
  let nu = stand;
  const uitkomsten: KistUitkomst[] = [];

  for (let kist = nu.kistenOpen; kist < kistenVoor(correct); kist++) {
    const geopend = openKist(nu, trek());
    nu = geopend.stand;
    uitkomsten.push(geopend.uitkomst);
  }

  return { stand: nu, uitkomsten };
}
