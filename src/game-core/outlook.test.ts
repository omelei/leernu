import { describe, expect, it } from 'vitest';
import { testOutlook } from './outlook';
import { setRetention } from './retention';
import type { ItemState, LeitnerBox } from './types';

const NOW = new Date(2026, 8, 8, 10, 0, 0);
const DAY = 86_400_000;

function day(n: number): Date {
  return new Date(NOW.getTime() + n * DAY);
}

function state(id: string, box: LeitnerBox, reviewedDaysAgo: number): ItemState {
  const reviewed = new Date(NOW.getTime() - reviewedDaysAgo * DAY);
  return {
    itemId: id,
    box,
    laatsteReview: reviewed.toISOString(),
    volgendeReview: new Date(reviewed.getTime() + DAY).toISOString(),
    goedCount: 1,
    foutCount: 0,
  };
}

const IDS = ['a', 'b', 'c', 'd'];

/**
 * The forecast a test date is worth.
 *
 * What is checked here is that it is a forecast and not a slogan: that doing
 * nothing and doing the work give different answers, that the optimistic one is
 * bounded by what a round can actually ask, and that it never claims anything
 * about a day that has already been.
 */
describe('the outlook on a test day', () => {
  it('says nothing has been practised when nothing has', () => {
    const outlook = testOutlook({
      states: new Map(),
      itemIds: IDS,
      now: NOW,
      testDay: day(14),
      perDay: 10,
    });

    expect(outlook.started).toBe(false);
    // Never answered is never known: `itemRetention` returns 0 for it, and a
    // hopeful guess there would make the whole figure a lie.
    expect(outlook.asIs).toBe(0);
  });

  it('is worth more with practice than without', () => {
    const states = new Map(IDS.map((id) => [id, state(id, 2, 3)]));

    const outlook = testOutlook({
      states,
      itemIds: IDS,
      now: NOW,
      testDay: day(14),
      perDay: 10,
    });

    expect(outlook.started).toBe(true);
    expect(outlook.practised).toBeGreaterThan(outlook.asIs);
    // A forecast, not a promise: nothing here may reach certainty.
    expect(outlook.practised).toBeLessThanOrEqual(100);
  });

  it('is capped by what one round can ask', () => {
    const many = Array.from({ length: 40 }, (_, n) => `item-${n}`);
    const states = new Map(many.map((id) => [id, state(id, 1, 2)]));
    const shared = { states, itemIds: many, now: NOW, testDay: day(6) } as const;

    const oneADay = testOutlook({ ...shared, perDay: 1 });
    const aWholeRound = testOutlook({ ...shared, perDay: 15 });

    // Forty items and six days: how many questions a round asks has to matter,
    // or the plan is promising an evening nobody has.
    expect(aWholeRound.practised).toBeGreaterThan(oneADay.practised);
  });

  it('promises nothing about a day that has already been', () => {
    const states = new Map(IDS.map((id) => [id, state(id, 3, 1)]));
    const shared = { states, itemIds: IDS, now: NOW, perDay: 10 } as const;

    for (const testDay of [day(0), day(-3)]) {
      const outlook = testOutlook({ ...shared, testDay });
      // Practice cannot reach backwards, so the two figures are one figure.
      expect(outlook.practised).toBe(outlook.asIs);
      expect(outlook.asIs).toBe(setRetention(states, IDS, testDay));
    }
  });

  it('leaves the states it was given alone', () => {
    const original = state('a', 2, 3);
    const states = new Map([['a', original]]);

    testOutlook({ states, itemIds: ['a'], now: NOW, testDay: day(10), perDay: 10 });

    // The simulation runs on a copy. A forecast that quietly rescheduled a
    // child's boxes would be a forecast that changed what it was forecasting.
    expect(states.get('a')).toBe(original);
    expect(original.box).toBe(2);
  });
});
