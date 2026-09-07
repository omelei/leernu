import { describe, expect, it } from 'vitest';
import { emptyState, review, type ItemState } from '@/game-core';
import { dueLabel, retentionOf, statusOf } from './itemStatus';

/**
 * The mapping ADR-042 settled, checked against the scheduler rather than
 * against a table of boxes — so that if the Leitner intervals ever move, this
 * either follows them or fails loudly.
 */

/** Walks an item up the boxes the only way a child can: by being right. */
function correctTimes(times: number, from = new Date('2026-09-01T10:00:00')): ItemState {
  let state = emptyState('nl-prov-drenthe');
  for (let n = 0; n < times; n++) {
    state = review(state, true, new Date(from.getTime() + n * 86_400_000 * 30));
  }
  return state;
}

describe('what one item is doing', () => {
  it('calls an item nobody has seen new, not wrong', () => {
    expect(statusOf(undefined)).toBe('new');
    expect(statusOf(emptyState('nl-prov-drenthe'))).toBe('new');
    // An empty dot, so the shape says the same thing as the word.
    expect(retentionOf(undefined)).toBe(0);
  });

  it('walks from practising to remembered to the freezer', () => {
    expect(statusOf(correctTimes(1))).toBe('practising');
    expect(statusOf(correctTimes(2))).toBe('practising');
    expect(statusOf(correctTimes(3))).toBe('remembered');
    // Four correct in a row is what the business plan calls a stamp, and it is
    // the same four that reach the last box.
    expect(statusOf(correctTimes(4))).toBe('frozen');
    expect(statusOf(correctTimes(9))).toBe('frozen');
  });

  it('fills the dot in step with the box', () => {
    expect(retentionOf(correctTimes(1))).toBe(0.25);
    expect(retentionOf(correctTimes(2))).toBe(0.5);
    expect(retentionOf(correctTimes(3))).toBe(0.75);
    expect(retentionOf(correctTimes(4))).toBe(1);
  });

  it('sends one wrong answer all the way back to the start', () => {
    // Leitner here is strict, and this test exists to say so out loud. A wrong
    // answer does not step down one box: `nextBox` returns 1 whatever the item
    // was on, so weeks in the freezer end at "nog niet onthouden" the moment a
    // child misses it once.
    //
    // Whether that is right is a teaching question and not this file's to
    // answer — ADR-005 chose the schedule for being explainable in a sentence,
    // and "one mistake and it starts again" is certainly that. What matters
    // here is that the label follows the box rather than softening it, so the
    // screen never claims a child remembers something the scheduler has already
    // decided to ask them again tomorrow.
    const slipped = review(correctTimes(4), false, new Date('2026-10-01T10:00:00'));
    expect(slipped.box).toBe(1);
    expect(statusOf(slipped)).toBe('practising');
    expect(retentionOf(slipped)).toBe(0);
  });

  it('says "today" for anything already due rather than showing a past date', () => {
    // A date in the past is a small accusation, and the answer to "when?" is
    // the same either way.
    const now = new Date('2026-10-01T10:00:00');
    expect(dueLabel(correctTimes(1), now)).toBe('due');
    expect(dueLabel(undefined, now)).toBe('due');

    const fresh = review(emptyState('x'), true, now);
    expect(dueLabel(fresh, now)).toBeInstanceOf(Date);
  });
});
