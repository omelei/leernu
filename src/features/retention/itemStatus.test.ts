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

  it('takes one slip out of the freezer, but not out of remembering', () => {
    // A single wrong answer moves box five to box four, which is "dit onthoud
    // je nu" and not "nog niet onthouden". That is the scheduler being kind on
    // purpose (ADR-005) and the label following it rather than overruling it: a
    // child who misses one after weeks of getting it right has not forgotten it.
    const slipped = review(correctTimes(4), false, new Date('2026-10-01T10:00:00'));
    expect(statusOf(slipped)).toBe('remembered');
    expect(retentionOf(slipped)).toBe(0.75);

    // Two more, and it really is back to practising.
    const twice = review(slipped, false, new Date('2026-10-02T10:00:00'));
    expect(statusOf(twice)).toBe('practising');
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
