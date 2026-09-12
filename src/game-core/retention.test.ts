import { describe, expect, it } from 'vitest';
import { emptyState, review } from './leitner';
import {
  aantalOnthouden,
  countMastered,
  isOnthouden,
  momentOver,
  retentieHorizon,
  setRetentie,
} from './retention';
import type { ItemState, LeitnerBox } from './types';

/** Saturday 5 September 2026, noon in Amsterdam. */
const NOW = new Date('2026-09-05T10:00:00.000Z');
const DAY = 86_400_000;

/** An item last answered right, due again `inDays` days from now. */
function state(id: string, box: LeitnerBox, inDays: number): ItemState {
  return {
    itemId: id,
    box,
    laatsteReview: new Date(NOW.getTime() - DAY).toISOString(),
    volgendeReview: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    goedCount: 1,
    foutCount: 0,
  };
}

describe('isOnthouden', () => {
  it('is false for something never answered', () => {
    expect(isOnthouden(undefined, NOW)).toBe(false);
    expect(isOnthouden(emptyState('x'), NOW)).toBe(false);
  });

  it('is true once answered right, until it is due', () => {
    const after = review(emptyState('x'), true, NOW);
    expect(isOnthouden(after, NOW)).toBe(true);
    expect(isOnthouden(after, new Date(after.volgendeReview ?? ''))).toBe(false);
  });

  // The flaw in the old forecast: an item just answered wrong was "just
  // reviewed", and so read as fully known. Wrong is not remembered.
  it('is false straight after a wrong answer', () => {
    const after = review(state('x', 4, 3), false, NOW);
    expect(after.box).toBe(1);
    expect(isOnthouden(after, NOW)).toBe(false);
  });
});

describe('setRetentie', () => {
  it('has no value for a set with no items', () => {
    expect(setRetentie(new Map(), [], NOW)).toBeNull();
  });

  it('has no value for a set that has never been touched — not zero', () => {
    const states = new Map([['elders', state('elders', 3, 2)]]);
    expect(setRetentie(states, ['a', 'b', 'c'], NOW)).toBeNull();
  });

  it('is 100 when every item has just been answered right', () => {
    const states = new Map<string, ItemState>();
    for (const id of ['a', 'b', 'c', 'd']) states.set(id, review(emptyState(id), true, NOW));
    expect(setRetentie(states, ['a', 'b', 'c', 'd'], NOW)).toBe(100);
  });

  it('is 0, and still a value, when everything that was learned is due', () => {
    const states = new Map([
      ['a', state('a', 3, -1)],
      ['b', state('b', 2, -2)],
    ]);
    expect(setRetentie(states, ['a', 'b'], NOW)).toBe(0);
  });

  it('is the same number as the count beside it', () => {
    // Nine of twelve: a dot three quarters full.
    const ids = Array.from({ length: 12 }, (_, i) => `p${i}`);
    const states = new Map<string, ItemState>();
    ids.slice(0, 9).forEach((id) => states.set(id, state(id, 3, 4)));
    states.set('p9', state('p9', 1, 1));
    expect(aantalOnthouden(states, ids, NOW)).toBe(9);
    expect(setRetentie(states, ids, NOW)).toBe(75);
  });

  it('counts an unseen item as not remembered once the set has been touched', () => {
    const states = new Map([['a', state('a', 5, 21)]]);
    expect(setRetentie(states, ['a', 'b'], NOW)).toBe(50);
  });

  it('counts an item once, however often a round asked it', () => {
    const states = new Map([['a', state('a', 2, 2)]]);
    expect(setRetentie(states, ['a', 'a', 'b'], NOW)).toBe(50);
  });
});

describe('retentieHorizon', () => {
  it('falls as the horizon moves out, and never rises', () => {
    // "In three weeks" is the start of Saturday 26 September in Amsterdam: an
    // item due during the 25th is gone by then, one due after it is not.
    const states = new Map([
      ['a', state('a', 2, 2)],
      ['b', state('b', 4, 8)],
      ['c', state('c', 5, 20)],
      ['d', state('d', 5, 30)],
    ]);
    const horizon = retentieHorizon(states, ['a', 'b', 'c', 'd'], NOW);
    expect(horizon).toEqual({ nu: 100, week: 75, drieWeken: 25 });
  });

  it('has no value at any point for a set never touched', () => {
    expect(retentieHorizon(new Map(), ['a'], NOW)).toEqual({
      nu: null,
      week: null,
      drieWeken: null,
    });
  });

  it('asks about the start of the day a week out, in Amsterdam', () => {
    // Saturday 12 September, 00:00 summer time.
    expect(momentOver(NOW, 7).toISOString()).toBe('2026-09-11T22:00:00.000Z');
    expect(momentOver(NOW, 0)).toBe(NOW);
  });
});

describe('countMastered', () => {
  it('counts only box five, which is what the stamp asks for', () => {
    const states = new Map([
      ['a', state('a', 5, 1)],
      ['b', state('b', 4, 1)],
      ['c', state('c', 5, 1)],
    ]);
    expect(countMastered(states, ['a', 'b', 'c', 'd'])).toBe(2);
  });
});
