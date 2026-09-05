import { describe, expect, it } from 'vitest';
import { findNearMisses } from '@/game-core';
import { loadAllItems, loadItemSets } from './loadSets';

/**
 * The content gate. This is what `npm run validate:content` runs, and it is in
 * CI because a broken geometry reference must never reach a classroom — the
 * failure mode is a child looking at a blank map during a lesson, which is the
 * one bug that costs a school's trust outright.
 *
 * There are no sets yet, so most of this passes vacuously today. It is written
 * now rather than with the first set, because a validator added afterwards gets
 * shaped around whatever the content already does, mistakes included.
 */

const sets = loadItemSets();
const items = loadAllItems();

describe('content sets', () => {
  it('loads without throwing', () => {
    expect(Array.isArray(sets)).toBe(true);
  });

  it('has a unique id for every item, across all sets', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const set of sets) {
      for (const item of set.items) {
        const previous = seen.get(item.id);
        if (previous !== undefined) {
          duplicates.push(`${item.id} appears in ${previous} and ${set.id}`);
        }
        seen.set(item.id, set.id);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it('gives every item a name and a level', () => {
    const broken = items
      .filter((item) => item.naam.trim() === '' || ![1, 2, 3].includes(item.niveau))
      .map((item) => item.id);

    expect(broken).toEqual([]);
  });

  it('tags every item with at least one learning goal', () => {
    const untagged = items.filter((item) => item.leerdoelen.length === 0).map((item) => item.id);

    expect(untagged).toEqual([]);
  });

  it('keeps pre-projected points inside the 0-1000 view box', () => {
    const outside = items
      .filter((item) => {
        if (item.punt === undefined) return false;
        const [x, y] = item.punt;
        return x < 0 || x > 1000 || y < 0 || y > 1000;
      })
      .map((item) => item.id);

    expect(outside).toEqual([]);
  });
});

describe('typo tolerance collisions', () => {
  /**
   * ADR-006 keeps the flat Levenshtein tolerance of one, which means a child can
   * type Epe for Ede and be told they are right. This test does not fail on a
   * collision — that decision has been taken — it prints them, so the size of
   * the problem is a number somebody can look at rather than an argument.
   */
  it('reports name pairs that are one edit apart', () => {
    for (const set of sets) {
      const misses = findNearMisses(set.items);
      if (misses.length > 0) {
        const pairs = misses.map((m) => `${m.a} / ${m.b}`).join(', ');
        console.warn(`[content] ${set.id}: ${misses.length} pair(s) within one edit — ${pairs}`);
      }
    }

    expect(true).toBe(true);
  });
});
