import { describe, expect, it } from 'vitest';
import { PUNT_MATEN, puntProcent, puntVulling, ruitStanden, tellerTekst } from './meten';

describe('de punt', () => {
  it('is drawn at the seven sizes of the README and no others', () => {
    expect([...PUNT_MATEN]).toEqual([18, 22, 28, 32, 40, 44, 56]);
  });

  it('fills as a conic gradient from the accent to the empty track', () => {
    expect(puntVulling(75)).toBe(
      'conic-gradient(var(--accent) 0 75%, var(--rail-empty) 75% 100%)',
    );
  });

  it('never fills past its own ring, and never below empty', () => {
    expect(puntProcent(102)).toBe(100);
    expect(puntProcent(-4)).toBe(0);
    expect(puntProcent(Number.NaN)).toBe(0);
    expect(puntProcent(74.6)).toBe(75);
  });
});

describe('de teller', () => {
  it('writes the question with a leading zero, so 7 to 8 moves nothing', () => {
    expect(tellerTekst(7, 12)).toBe('07 / 12');
    expect(tellerTekst(10, 12)).toBe('10 / 12');
  });

  it('pads to the width of the total', () => {
    expect(tellerTekst(7, 100)).toBe('007 / 100');
    expect(tellerTekst(1, 5)).toBe('01 / 05');
  });
});

describe('de ruiten', () => {
  it('fill for every question answered, whatever the answer was', () => {
    expect(ruitStanden(3, 5)).toEqual(['gedaan', 'gedaan', 'gedaan', 'open', 'open']);
  });

  it('never count more than there are', () => {
    expect(ruitStanden(9, 4)).toEqual(['gedaan', 'gedaan', 'gedaan', 'gedaan']);
    expect(ruitStanden(0, 0)).toEqual([]);
  });
});
