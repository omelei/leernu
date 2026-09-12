import { describe, expect, it } from 'vitest';
import { emptyState, review } from './leitner';
import { antwoordToestanden, rondeUitslag } from './uitkomst';
import type { ItemState } from './types';

const NOW = new Date('2026-09-08T14:00:00.000Z');
const DAY = 86_400_000;

describe('antwoordToestanden', () => {
  it('marks only the right answer when it was given', () => {
    expect([...antwoordToestanden('fryslan', 'fryslan')]).toEqual([['fryslan', 'goed']]);
  });

  it('marks what was pointed at wrong and shows where the right one was', () => {
    const toestanden = antwoordToestanden('drenthe', 'fryslan');
    expect(toestanden.get('drenthe')).toBe('fout');
    expect(toestanden.get('fryslan')).toBe('gemist');
    expect(toestanden.size).toBe(2);
  });

  it('shows only the missed answer when none was given', () => {
    expect([...antwoordToestanden(null, 'fryslan')]).toEqual([['fryslan', 'gemist']]);
  });
});

describe('rondeUitslag', () => {
  const learnedAndDue: ItemState = {
    itemId: 'utrecht',
    box: 3,
    laatsteReview: new Date(NOW.getTime() - 5 * DAY).toISOString(),
    volgendeReview: new Date(NOW.getTime() - DAY).toISOString(),
    goedCount: 2,
    foutCount: 0,
  };
  const remembered: ItemState = {
    ...learnedAndDue,
    itemId: 'limburg',
    volgendeReview: new Date(NOW.getTime() + 3 * DAY).toISOString(),
  };

  it('sorts a round into new, refreshed and still changing', () => {
    const voor = new Map<string, ItemState>([
      ['utrecht', learnedAndDue],
      ['limburg', remembered],
    ]);
    const na = new Map<string, ItemState>([
      ['zeeland', review(emptyState('zeeland'), true, NOW)],
      ['utrecht', review(learnedAndDue, true, NOW)],
      ['fryslan', review(emptyState('fryslan'), false, NOW)],
      ['limburg', review(remembered, true, NOW)],
    ]);

    expect(rondeUitslag(voor, na, ['zeeland', 'utrecht', 'fryslan', 'limburg'], NOW)).toEqual({
      nieuwOnthouden: ['zeeland'],
      opgefrist: ['utrecht'],
      wisselen: ['fryslan'],
    });
  });

  it('counts an item asked twice once, in the row of how it ended', () => {
    // Wrong first, right three questions later: box one then box two, and
    // remembered — new, since it was not learned before.
    const eerst = review(emptyState('drenthe'), false, NOW);
    const daarna = review(eerst, true, NOW);
    const na = new Map([['drenthe', daarna]]);

    expect(rondeUitslag(new Map(), na, ['drenthe', 'drenthe'], NOW)).toEqual({
      nieuwOnthouden: ['drenthe'],
      opgefrist: [],
      wisselen: [],
    });
  });
});
