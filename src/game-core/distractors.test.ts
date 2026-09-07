import { describe, expect, it } from 'vitest';
import { buildOptions, DISTRACTOR_COUNT, pickDistractors } from './distractors';

/**
 * A fixed sequence instead of Math.random, so a failure names a bug rather than
 * a bad afternoon. The values cycle, which is enough for a shuffle and keeps
 * the test readable.
 */
function fakeRng(...values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[i % values.length] as number;
    i++;
    return value;
  };
}

const NEIGHBOURS = ['drenthe', 'fryslan', 'overijssel', 'flevoland', 'gelderland', 'utrecht'];
const POOL = ['zeeland', 'limburg', 'noord-brabant'];

const input = {
  answerId: 'groningen',
  neighbours: NEIGHBOURS,
  pool: POOL,
};

describe('picking distractors', () => {
  it('offers three of them', () => {
    expect(pickDistractors({ ...input, rng: fakeRng(0.5) })).toHaveLength(DISTRACTOR_COUNT);
  });

  it('always offers the nearest neighbour', () => {
    // The strongest confusion is the one the child has to resolve, so it is on
    // offer every time rather than three times in five.
    for (const seed of [0, 0.25, 0.5, 0.75, 0.99]) {
      expect(pickDistractors({ ...input, rng: fakeRng(seed) })).toContain('drenthe');
    }
  });

  it('varies the other two, so the same item asked twice is not the same question', () => {
    const first = pickDistractors({ ...input, rng: fakeRng(0.1, 0.9, 0.4) });
    const second = pickDistractors({ ...input, rng: fakeRng(0.8, 0.2, 0.6) });
    expect(first).not.toEqual(second);
  });

  it('never offers the answer as a wrong answer', () => {
    const shadowed = { ...input, neighbours: ['groningen', ...NEIGHBOURS], rng: fakeRng(0.5) };
    expect(pickDistractors(shadowed)).not.toContain('groningen');
  });

  it('never offers the same wrong answer twice', () => {
    const picked = pickDistractors({ ...input, rng: fakeRng(0.3, 0.7) });
    expect(new Set(picked).size).toBe(picked.length);
  });

  it('reaches into the set when a small set has too few neighbours', () => {
    // Two islands cannot make a four-option question on their own. Reaching
    // wider is worse teaching than a border would be, and better than a
    // question with three options.
    const thin = {
      answerId: 'texel',
      neighbours: ['vlieland'],
      pool: ['terschelling', 'ameland', 'schiermonnikoog'],
      rng: fakeRng(0.5),
    };

    const picked = pickDistractors(thin);
    expect(picked).toHaveLength(DISTRACTOR_COUNT);
    expect(picked[0]).toBe('vlieland');
    expect(picked).not.toContain('texel');
  });

  it('gives back what it can when even the set is too small', () => {
    // Not a case any built set reaches, but returning three ids by inventing
    // one would be worse than returning two.
    const tiny = { answerId: 'a', neighbours: ['b'], pool: ['b'], rng: fakeRng(0.5) };
    expect(pickDistractors(tiny)).toEqual(['b']);
  });
});

describe('building the four options', () => {
  it('includes the answer and three others', () => {
    const options = buildOptions({ ...input, rng: fakeRng(0.5) });
    expect(options).toHaveLength(DISTRACTOR_COUNT + 1);
    expect(options).toContain('groningen');
    expect(new Set(options).size).toBe(options.length);
  });

  it('does not always put the answer in the same place', () => {
    // A position a child can predict is a question they can answer without
    // reading it.
    const places = new Set<number>();
    for (const seed of [0.05, 0.3, 0.55, 0.8, 0.95]) {
      places.add(buildOptions({ ...input, rng: fakeRng(seed) }).indexOf('groningen'));
    }
    expect(places.size).toBeGreaterThan(1);
  });
});
