import { masteryPercent, type ItemState } from '@/game-core';
import type { ItemStatus } from '@/components/StatusLabel';

/**
 * What one item is doing, from its Leitner box (ADR-042).
 *
 * The dot and the label answer different questions on purpose. The dot says how
 * much of this you hold — straight from `masteryPercent`, and the same shape as
 * everywhere else in the product. The label says what the scheduler will do
 * next. Box five is both the fullest dot and the freezer, and that is not a
 * collision: it is one fact from two sides. You remember it, so we will leave it
 * alone for three weeks.
 */
export function statusOf(state: ItemState | undefined): ItemStatus {
  if (!state || state.laatsteReview === null) return 'new';
  if (state.box >= 5) return 'frozen';
  if (state.box === 4) return 'remembered';
  return 'practising';
}

/** How full the dot is: 0, 0.25, 0.5, 0.75 or 1. */
export function retentionOf(state: ItemState | undefined): number {
  return masteryPercent(state) / 100;
}

/**
 * When the item comes back, as a day the child can plan around.
 *
 * "Vandaag" rather than a date for anything already due, because a date in the
 * past is a small accusation and the answer to "when?" is the same either way.
 */
export function dueLabel(state: ItemState | undefined, now: Date): 'due' | Date {
  if (!state || state.volgendeReview === null) return 'due';
  const due = new Date(state.volgendeReview);
  return due.getTime() <= now.getTime() ? 'due' : due;
}
