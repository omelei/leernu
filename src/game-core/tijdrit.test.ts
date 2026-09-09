import { describe, expect, it } from 'vitest';
import {
  baanVan,
  isNieuwRecord,
  secondenInBeeld,
  STRAFSECONDEN,
  teltAlsRit,
  tijdInBeeld,
  tijdritTijd,
} from './tijdrit';

/**
 * The tijdrit's arithmetic, which is the whole of it: everything else about
 * this way of practising is the pointing round it borrows.
 *
 * The cases worth pinning are the ones where a plausible simplification would
 * be wrong — a penalty that punished twice, a record set by a round nobody
 * finished, a time rounded until two attempts read the same.
 */
describe('the time a tijdrit took', () => {
  it('adds five seconds for every answer that was not right', () => {
    expect(tijdritTijd(20_000, 0).totaalMs).toBe(20_000);
    expect(tijdritTijd(20_000, 1).totaalMs).toBe(20_000 + STRAFSECONDEN * 1000);
    expect(tijdritTijd(20_000, 3).strafMs).toBe(3 * STRAFSECONDEN * 1000);
  });

  it('keeps the answering and the penalty apart', () => {
    // The screen says both, and it has to be able to: "twenty seconds, and ten
    // of them were mistakes" is a different sentence from "thirty seconds".
    const rit = tijdritTijd(20_000, 2);
    expect(rit.antwoordMs).toBe(20_000);
    expect(rit.strafMs).toBe(10_000);
    expect(rit.totaalMs).toBe(30_000);
  });

  it('never reports a negative time or a negative count', () => {
    // performance.now() differences are not supposed to go backwards. Screens
    // that print what they are handed should not depend on that.
    expect(tijdritTijd(-5, -2).totaalMs).toBe(0);
  });
});

describe('what counts as a record', () => {
  it('is one track per set and per round length', () => {
    // Twenty seconds over ten questions and twenty over a hundred are not the
    // same achievement (ADR-074 lets a child choose the length).
    expect(baanVan('nl-provincies', 12)).toBe('nl-provincies:12');
    expect(baanVan('nl-steden', 10)).not.toBe(baanVan('nl-steden', 25));
  });

  it('needs a round that was ridden to the end', () => {
    expect(teltAlsRit(15, 15)).toBe(true);
    expect(teltAlsRit(3, 15)).toBe(false);
    // A round that asked nothing is not a fast round.
    expect(teltAlsRit(0, 0)).toBe(false);
  });

  it('is only ever beaten by a faster time', () => {
    expect(isNieuwRecord(19_000, 20_000)).toBe(true);
    expect(isNieuwRecord(21_000, 20_000)).toBe(false);
    // Equalling it is not beating it: the number on the page does not change,
    // and a child told "nieuw record" by an identical time would be right to
    // stop believing the next one.
    expect(isNieuwRecord(20_000, 20_000)).toBe(false);
    expect(isNieuwRecord(20_000, null)).toBe(true);
  });
});

describe('a time on the screen', () => {
  it('reads as a stopwatch, to a tenth', () => {
    expect(tijdInBeeld(0)).toBe('0:00,0');
    expect(tijdInBeeld(2_400)).toBe('0:02,4');
    expect(tijdInBeeld(72_400)).toBe('1:12,4');
    expect(tijdInBeeld(600_000)).toBe('10:00,0');
  });

  it('keeps the tenth that tells two attempts apart', () => {
    // The one thing this way of practising exists to show: a round that was
    // half a second faster must not read as the same round.
    expect(tijdInBeeld(20_000)).not.toBe(tijdInBeeld(20_500));
  });

  it('writes one answer as seconds, the Dutch way', () => {
    expect(secondenInBeeld(2_400)).toBe('2,4');
    expect(secondenInBeeld(12_040)).toBe('12,0');
  });
});
