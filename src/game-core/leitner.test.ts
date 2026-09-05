import { describe, expect, it } from 'vitest';
import {
  INTERVAL_DAYS,
  composeRound,
  emptyState,
  isDue,
  isStale,
  masteryPercent,
  nextBox,
  reinsertAfterMistake,
  review,
  scheduleFrom,
} from './leitner';
import type { Item, ItemState, LeitnerBox } from './types';

const NOW = new Date('2026-09-05T10:00:00.000Z');
const DAY = 86_400_000;

function item(id: string): Item {
  return {
    id,
    type: 'provincie',
    naam: id,
    aliassen: [],
    regioSet: 'nederland',
    niveau: 1,
    leerdoelen: [],
  };
}

/** A state that is due, `daysOverdue` days ago. */
function dueState(id: string, box: LeitnerBox, daysOverdue: number): ItemState {
  return {
    itemId: id,
    box,
    laatsteReview: new Date(NOW.getTime() - daysOverdue * DAY).toISOString(),
    volgendeReview: new Date(NOW.getTime() - daysOverdue * DAY).toISOString(),
    goedCount: 1,
    foutCount: 0,
  };
}

function knownState(id: string): ItemState {
  return {
    itemId: id,
    box: 5,
    laatsteReview: NOW.toISOString(),
    volgendeReview: new Date(NOW.getTime() + 21 * DAY).toISOString(),
    goedCount: 5,
    foutCount: 0,
  };
}

describe('nextBox', () => {
  it('moves up one box on a correct answer', () => {
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(4, true)).toBe(5);
  });

  it('stops at box five', () => {
    expect(nextBox(5, true)).toBe(5);
  });

  it('drops straight back to box one on a wrong answer, from any box', () => {
    for (const box of [1, 2, 3, 4, 5] as LeitnerBox[]) {
      expect(nextBox(box, false)).toBe(1);
    }
  });
});

describe('scheduleFrom', () => {
  it('uses the intervals from the spec', () => {
    expect(INTERVAL_DAYS).toEqual({ 1: 1, 2: 2, 3: 4, 4: 8, 5: 21 });
  });

  it('schedules the interval for the box it is given', () => {
    expect(scheduleFrom(3, NOW).getTime()).toBe(NOW.getTime() + 4 * DAY);
  });
});

describe('review', () => {
  it('promotes, counts and reschedules on a correct answer', () => {
    const before = emptyState('nl-gelderland');
    const after = review(before, true, NOW);

    expect(after.box).toBe(2);
    expect(after.goedCount).toBe(1);
    expect(after.foutCount).toBe(0);
    expect(after.volgendeReview).toBe(new Date(NOW.getTime() + 2 * DAY).toISOString());
  });

  it('demotes to box one and reschedules for tomorrow on a wrong answer', () => {
    const before: ItemState = { ...emptyState('nl-drenthe'), box: 4, goedCount: 3 };
    const after = review(before, false, NOW);

    expect(after.box).toBe(1);
    expect(after.foutCount).toBe(1);
    expect(after.volgendeReview).toBe(new Date(NOW.getTime() + 1 * DAY).toISOString());
  });

  it('does not mutate the state it is given', () => {
    const before = emptyState('nl-flevoland');
    review(before, true, NOW);
    expect(before.box).toBe(1);
    expect(before.goedCount).toBe(0);
  });
});

describe('isDue', () => {
  it('treats a never-reviewed item as due', () => {
    expect(isDue(emptyState('x'), NOW)).toBe(true);
  });

  it('is due exactly at the scheduled moment', () => {
    const state: ItemState = { ...emptyState('x'), volgendeReview: NOW.toISOString() };
    expect(isDue(state, NOW)).toBe(true);
  });

  it('is not due before then', () => {
    expect(isDue(knownState('x'), NOW)).toBe(false);
  });
});

describe('masteryPercent', () => {
  it('reads straight off the box, so it can be explained', () => {
    expect(masteryPercent(undefined)).toBe(0);
    expect(masteryPercent({ ...emptyState('x'), box: 1 })).toBe(0);
    expect(masteryPercent({ ...emptyState('x'), box: 3 })).toBe(50);
    expect(masteryPercent({ ...emptyState('x'), box: 5 })).toBe(100);
  });
});

describe('isStale', () => {
  it('is false while merely due', () => {
    expect(isStale(dueState('x', 2, 1), NOW)).toBe(false);
  });

  it('is true once overdue by more than the interval again', () => {
    // Box 2 has a 2-day interval, so 3 days overdue is stale.
    expect(isStale(dueState('x', 2, 3), NOW)).toBe(true);
  });
});

describe('composeRound', () => {
  const rng = () => 0.5; // deterministic, so the mix is what is under test

  it('returns nothing for an empty catalogue', () => {
    expect(composeRound({ items: [], states: new Map(), size: 10, now: NOW, rng })).toEqual([]);
  });

  it('mixes roughly 70 percent due, 20 percent new and 10 percent known', () => {
    const due = Array.from({ length: 10 }, (_, i) => item(`due-${i}`));
    const nieuw = Array.from({ length: 10 }, (_, i) => item(`new-${i}`));
    const bekend = Array.from({ length: 10 }, (_, i) => item(`known-${i}`));

    const states = new Map<string, ItemState>();
    due.forEach((it, i) => states.set(it.id, dueState(it.id, 2, i + 1)));
    bekend.forEach((it) => states.set(it.id, knownState(it.id)));

    const round = composeRound({
      items: [...due, ...nieuw, ...bekend],
      states,
      size: 10,
      now: NOW,
      rng,
    });

    expect(round).toHaveLength(10);
    expect(round.filter((i) => i.id.startsWith('due-'))).toHaveLength(7);
    expect(round.filter((i) => i.id.startsWith('new-'))).toHaveLength(2);
    expect(round.filter((i) => i.id.startsWith('known-'))).toHaveLength(1);
  });

  it('fills a full round even when one pool is empty', () => {
    // A child who has seen everything has no new items left. The round should
    // still be full rather than short.
    const due = Array.from({ length: 20 }, (_, i) => item(`due-${i}`));
    const states = new Map<string, ItemState>();
    due.forEach((it, i) => states.set(it.id, dueState(it.id, 2, i + 1)));

    const round = composeRound({ items: due, states, size: 10, now: NOW, rng });

    expect(round).toHaveLength(10);
  });

  it('never repeats an item within one round', () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`i-${i}`));
    const round = composeRound({ items, states: new Map(), size: 10, now: NOW, rng });

    expect(new Set(round.map((i) => i.id)).size).toBe(round.length);
  });

  it('cannot return more items than exist', () => {
    const items = [item('a'), item('b')];
    const round = composeRound({ items, states: new Map(), size: 10, now: NOW, rng });

    expect(round).toHaveLength(2);
  });

  it('prefers the most overdue work when the backlog is larger than the round', () => {
    const items = Array.from({ length: 20 }, (_, i) => item(`due-${i}`));
    const states = new Map<string, ItemState>();
    // due-0 is 20 days overdue, due-19 is 1 day overdue.
    items.forEach((it, i) => states.set(it.id, dueState(it.id, 2, 20 - i)));

    const round = composeRound({ items, states, size: 10, now: NOW, rng });
    const ids = round.map((i) => i.id);

    expect(ids).toContain('due-0');
    expect(ids).not.toContain('due-19');
  });
});

describe('reinsertAfterMistake', () => {
  it('puts the item back three questions later', () => {
    const queue = ['b', 'c', 'd', 'e', 'f'];
    expect(reinsertAfterMistake(queue, 'a', 0)).toEqual(['b', 'c', 'd', 'a', 'e', 'f']);
  });

  it('puts it last rather than dropping it near the end of a round', () => {
    const queue = ['b', 'c'];
    expect(reinsertAfterMistake(queue, 'a', 0)).toEqual(['b', 'c', 'a']);
  });
});
