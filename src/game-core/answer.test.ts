import { describe, expect, it } from 'vitest';
import { editDistance, findNearMisses, judgeAnswer, normaliseAnswer } from './answer';
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

const EDE = item('Ede');
const EPE = item('Epe');
const HOORN = item('Hoorn');
const DOORN = item('Doorn');
const UTRECHT = item('Utrecht');
const DEN_BOSCH = item("'s-Hertogenbosch", ['Den Bosch']);

/** The region set. Judging always happens against the whole set (ADR-017). */
const NEDERLAND = [EDE, EPE, HOORN, DOORN, UTRECHT, DEN_BOSCH];

describe('normaliseAnswer', () => {
  it('ignores case', () => {
    expect(normaliseAnswer('UTRECHT')).toBe('utrecht');
  });

  it('strips accents', () => {
    expect(normaliseAnswer('Curaçao')).toBe('curacao');
  });

  it('treats hyphens and apostrophes as spaces', () => {
    expect(normaliseAnswer("'s-Hertogenbosch")).toBe('s hertogenbosch');
  });

  it('collapses repeated whitespace', () => {
    expect(normaliseAnswer('  Den   Haag ')).toBe('den haag');
  });

  it('drops a leading article', () => {
    expect(normaliseAnswer('De Veluwe')).toBe('veluwe');
    expect(normaliseAnswer('Het IJsselmeer')).toBe('ijsselmeer');
  });
});

describe('editDistance', () => {
  it('is zero for identical strings', () => {
    expect(editDistance('ede', 'ede')).toBe(0);
  });

  it('counts a substitution, an insertion and a deletion as one each', () => {
    expect(editDistance('ede', 'epe')).toBe(1);
    expect(editDistance('assen', 'asen')).toBe(1);
    expect(editDistance('breda', 'bredaa')).toBe(1);
  });

  // The reason this is Damerau and not plain Levenshtein: a swapped pair is the
  // typo a ten-year-old actually makes, and plain Levenshtein charges two for it.
  it('counts an adjacent swap as one edit', () => {
    expect(editDistance('utrehct', 'utrecht')).toBe(1);
    expect(editDistance('breda', 'breda')).toBe(0);
  });

  it('gives up early past the ceiling instead of computing the exact distance', () => {
    expect(editDistance('amsterdam', 'rotterdam', 1)).toBeGreaterThan(1);
  });
});

describe('judgeAnswer — the answers that are right', () => {
  it('accepts the exact name', () => {
    expect(judgeAnswer('Utrecht', UTRECHT, NEDERLAND)).toEqual({
      kind: 'correct',
      exact: true,
      matched: 'Utrecht',
    });
  });

  it('accepts an alias', () => {
    const verdict = judgeAnswer('Den Bosch', DEN_BOSCH, NEDERLAND);
    expect(verdict).toEqual({ kind: 'correct', exact: true, matched: 'Den Bosch' });
  });

  it('accepts an unambiguous typo, and says the tolerance was needed', () => {
    const verdict = judgeAnswer('Utrech', UTRECHT, NEDERLAND);
    expect(verdict.kind).toBe('correct');
    if (verdict.kind === 'correct') expect(verdict.exact).toBe(false);
  });

  it('accepts a swapped pair of letters', () => {
    expect(judgeAnswer('Utrehct', UTRECHT, NEDERLAND).kind).toBe('correct');
  });

  it('still accepts a typo of a name that has a close neighbour, when it is not ambiguous', () => {
    // "Eda" is one edit from Ede and two from Epe, so nothing is in doubt.
    expect(judgeAnswer('Eda', EDE, NEDERLAND).kind).toBe('correct');
  });
});

describe('judgeAnswer — the answers that must never be called right', () => {
  // This is the decision of 2026-09-05 and the whole reason ADR-017 exists.
  it('refuses Epe for Ede, and names what the child wrote', () => {
    const verdict = judgeAnswer('Epe', EDE, NEDERLAND);
    expect(verdict.kind).toBe('near-miss');
    if (verdict.kind === 'near-miss') expect(verdict.confusedWith.naam).toBe('Epe');
  });

  it('refuses Doorn for Hoorn', () => {
    const verdict = judgeAnswer('Doorn', HOORN, NEDERLAND);
    expect(verdict.kind).toBe('near-miss');
    if (verdict.kind === 'near-miss') expect(verdict.confusedWith.naam).toBe('Doorn');
  });

  it('refuses a typo that is equally close to two different places', () => {
    // "Ee" is one insertion away from both Ede and Epe. Guessing would be worse
    // than admitting the answer is ambiguous.
    expect(judgeAnswer('Ee', EDE, NEDERLAND).kind).toBe('near-miss');
  });

  it('rejects an empty answer', () => {
    expect(judgeAnswer('   ', UTRECHT, NEDERLAND)).toEqual({ kind: 'wrong' });
  });

  it('rejects a genuinely different answer as plain wrong, not a near miss', () => {
    expect(judgeAnswer('Groningen', UTRECHT, NEDERLAND)).toEqual({ kind: 'wrong' });
  });
});

describe('judgeAnswer — the residual risk, stated rather than hidden', () => {
  /**
   * The guard only knows about places we teach. If Epe is not in the content at
   * all, nothing in the system knows it is a real town, and it is accepted as a
   * typo of Ede. ADR-017 records this, and the escape hatch — a per-item list of
   * spellings never to accept — is content, not code. Pinned here so that if the
   * behaviour ever changes, it changes deliberately.
   */
  it('accepts a real place we do not teach as a typo of one we do', () => {
    const setWithoutEpe = [EDE, UTRECHT];
    expect(judgeAnswer('Epe', EDE, setWithoutEpe).kind).toBe('correct');
  });
});

describe('findNearMisses', () => {
  it('finds the pairs the guard is protecting', () => {
    const misses = findNearMisses([EDE, EPE, UTRECHT]);
    expect(misses).toEqual([{ a: 'Ede', b: 'Epe', distance: 1 }]);
  });

  it('finds nothing in a set with distinct names', () => {
    expect(findNearMisses([UTRECHT, item('Groningen'), item('Maastricht')])).toEqual([]);
  });
});
