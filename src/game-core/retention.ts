import { INTERVAL_DAYS } from './leitner';
import type { ItemState } from './types';

/**
 * How much of a set a child will still know on a given day.
 *
 * This is the number the home screen shows — "67%, weet je hier over drie weken
 * nog van" — and it is a better thing to show than mastery. Mastery says where
 * you are; retention says what happens if you do nothing, which is the only
 * fact that argues for practising today.
 *
 * The model is deliberately the simplest one that is defensible, for the same
 * reason Leitner beat SM-2 (ADR-005): a teacher has to be able to be told how it
 * works in one sentence. That sentence is **"after one box interval you still
 * know about nine tenths of it, and it falls off at the same rate after that."**
 *
 * It is a forecast, not a measurement, and the copy around it must never imply
 * otherwise.
 */

/** Retention still standing one interval after a review. */
const RETENTION_AT_INTERVAL = 0.9;

const DAY_MS = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

/**
 * Probability, between 0 and 1, that one item is still known `on` a date.
 *
 * An item that has never been answered returns 0: not knowing it yet and
 * forgetting it are different things, but for "what will you know in three
 * weeks" they come to the same number, and a hopeful guess here would make the
 * whole figure a lie.
 */
export function itemRetention(state: ItemState | undefined, on: Date): number {
  if (!state || state.laatsteReview === null) return 0;

  const elapsed = daysBetween(new Date(state.laatsteReview), on);
  if (elapsed <= 0) return 1;

  const interval = INTERVAL_DAYS[state.box];
  return Math.pow(RETENTION_AT_INTERVAL, elapsed / interval);
}

/**
 * The average across a set, as a whole percentage.
 *
 * An average rather than a product: the question a child is answering is "how
 * much of this will I still know", not "will I know all of it", and a product
 * over twelve provinces would read as near zero however well they were doing.
 */
export function setRetention(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  on: Date,
): number {
  if (itemIds.length === 0) return 0;

  let total = 0;
  for (const id of itemIds) total += itemRetention(states.get(id), on);
  return Math.round((total / itemIds.length) * 100);
}

/**
 * What today's round would be worth: the same forecast, but with every item due
 * now answered correctly and rescheduled.
 *
 * This drives the second line on the home screen — "Eén ronde vandaag houdt het
 * op 80%." It is an honest best case and the copy says "houdt het op", not
 * "brengt het op": it is what practising protects, not what it adds.
 */
export function retentionAfterRound(
  states: ReadonlyMap<string, ItemState>,
  itemIds: readonly string[],
  on: Date,
  now: Date,
): number {
  if (itemIds.length === 0) return 0;

  let total = 0;
  for (const id of itemIds) {
    const state = states.get(id);
    const due = !state || state.volgendeReview === null || new Date(state.volgendeReview) <= now;

    if (!due && state) {
      total += itemRetention(state, on);
      continue;
    }

    // Answered correctly today: one box up, reviewed now.
    const box = state ? (Math.min(state.box + 1, 5) as ItemState['box']) : 2;
    total += itemRetention(
      {
        itemId: id,
        box,
        laatsteReview: now.toISOString(),
        volgendeReview: null,
        goedCount: 0,
        foutCount: 0,
      },
      on,
    );
  }

  return Math.round((total / itemIds.length) * 100);
}

/** How many items in a set are at box 5 — the "8/12 vast" on the home screen. */
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
