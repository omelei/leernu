import { emptyState, isDue, review } from './leitner';
import { setRetention } from './retention';
import type { ItemState } from './types';

/**
 * The two numbers a test date is worth: what the test day looks like if nothing
 * happens, and what it looks like if this child practises between now and then.
 *
 * A date on its own is a sticker. It says when, and the child already knew
 * when. The argument this product makes — practise today so you still know it
 * later — only becomes an argument when "later" is a day the child cares about,
 * and the test is that day. So the forecast is re-aimed at it: not "over drie
 * weken", but "op vrijdag".
 *
 * The optimistic half is a simulation, and it is deliberately a plain one:
 * walk forward a day at a time, answer what the scheduler would put in front of
 * you, get it right, and ask the retention model what it thinks on the test
 * day. Every part of that is a function this product already uses to run a
 * round, which is what makes it a forecast rather than a marketing figure.
 *
 * Three things keep it honest.
 *
 * It answers at most a round's worth per day, oldest due first, because that is
 * what a round is — a set of eighty does not go past a child in one evening,
 * and a plan that assumed it would would be a promise nobody could keep.
 *
 * It assumes every answer is right, which nobody's is. That makes it a ceiling,
 * and the copy that carries it has to say "ongeveer" and never a target.
 *
 * And it counts nothing beyond the test. Practice after the day being planned
 * for cannot change what is known on that day.
 */

const DAY_MS = 86_400_000;

/** Local midnight. A plan is counted in days a child recognises, not in hours. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export interface Outlook {
  /** What is known on the test day if nothing is practised between now and it. */
  readonly asIs: number;
  /** The same day, having practised every day until it. A ceiling, not a target. */
  readonly practised: number;
  /** Whether any of these items has ever been answered. */
  readonly started: boolean;
}

export function testOutlook(input: {
  readonly states: ReadonlyMap<string, ItemState>;
  readonly itemIds: readonly string[];
  readonly now: Date;
  readonly testDay: Date;
  /** How many questions one round asks. The cap on a day's practice. */
  readonly perDay: number;
}): Outlook {
  const { states, itemIds, now, testDay, perDay } = input;

  const started = itemIds.some((id) => states.get(id)?.laatsteReview != null);
  const asIs = setRetention(states, itemIds, testDay);

  const today = startOfDay(now);
  const last = startOfDay(testDay);
  const days = Math.round((last.getTime() - today.getTime()) / DAY_MS);

  // The test is today or has been. There is nothing left to plan, and the
  // honest optimistic figure is the pessimistic one.
  if (days <= 0 || perDay <= 0) return { asIs, practised: asIs, started };

  const simulated = new Map(states);

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(today.getTime() + offset * DAY_MS);

    // What a round would ask today: what is due, oldest first. `composeRound`
    // adds new material and a little revision on top of that; both only help,
    // so leaving them out keeps this a floor on the optimistic case rather than
    // a second guess about the mix.
    const due = itemIds
      .map((id) => simulated.get(id) ?? emptyState(id))
      .filter((state) => isDue(state, day))
      // Oldest due first, and anything never scheduled last: a round is due
      // work before new material, and so is this.
      .sort((a, b) => (a.volgendeReview ?? '9999').localeCompare(b.volgendeReview ?? '9999'))
      .slice(0, perDay);

    for (const state of due) simulated.set(state.itemId, review(state, true, day));
  }

  return { asIs, practised: setRetention(simulated, itemIds, testDay), started };
}
