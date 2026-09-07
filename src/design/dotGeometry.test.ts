import { describe, expect, it } from 'vitest';
import { dotGeometry, WORDMARK_DOT_RATIO, WORDMARK_FILL } from './dotGeometry';

/**
 * The dot, checked against the files the designer delivered.
 *
 * Every number below was read out of docs/Logo/*.svg, not derived from the
 * formula being tested — which is the only way this test says anything. If the
 * component and the artefacts ever disagree, the logo has quietly changed, and
 * that is the sort of change nobody notices in a diff and everybody notices on
 * a home screen.
 *
 * Two things the artefacts settled that the prose got wrong, both worth keeping
 * a record of here because the prose is what someone will read next:
 *
 *   §A says the dot is 41% of the x-height. Every drawing puts it at 41% of the
 *   font size — 36 at 88, 26 at 64, 41 at 100.
 *
 *   §A says the negative ring is 10% heavier, without saying where. The negative
 *   wordmark and the paper merkteken both do it, to four decimals. The three app
 *   icons, also paper on ink, do not — which is a fault in those three files and
 *   not a rule, since the logo documentation states the correction for the paper
 *   merkteken outright.
 */
describe('the dot reproduces the delivered logo files', () => {
  it('leer-nu-merkteken-inkt.svg — 96px, ink', () => {
    const g = dotGeometry(96, WORDMARK_FILL);
    expect(g.ring).toBeCloseTo(8, 3);
    expect(g.radius).toBeCloseTo(44, 3);
    expect(g.innerRadius).toBeCloseTo(40, 3);
    expect(g.fillTop).toBeCloseTo(38.4, 3);
    expect(g.fillHeight).toBeCloseTo(49.6, 3);
  });

  it('leer-nu-woordbeeld-positief.svg — 41px dot in a 100px font', () => {
    const g = dotGeometry(41, WORDMARK_FILL);
    expect(g.ring).toBeCloseTo(3.417, 3);
    expect(g.radius).toBeCloseTo(18.792, 3);
    expect(g.innerRadius).toBeCloseTo(17.083, 3);
    expect(g.fillHeight).toBeCloseTo(21.183, 3);
  });

  it('leer-nu-merkteken-papier.svg — 96px, paper on ink', () => {
    const g = dotGeometry(96, WORDMARK_FILL, true);
    expect(g.ring).toBeCloseTo(8.8, 3);
    expect(g.radius).toBeCloseTo(43.6, 3);
    expect(g.innerRadius).toBeCloseTo(39.2, 3);
    expect(g.fillTop).toBeCloseTo(38.592, 3);
    expect(g.fillHeight).toBeCloseTo(48.608, 3);
  });

  it('leer-nu-woordbeeld-negatief.svg — the same dot, 10% heavier ring', () => {
    const g = dotGeometry(41, WORDMARK_FILL, true);
    expect(g.ring).toBeCloseTo(3.758, 3);
    expect(g.radius).toBeCloseTo(18.621, 3);
    expect(g.innerRadius).toBeCloseTo(16.742, 3);
    expect(g.fillHeight).toBeCloseTo(20.76, 3);
  });

  it('keeps the outer diameter when the ring gets heavier', () => {
    const positive = dotGeometry(41, WORDMARK_FILL);
    const negative = dotGeometry(41, WORDMARK_FILL, true);
    expect(2 * positive.radius + positive.ring).toBeCloseTo(41, 6);
    expect(2 * negative.radius + negative.ring).toBeCloseTo(41, 6);
  });

  it('leer-nu-app-ios-1024.svg — a 512px mark, and no negative correction', () => {
    const g = dotGeometry(512, WORDMARK_FILL);
    expect(g.ring).toBeCloseTo(42.667, 3);
    expect(g.radius).toBeCloseTo(234.667, 3);
    expect(g.innerRadius).toBeCloseTo(213.333, 3);
    expect(g.fillHeight).toBeCloseTo(264.533, 3);
  });

  it('leer-nu-app-android-voorgrond.svg — 442px, inside the 66/108 safe zone', () => {
    const g = dotGeometry(442, WORDMARK_FILL);
    expect(g.ring).toBeCloseTo(36.833, 3);
    expect(g.radius).toBeCloseTo(202.583, 3);
    expect(g.innerRadius).toBeCloseTo(184.167, 3);
    expect(g.fillHeight).toBeCloseTo(228.367, 3);

    // The mark's full width against the Android safe zone, 66 of 108.
    expect(2 * g.radius + g.ring).toBeLessThanOrEqual((66 / 108) * 1024);
  });

  it('leer-nu-favicon-32.svg — a 17px mark on the tile', () => {
    const g = dotGeometry(17, WORDMARK_FILL);
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

  it('puts the wordmark dot at 41% of the font size', () => {
    // 36 at 88, 26 at 64 and 41 at 100, all drawn in §A or its own header.
    expect(Math.round(88 * WORDMARK_DOT_RATIO)).toBe(36);
    expect(Math.round(64 * WORDMARK_DOT_RATIO)).toBe(26);
    expect(Math.round(100 * WORDMARK_DOT_RATIO)).toBe(41);
  });
});
