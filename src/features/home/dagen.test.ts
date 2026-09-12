import { describe, expect, it } from 'vitest';
import { datumLang, geoefendTekst, metHoofdletter, nogTot, telwoord, vandaagMeta } from './dagen';

/** Tuesday 15 September 2026, four in the afternoon in Amsterdam. */
const NU = new Date('2026-09-15T14:00:00Z');

describe('the days on the front door', () => {
  it('writes small numbers as words and large ones as figures', () => {
    expect(telwoord(6)).toBe('zes');
    expect(telwoord(1)).toBe('één');
    expect(telwoord(20)).toBe('twintig');
    expect(telwoord(21)).toBe('21');
  });

  it('writes the date the way S2 does, in Amsterdam', () => {
    expect(datumLang(NU)).toBe('dinsdag 15 september');
    expect(datumLang('2026-09-23')).toBe('woensdag 23 september');
    // Half past midnight on the 16th there is still the 15th in UTC.
    expect(datumLang(new Date('2026-09-15T22:30:00Z'))).toBe('woensdag 16 september');
  });

  it('opens the page with the date and the streak', () => {
    expect(vandaagMeta(NU, 6)).toBe('Dinsdag 15 september · zes dagen op rij');
    expect(vandaagMeta(NU, 0)).toBe('Dinsdag 15 september · eerste dag');
  });

  it('says when a set was last practised, in days', () => {
    expect(geoefendTekst(null, NU)).toBe('Nog niet geoefend');
    expect(geoefendTekst('2026-09-15T07:00:00Z', NU)).toBe('Vandaag geoefend');
    expect(geoefendTekst('2026-09-14T19:00:00Z', NU)).toBe('Gisteren geoefend');
    expect(geoefendTekst('2026-09-11T10:00:00Z', NU)).toBe('Vier dagen niet geoefend');
  });

  it('counts down to a test', () => {
    expect(nogTot('2026-09-23', NU)).toBe('nog acht dagen');
    expect(nogTot('2026-09-16', NU)).toBe('nog één dag');
    expect(nogTot('2026-09-15', NU)).toBe('vandaag');
  });

  it('capitalises a sentence that starts with a number', () => {
    expect(metHoofdletter('vier dagen')).toBe('Vier dagen');
  });
});
