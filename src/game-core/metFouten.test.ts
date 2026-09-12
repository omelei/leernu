import { describe, expect, it } from 'vitest';
import { alleenDeze, emptyState, metFouten, type ItemState } from './index';

const staat = (itemId: string, foutCount: number): [string, ItemState] => [
  itemId,
  { ...emptyState(itemId), laatsteReview: '2026-09-01T00:00:00.000Z', foutCount },
];

describe('metFouten', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

  it('keeps only what was ever answered wrong, the most missed first', () => {
    const states = new Map([staat('a', 1), staat('b', 0), staat('c', 3)]);
    expect(metFouten(items, states).map((item) => item.id)).toEqual(['c', 'a']);
  });

  it('is empty for a child who has not got anything wrong', () => {
    expect(metFouten(items, new Map())).toEqual([]);
  });
});

describe('alleenDeze', () => {
  const eigen = [{ id: 'a' }, { id: 'b' }];
  const verder = [{ id: 'b' }, { id: 'x' }];

  it('asks exactly the ids given, in their order, from whichever list holds them', () => {
    expect(alleenDeze(['x', 'a'], eigen, verder).map((item) => item.id)).toEqual(['x', 'a']);
  });

  it('asks an item once, and drops an id no list holds', () => {
    expect(alleenDeze(['b', 'b', 'weg'], eigen, verder).map((item) => item.id)).toEqual(['b']);
  });
});
