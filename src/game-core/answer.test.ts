import { describe, expect, it } from 'vitest';
import { findNearMisses, levenshtein, matchAnswer, normaliseAnswer } from './answer';
import type { Item } from './types';

function item(naam: string, aliassen: string[] = []): Item {
  return {
    id: naam.toLowerCase(),
    type: 'stad',
    naam,
    aliassen,
    regioSet: 'nederland',
    niveau: 1,
    leerdoelen: [],
  };
}

describe('normaliseAnswer', () => {
  it('ignores case', () => {
    expect(normaliseAnswer('UTRECHT')).toBe('utrecht');
  });

  it('strips accents', () => {
    expect(normaliseAnswer('Curaçao')).toBe('curacao');
    expect(normaliseAnswer('Terschelling')).toBe('terschelling');
  });

  it('treats hyphens and apostrophes as spaces', () => {
    expect(normaliseAnswer("'s-Hertogenbosch")).toBe('s hertogenbosch');
    expect(normaliseAnswer('Berg en Dal')).toBe('berg en dal');
  });

  it('collapses repeated whitespace', () => {
    expect(normaliseAnswer('  Den   Haag ')).toBe('den haag');
  });

  it('drops a leading article', () => {
    expect(normaliseAnswer('De Veluwe')).toBe('veluwe');
    expect(normaliseAnswer('Het IJsselmeer')).toBe('ijsselmeer');
  });
});

describe('levenshtein', () => {
  it('is zero for identical strings', () => {
    expect(levenshtein('ede', 'ede')).toBe(0);
  });

  it('counts a substitution, an insertion and a deletion as one each', () => {
    expect(levenshtein('ede', 'epe')).toBe(1);
    expect(levenshtein('assen', 'asen')).toBe(1);
    expect(levenshtein('breda', 'bredaa')).toBe(1);
  });

  it('gives up early past the ceiling instead of computing the exact distance', () => {
    // Only the "greater than max" answer is contractual, not the value.
    expect(levenshtein('amsterdam', 'rotterdam', 1)).toBeGreaterThan(1);
  });
});

describe('matchAnswer', () => {
  it('accepts the exact name', () => {
    expect(matchAnswer('Utrecht', item('Utrecht'))).toEqual({
      correct: true,
      exact: true,
      matched: 'Utrecht',
    });
  });

  it('accepts an alias', () => {
    const result = matchAnswer('Den Bosch', item("'s-Hertogenbosch", ['Den Bosch']));
    expect(result.correct).toBe(true);
    expect(result.matched).toBe('Den Bosch');
  });

  it('accepts one typo, and says it was not exact', () => {
    const result = matchAnswer('Utrech', item('Utrecht'));
    expect(result.correct).toBe(true);
    expect(result.exact).toBe(false);
  });

  /**
   * Worth knowing rather than discovering: plain Levenshtein counts a swapped
   * pair of letters as two edits, so the tolerance in spec section 4.1 does not
   * cover it — and transposition is one of the most common typing mistakes a
   * ten-year-old makes. Accepting it would need Damerau-Levenshtein, which also
   * widens the Ede/Epe problem in ADR-006, so it is a decision and not a fix.
   */
  it('does not accept two swapped letters, which is two edits and not one', () => {
    expect(matchAnswer('Utrehct', item('Utrecht')).correct).toBe(false);
  });

  it('rejects an empty answer', () => {
    expect(matchAnswer('   ', item('Utrecht')).correct).toBe(false);
  });

  it('rejects a genuinely different answer', () => {
    expect(matchAnswer('Groningen', item('Utrecht')).correct).toBe(false);
  });

  // This is the known cost of ADR-006, pinned as a test rather than left as a
  // comment. If the tolerance is ever changed, this test fails and points at the
  // decision record instead of at a mystery.
  it('accepts a different real place one edit away, as specified in ADR-006', () => {
    expect(matchAnswer('Epe', item('Ede')).correct).toBe(true);
    expect(matchAnswer('Doorn', item('Hoorn')).correct).toBe(true);
  });
});

describe('findNearMisses', () => {
  it('finds the colliding pairs in a set', () => {
    const misses = findNearMisses([item('Ede'), item('Epe'), item('Amsterdam')]);

    expect(misses).toHaveLength(1);
    expect(misses[0]).toEqual({ a: 'Ede', b: 'Epe', distance: 1 });
  });

  it('finds nothing in a set with distinct names', () => {
    expect(findNearMisses([item('Utrecht'), item('Groningen'), item('Maastricht')])).toEqual([]);
  });
});
