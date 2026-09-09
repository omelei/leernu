import { describe, expect, it } from 'vitest';
import {
  AT_LEVEL_ONE,
  COLLECTION_SIZE,
  earnedAt,
  huidigeReeks,
  inReeks,
  isEarned,
  levelForEarned,
  nextPlek,
  nieuwePlekken,
  PER_REEKS,
  plekOf,
  REEKSEN,
} from './collection';
import { correctForLevel, levelFor, stepToLevel } from './rewards';

/**
 * The collection is the product's one long promise, so the numbers in it are
 * worth pinning: how many there are, when each arrives, and that none of them
 * can be reached by anything other than answering questions correctly.
 */
describe('the collection', () => {
  it('starts a child with three, so that picking one is a choice', () => {
    expect(earnedAt(1)).toBe(AT_LEVEL_ONE);
    expect(AT_LEVEL_ONE).toBeGreaterThan(1);
  });

  it('hands out one per level, and never goes backwards', () => {
    let previous = 0;
    for (let level = 1; level <= 80; level++) {
      const now = earnedAt(level);
      expect(now, `level ${level}`).toBeGreaterThanOrEqual(previous);
      previous = now;
    }
  });

  it('fills a reeks of twelve before the next one starts', () => {
    // Three at level one, so the twelfth arrives at level ten and the silver
    // row opens at eleven. That is the pacing the whole ladder is built on.
    expect(earnedAt(10)).toBe(PER_REEKS);
    expect(huidigeReeks(9)).toBe('brons');
    expect(huidigeReeks(10)).toBe('zilver');
    expect(inReeks(10, 'brons')).toBe(PER_REEKS);
    expect(inReeks(10, 'zilver')).toBe(0);
    expect(inReeks(11, 'zilver')).toBe(1);
  });

  it('ends at sixty, and stays there', () => {
    expect(COLLECTION_SIZE).toBe(REEKSEN.length * PER_REEKS);
    expect(earnedAt(58)).toBe(COLLECTION_SIZE);
    expect(earnedAt(500)).toBe(COLLECTION_SIZE);
    expect(nextPlek(58)).toBeNull();
    expect(nextPlek(57)).not.toBeNull();
  });

  it('agrees with itself about where each animal sits', () => {
    for (let nth = 1; nth <= COLLECTION_SIZE; nth++) {
      const plek = plekOf(nth);
      const level = levelForEarned(nth);

      expect(isEarned(level, plek), `${nth} at level ${level}`).toBe(true);
      // And not one level earlier, except for the three that are there from
      // the start and have no earlier level to check.
      if (level > 1) expect(isEarned(level - 1, plek), `${nth} at level ${level - 1}`).toBe(false);
    }
  });

  /**
   * What a round handed over, which is the whole of what the result screen
   * needs to know. Almost always nothing; sometimes one; and more than one
   * where a long round crossed two levels at once.
   */
  it('names the animals that arrive between two levels', () => {
    expect(nieuwePlekken(1, 1)).toEqual([]);
    expect(nieuwePlekken(1, 2)).toEqual([{ reeks: 'brons', plek: 3 }]);
    expect(nieuwePlekken(1, 3)).toEqual([
      { reeks: 'brons', plek: 3 },
      { reeks: 'brons', plek: 4 },
    ]);

    // Across the seam between two reeksen: level 10 holds the twelfth bronze
    // animal, so level 11 is the first silver one.
    expect(nieuwePlekken(10, 11)).toEqual([{ reeks: 'zilver', plek: 0 }]);

    // And past the end, where there is nothing left to hand over.
    expect(nieuwePlekken(58, 60)).toEqual([]);
  });

  it('never says a place in a later reeks is held', () => {
    expect(isEarned(1, { reeks: 'goud', plek: 0 })).toBe(false);
    expect(isEarned(58, { reeks: 'ultra', plek: PER_REEKS - 1 })).toBe(true);
  });
});

/**
 * What the collection costs, in the only unit the product counts: questions
 * answered correctly. Written out because it is a promise to a child, and a
 * curve that quietly moved would move it.
 */
describe('what a level costs', () => {
  it('doubles three times and then settles', () => {
    expect([1, 2, 3, 4, 5, 6].map(stepToLevel)).toEqual([25, 50, 100, 200, 200, 200]);
  });

  it('puts the first reeks a few months out and the last one years', () => {
    // The numbers the owner agreed to, pinned. Level 10 completes the ink row.
    expect(correctForLevel(2)).toBe(25);
    expect(correctForLevel(3)).toBe(75);
    expect(correctForLevel(4)).toBe(175);
    expect(correctForLevel(10)).toBe(1375);
    expect(correctForLevel(58)).toBe(10975);
  });

  it('reads a level back from the answers that bought it', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(24)).toBe(1);
    expect(levelFor(25)).toBe(2);
    expect(levelFor(74)).toBe(2);
    expect(levelFor(75)).toBe(3);
    expect(levelFor(1375)).toBe(10);
  });
});
