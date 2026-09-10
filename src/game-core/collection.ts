/**
 * The collection: twelve animals, five times over.
 *
 * A level hands out one animal. Twelve of them make a **reeks**, and when a
 * reeks is full the next one starts in a new material — bronze, silver, gold,
 * platinum, ultra. Sixty in all, and the last of them is a long way off on
 * purpose: a collection a child fills in a fortnight is a collection they stop
 * looking at in three weeks (ADR-071).
 *
 * The five were ink, bronze, silver, gold and diamond, and two of those five
 * were doing no work. "Ink" is the product's own colour and named nothing a
 * child could rank; "diamond" is precious but it is not a rung anybody counts
 * from. Bronze to ultra is the ladder every ten-year-old already reads off
 * every game they play, which means the order needs no legend (ADR-080).
 *
 * Three animals arrive at level one rather than one, which is ADR-059's point
 * surviving into a ladder: a child who cannot change anything about an app they
 * are told to use can at least decide what it looks like, and a choice between
 * one thing is not a choice.
 *
 * Materials rather than "colours". Each rung is told apart by name as well as
 * by hue — which is the rule §A applies to everything else in this product and
 * there is no reason a reward should be the exception.
 *
 * This is pure and lives in game-core: it decides what has been earned, never
 * what it looks like. The drawings are `components/Stickers.tsx` and the
 * materials are five tokens in `index.css`.
 *
 * **Since ADR-096 this ladder hands nothing out.** Heroes arrive in chests
 * (`helden.ts`). What this still decides is where a child who climbed it
 * starts: `uitLadder` reads the animals it had given them and turns each into
 * that hero, in the highest reeks they held it in.
 */

export const REEKSEN = ['brons', 'zilver', 'goud', 'platina', 'ultra'] as const;
export type Reeks = (typeof REEKSEN)[number];

/** How many animals one reeks holds. The number of drawings there are. */
export const PER_REEKS = 12;
/** How many a child has before they have answered anything. */
export const AT_LEVEL_ONE = 3;
/** Sixty, and the last one is level 58. */
export const COLLECTION_SIZE = REEKSEN.length * PER_REEKS;

/** One place in the collection: which reeks, and which animal in it. */
export interface Plek {
  readonly reeks: Reeks;
  /** 0 to 11, the animal's own place in the order they arrive. */
  readonly plek: number;
}

/**
 * How many animals a child standing on this level has.
 *
 * Level one is three, and every level after it is one more, until the
 * collection runs out. It never goes down.
 */
export function earnedAt(level: number): number {
  const earned = AT_LEVEL_ONE + Math.max(0, level - 1);
  return Math.min(COLLECTION_SIZE, Math.max(0, earned));
}

/** Which level hands out the nth animal, counting from one. */
export function levelForEarned(nth: number): number {
  return Math.max(1, nth - AT_LEVEL_ONE + 1);
}

/** Where the nth animal sits, counting from one. */
export function plekOf(nth: number): Plek {
  const index = Math.max(1, nth) - 1;
  const reeks = REEKSEN[Math.floor(index / PER_REEKS)] ?? REEKSEN[REEKSEN.length - 1];
  return { reeks: reeks as Reeks, plek: index % PER_REEKS };
}

/** Whether the animal at this place has been earned by this level. */
export function isEarned(level: number, plek: Plek): boolean {
  const reeksAt = REEKSEN.indexOf(plek.reeks);
  if (reeksAt < 0) return false;
  return reeksAt * PER_REEKS + plek.plek < earnedAt(level);
}

/**
 * The one that arrives next, or null once all sixty are held.
 *
 * Shown as a silhouette beside the level. A ladder whose next rung is a
 * surprise is not a ladder a child can aim at.
 */
export function nextPlek(level: number): Plek | null {
  const earned = earnedAt(level);
  return earned >= COLLECTION_SIZE ? null : plekOf(earned + 1);
}

/**
 * The animals that arrive between two levels, in the order they arrive.
 *
 * A round can cross more than one level — a hundred questions of the Rekenmix
 * at level three will — so this is a list rather than one place. Empty where
 * nothing was crossed, which is every round but a few.
 *
 * Pure, and it takes levels rather than answer counts so that the arithmetic
 * from correct answers to a level stays in one place (`rewards.ts`).
 */
export function nieuwePlekken(vanLevel: number, naarLevel: number): Plek[] {
  const van = earnedAt(vanLevel);
  const naar = earnedAt(naarLevel);

  const plekken: Plek[] = [];
  for (let nth = van + 1; nth <= naar; nth++) plekken.push(plekOf(nth));
  return plekken;
}

/** Which reeks a child is filling now: the one the next animal belongs to. */
export function huidigeReeks(level: number): Reeks {
  return (nextPlek(level) ?? plekOf(COLLECTION_SIZE)).reeks;
}

/** How many of one reeks are held. Drives the count under each row. */
export function inReeks(level: number, reeks: Reeks): number {
  const at = REEKSEN.indexOf(reeks);
  if (at < 0) return 0;
  return Math.min(PER_REEKS, Math.max(0, earnedAt(level) - at * PER_REEKS));
}
