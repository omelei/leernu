import { describe, expect, it } from 'vitest';
import {
  beginVanDag,
  dagSleutel,
  dagenTussen,
  isoWeek,
  plusDagen,
  verschilMetUtc,
  weekdag,
} from './kalender';

/**
 * Days in Europe/Amsterdam, whatever zone the machine running this is in. CI
 * runs in UTC and the machine this was written on runs in Amsterdam, so every
 * moment here is written as an instant in UTC and every expectation as a day
 * or an instant — never as a local Date, which would make the test pass in one
 * of the two places and mean nothing in the other.
 */

describe('dagSleutel', () => {
  it('is the calendar day in Amsterdam, not in UTC', () => {
    // 22:30 UTC on 7 September is half past midnight on the 8th in summer time.
    expect(dagSleutel(new Date('2026-09-07T22:30:00Z'))).toBe('2026-09-08');
    expect(dagSleutel(new Date('2026-09-07T21:59:59Z'))).toBe('2026-09-07');
  });

  it('moves the boundary by an hour in winter', () => {
    expect(dagSleutel(new Date('2026-12-01T22:30:00Z'))).toBe('2026-12-01');
    expect(dagSleutel(new Date('2026-12-01T23:00:00Z'))).toBe('2026-12-02');
  });
});

describe('beginVanDag', () => {
  it('is 22:00 UTC the evening before in summer time', () => {
    expect(beginVanDag('2026-09-08').toISOString()).toBe('2026-09-07T22:00:00.000Z');
  });

  it('is 23:00 UTC the evening before in winter time', () => {
    expect(beginVanDag('2026-12-02').toISOString()).toBe('2026-12-01T23:00:00.000Z');
  });

  // Summer time begins on Sunday 29 March 2026 at 01:00 UTC (02:00 becomes
  // 03:00). Midnight that night is still winter time; the next is summer time.
  it('gets both midnights around the start of summer time right', () => {
    expect(beginVanDag('2026-03-29').toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(beginVanDag('2026-03-30').toISOString()).toBe('2026-03-29T22:00:00.000Z');
  });

  // It ends on Sunday 25 October 2026 at 01:00 UTC (03:00 becomes 02:00).
  it('gets both midnights around the end of summer time right', () => {
    expect(beginVanDag('2026-10-25').toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(beginVanDag('2026-10-26').toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('is the first moment of its own day and the day before ends just before it', () => {
    for (const sleutel of ['2026-03-29', '2026-03-30', '2026-10-25', '2026-10-26', '2027-01-01']) {
      const begin = beginVanDag(sleutel);
      expect(dagSleutel(begin)).toBe(sleutel);
      expect(dagSleutel(new Date(begin.getTime() - 1))).toBe(plusDagen(sleutel, -1));
    }
  });

  it('refuses something that is not a day', () => {
    expect(() => beginVanDag('7 september')).toThrow('Not a day key');
  });
});

describe('verschilMetUtc', () => {
  it('is an hour in winter and two in summer', () => {
    expect(verschilMetUtc(new Date('2026-01-15T12:00:00Z'))).toBe(60);
    expect(verschilMetUtc(new Date('2026-07-15T12:00:00Z'))).toBe(120);
  });
});

describe('plusDagen and dagenTussen', () => {
  it('counts calendar days across a month, a year and a clock change', () => {
    expect(plusDagen('2026-09-30', 1)).toBe('2026-10-01');
    expect(plusDagen('2026-12-31', 1)).toBe('2027-01-01');
    expect(plusDagen('2026-10-24', 2)).toBe('2026-10-26');
    expect(plusDagen('2026-03-01', -1)).toBe('2026-02-28');
    expect(dagenTussen('2026-10-24', '2026-10-26')).toBe(2);
    expect(dagenTussen('2026-03-28', '2026-03-30')).toBe(2);
    expect(dagenTussen('2026-09-08', '2026-09-07')).toBe(-1);
  });
});

describe('weekdag and isoWeek', () => {
  it('knows the day of the week of a calendar day', () => {
    // 7 September 2026 is a Monday; 12 and 13 are a weekend.
    expect(weekdag('2026-09-07')).toBe(1);
    expect(weekdag('2026-09-12')).toBe(6);
    expect(weekdag('2026-09-13')).toBe(0);
  });

  it('groups Monday to Sunday into one ISO week', () => {
    expect(isoWeek('2026-09-07')).toBe(isoWeek('2026-09-13'));
    expect(isoWeek('2026-09-13')).not.toBe(isoWeek('2026-09-14'));
    // 1 January 2027 is a Friday and belongs to the last week of 2026.
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
  });
});
