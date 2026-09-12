import { describe, expect, it } from 'vitest';
import { dotGeometry } from './dotGeometry';

/** The fill the first logo stood at, and the one the numbers below were read at. */
const FILL = 0.62;

/**
 * The dot, pinned.
 *
 * Every number in the first block was read out of the first logo's SVGs — the
 * logo was this dot until ADR-108 — not derived from the formula being tested,
 * which is the only way this test says anything. The logo has a shape of its
 * own now. The dot kept its geometry as the product's measure of progress, and
 * these numbers are what keep it from changing without anyone noticing.
 *
 * One thing the artefacts settled that the prose got wrong, worth a record here
 * because the prose is what someone will read next: §A says the negative ring
 * is 10% heavier, without saying where. The negative wordmark and the paper
 * merkteken both did it, to four decimals.
 */
describe('the dot keeps the geometry it was drawn with', () => {
  it('96px, ink', () => {
    const g = dotGeometry(96, FILL);
    expect(g.ring).toBeCloseTo(8, 3);
    expect(g.radius).toBeCloseTo(44, 3);
    expect(g.innerRadius).toBeCloseTo(40, 3);
    expect(g.fillTop).toBeCloseTo(38.4, 3);
    expect(g.fillHeight).toBeCloseTo(49.6, 3);
  });

  it('41px, ink', () => {
    const g = dotGeometry(41, FILL);
    expect(g.ring).toBeCloseTo(3.417, 3);
    expect(g.radius).toBeCloseTo(18.792, 3);
    expect(g.innerRadius).toBeCloseTo(17.083, 3);
    expect(g.fillHeight).toBeCloseTo(21.183, 3);
  });

  it('96px, paper on ink', () => {
    const g = dotGeometry(96, FILL, true);
    expect(g.ring).toBeCloseTo(8.8, 3);
    expect(g.radius).toBeCloseTo(43.6, 3);
    expect(g.innerRadius).toBeCloseTo(39.2, 3);
    expect(g.fillTop).toBeCloseTo(38.592, 3);
    expect(g.fillHeight).toBeCloseTo(48.608, 3);
  });

  it('41px, paper on ink — the same dot, 10% heavier ring', () => {
    const g = dotGeometry(41, FILL, true);
    expect(g.ring).toBeCloseTo(3.758, 3);
    expect(g.radius).toBeCloseTo(18.621, 3);
    expect(g.innerRadius).toBeCloseTo(16.742, 3);
    expect(g.fillHeight).toBeCloseTo(20.76, 3);
  });

  it('keeps the outer diameter when the ring gets heavier', () => {
    const positive = dotGeometry(41, FILL);
    const negative = dotGeometry(41, FILL, true);
    expect(2 * positive.radius + positive.ring).toBeCloseTo(41, 6);
    expect(2 * negative.radius + negative.ring).toBeCloseTo(41, 6);
  });

  it('512px', () => {
    const g = dotGeometry(512, FILL);
    expect(g.ring).toBeCloseTo(42.667, 3);
    expect(g.radius).toBeCloseTo(234.667, 3);
    expect(g.innerRadius).toBeCloseTo(213.333, 3);
    expect(g.fillHeight).toBeCloseTo(264.533, 3);
  });

  it('442px', () => {
    const g = dotGeometry(442, FILL);
    expect(g.ring).toBeCloseTo(36.833, 3);
    expect(g.radius).toBeCloseTo(202.583, 3);
    expect(g.innerRadius).toBeCloseTo(184.167, 3);
    expect(g.fillHeight).toBeCloseTo(228.367, 3);
  });

  it('17px', () => {
    const g = dotGeometry(17, FILL);
    expect(g.ring).toBeCloseTo(1.417, 3);
    expect(g.radius).toBeCloseTo(7.792, 3);
    expect(g.innerRadius).toBeCloseTo(7.083, 3);
    expect(g.fillHeight).toBeCloseTo(8.783, 3);
  });
});

describe('the rules that are not about one file', () => {
  it('keeps the ring at one twelfth at every size', () => {
    for (const size of [16, 20, 24, 41, 96, 512, 1024]) {
      expect(dotGeometry(size, 1).ring).toBeCloseTo(size / 12, 6);
    }
  });

  it('clamps a fill that arrives out of range', () => {
    const full = dotGeometry(96, 1);
    expect(dotGeometry(96, 1.02).fillHeight).toBe(full.fillHeight);
    expect(dotGeometry(96, -0.5).fillHeight).toBe(0);
  });

  it('empties and fills from the bottom, never from the middle', () => {
    const empty = dotGeometry(96, 0);
    const half = dotGeometry(96, 0.5);
    const full = dotGeometry(96, 1);

    // An empty dot's fill starts where a full one's ends: at the bottom.
    expect(empty.fillTop).toBeCloseTo(full.fillTop + full.fillHeight, 6);
    expect(half.fillHeight).toBeCloseTo(full.fillHeight / 2, 6);
    // And every fill reaches the same floor.
    for (const g of [empty, half, full]) {
      expect(g.fillTop + g.fillHeight).toBeCloseTo(48 + g.innerRadius, 6);
    }
  });
});
