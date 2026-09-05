import { describe, expect, it } from 'vitest';
import { countMastered, itemRetention, retentionAfterRound, setRetention } from './retention';
import type { ItemState, LeitnerBox } from './types';

const NOW = new Date('2026-09-05T10:00:00.000Z');
const DAY = 86_400_000;

function state(id: string, box: LeitnerBox, daysAgo: number): ItemState {
  return {
    itemId: id,
    box,
    laatsteReview: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
    volgendeReview: new Date(NOW.getTime() + DAY).toISOString(),
    goedCount: 1,
    foutCount: 0,
  };
}

/** Same, but overdue — so a round today would actually touch it. */
function dueState(id: string, box: LeitnerBox, daysAgo: number): ItemState {
  return {
    ...state(id, box, daysAgo),
    volgendeReview: new Date(NOW.getTime() - DAY).toISOString(),
  };
}

function days(n: number): Date {
  return new Date(NOW.getTime() + n * DAY);
}

describe('itemRetention', () => {
  it('is zero for something never answered', () => {
    expect(itemRetention(undefined, days(21))).toBe(0);
    expect(
      itemRetention({ ...state('x', 1, 0), laatsteReview: null }, days(21)),
    ).toBe(0);
  });

  it('is one at the moment of review', () => {
    expect(itemRetention(state('x', 3, 0), NOW)).toBe(1);
  });

  // The sentence the whole model has to survive being explained by: after one
  // box interval you still know about nine tenths of it.
  it('is nine tenths after exactly one interval', () => {
    // Box 3 has a four-day interval.
    expect(itemRetention(state('x', 3, 0), days(4))).toBeCloseTo(0.9, 6);
  });

  it('keeps falling at the same rate after that', () => {
    expect(itemRetention(state('x', 3, 0), days(8))).toBeCloseTo(0.81, 6);
  });

  it('holds up better from a higher box', () => {
    const low = itemRetention(state('x', 1, 0), days(21));
    const high = itemRetention(state('x', 5, 0), days(21));
    expect(high).toBeGreaterThan(low);
  });

  it('counts the time already elapsed since the last review', () => {
    // Reviewed four days ago, asked about four days ahead: eight days of decay.
    expect(itemRetention(state('x', 3, 4), days(4))).toBeCloseTo(0.81, 6);
  });
});

describe('setRetention', () => {
  it('is zero for an empty set', () => {
    expect(setRetention(new Map(), [], days(21))).toBe(0);
  });

  it('averages rather than multiplies', () => {
    // Two items, one perfectly known and one never seen. The answer a child
    // needs is "half of it", not "almost none of it".
    const states = new Map([['a', state('a', 5, 0)]]);
    expect(setRetention(states, ['a', 'b'], NOW)).toBe(50);
  });

  it('drops as the horizon moves out', () => {
    const states = new Map([['a', state('a', 2, 0)]]);
    const soon = setRetention(states, ['a'], days(2));
    const later = setRetention(states, ['a'], days(21));
    expect(later).toBeLessThan(soon);
  });
});

describe('retentionAfterRound', () => {
  it('beats doing nothing when there is work due', () => {
    const states = new Map([
      ['a', dueState('a', 1, 5)],
      ['b', dueState('b', 2, 5)],
    ]);
    const ids = ['a', 'b'];

    const nothing = setRetention(states, ids, days(21));
    const practised = retentionAfterRound(states, ids, days(21), NOW);

    expect(practised).toBeGreaterThan(nothing);
  });

  /**
   * When the scheduler says come back later, a round today changes nothing —
   * and the forecast says so rather than inventing a gain. The home screen
   * hides the "one round today" line in that case; a product that always claims
   * practising helps is a product whose numbers a teacher stops believing.
   */
  it('promises nothing when nothing is due', () => {
    const states = new Map([['a', state('a', 4, 0)]]);
    expect(retentionAfterRound(states, ['a'], days(21), NOW)).toBe(
      setRetention(states, ['a'], days(21)),
    );
  });

  it('leaves items that are not due alone', () => {
    const notDue: ItemState = {
      ...state('a', 4, 0),
      volgendeReview: new Date(NOW.getTime() + 8 * DAY).toISOString(),
    };
    const states = new Map([['a', notDue]]);

    expect(retentionAfterRound(states, ['a'], days(21), NOW)).toBe(
      setRetention(states, ['a'], days(21)),
    );
  });

  it('gives an unseen item the benefit of one correct answer', () => {
    expect(retentionAfterRound(new Map(), ['a'], days(1), NOW)).toBeGreaterThan(0);
  });
});

describe('countMastered', () => {
  it('counts only box five', () => {
    const states = new Map([
      ['a', state('a', 5, 0)],
      ['b', state('b', 4, 0)],
      ['c', state('c', 5, 0)],
    ]);
    expect(countMastered(states, ['a', 'b', 'c', 'd'])).toBe(2);
  });
});
