import { beginVanDag, dagSleutel, plusDagen } from './kalender';
import type { ItemState } from './types';

/**
 * What a child remembers, and the figure the dot shows (ADR-107).
 *
 * **An item is remembered** when its last answer was right — box two or
 * higher — and its next review has not yet come. That is the whole definition,
 * and it can be said in one sentence to a child, a parent or a teacher: _you
 * remember something until it is due to be practised again_.
 *
 * **A set's retention** is the share of its items that are remembered, as a
 * whole percentage. It is the same number as the count beside it — nine of
 * twelve is a dot three quarters full — so the dot and the sentence "Sofie
 * onthoudt 9 van de 12 provincies" can never disagree.
 *
 * **No value** is not zero. A set with no items, or whose items have never been
 * answered, has no retention, and the dot is not drawn for it.
 *
 * This replaced a forecast, `0.9^(days / interval)`, that was never measured,
 * stood beside a count computed another way, and gave an item answered wrong a
 * minute ago a retention of 100% because it had just been reviewed.
 */

/** Whether an item is remembered at a given moment. */
export function isOnthouden(state: ItemState | undefined, op: Date): boolean {
  if (!state || state.laatsteReview === null || state.volgendeReview === null) return false;
  if (state.box < 2) return false;
  return new Date(state.volgendeReview).getTime() > op.getTime();
}

/** How many of these items are remembered at a given moment. */
export function aantalOnthouden(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  op: Date,
): number {
  let aantal = 0;
  for (const id of new Set(itemIds)) if (isOnthouden(states.get(id), op)) aantal++;
  return aantal;
}

/** Whether any item in the set has ever been answered. */
export function isAangeraakt(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
): boolean {
  return itemIds.some((id) => (states.get(id)?.laatsteReview ?? null) !== null);
}

/**
 * The figure the dot shows: the share of a set remembered at a moment, from 0
 * to 100 — or null where there is nothing to show.
 */
export function setRetentie(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  op: Date,
): number | null {
  const uniek = [...new Set(itemIds)];
  if (uniek.length === 0 || !isAangeraakt(states, uniek)) return null;
  return Math.round((100 * aantalOnthouden(states, uniek, op)) / uniek.length);
}

/** The horizon on the test card (S2): now, in a week, in three weeks. */
export const HORIZON_DAGEN = { nu: 0, week: 7, drieWeken: 21 } as const;

/**
 * A moment some whole days from now, at the start of that day in Amsterdam:
 * reviews fall on the start of a day, so "in a week" asks about the whole of
 * that day rather than about one hour of it.
 */
export function momentOver(nu: Date, dagen: number): Date {
  return dagen === 0 ? nu : beginVanDag(plusDagen(dagSleutel(nu), dagen));
}

export interface Horizon {
  readonly nu: number | null;
  readonly week: number | null;
  readonly drieWeken: number | null;
}

/** What a child would still remember at each point of the horizon if they did nothing. */
export function retentieHorizon(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  nu: Date,
): Horizon {
  return {
    nu: setRetentie(states, itemIds, momentOver(nu, HORIZON_DAGEN.nu)),
    week: setRetentie(states, itemIds, momentOver(nu, HORIZON_DAGEN.week)),
    drieWeken: setRetentie(states, itemIds, momentOver(nu, HORIZON_DAGEN.drieWeken)),
  };
}

/**
 * How many items in a set are in box five. Not what "remembered" means any
 * more (ADR-107); it is what the stamp "Alles onthouden" asks for, every item
 * four times right in a row, and nothing else reads it.
 */
export function countMastered(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
): number {
  let count = 0;
  for (const id of itemIds) {
    if (states.get(id)?.box === 5) count++;
  }
  return count;
}
