import { describe, expect, it } from 'vitest';
import { dagenGeoefend, dagenInMaand, kalenderWeken, laatsteZevenDagen } from './oefendagen';

/** A local moment on a given day. 7 Sept 2026 is a Monday, 12–13 Sept a weekend. */
const op = (key: string, uur = 12) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, uur);
};

/** The moment a round ended, the way the store writes it. */
const rond = (key: string, uur = 15) => op(key, uur).toISOString();

describe('dagenGeoefend', () => {
  it('counts a day once, however many rounds were in it', () => {
    const dagen = dagenGeoefend([rond('2026-09-08', 9), rond('2026-09-08', 16), rond('2026-09-10')]);
    expect([...dagen].sort()).toEqual(['2026-09-08', '2026-09-10']);
  });

  it('reads the day where the child is, not in UTC', () => {
    // A round at 23:59 is written as UTC, which east of Greenwich is tomorrow.
    // It still belongs to the evening it was played in.
    const laat = new Date(2026, 8, 7, 23, 59).toISOString();
    expect([...dagenGeoefend([laat])]).toEqual(['2026-09-07']);
  });
});

describe('laatsteZevenDagen', () => {
  it('ends today and starts six days before it', () => {
    // Tuesday 15 September: the row reads wo do vr za zo ma di.
    const rij = laatsteZevenDagen(new Set(), op('2026-09-15'));
    expect(rij.map((dag) => dag.dag)).toEqual([
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
    ]);
    expect(rij.map((dag) => dag.weekdag)).toEqual([3, 4, 5, 6, 0, 1, 2]);
  });

  it('marks today, and nothing as still to come', () => {
    const rij = laatsteZevenDagen(new Set(), op('2026-09-15'));
    const vandaag = rij.filter((dag) => dag.vandaag).map((dag) => dag.dag);
    expect(vandaag).toEqual(['2026-09-15']);
    expect(rij.some((dag) => dag.later)).toBe(false);
  });

  it('marks the days a round was finished, and only those in the week', () => {
    const geoefend = new Set(['2026-09-01', '2026-09-10', '2026-09-14']);
    const rij = laatsteZevenDagen(geoefend, op('2026-09-15'));
    const wel = rij.filter((dag) => dag.geoefend).map((dag) => dag.dag);
    expect(wel).toEqual(['2026-09-10', '2026-09-14']);
  });

  it('runs back into the month before', () => {
    const rij = laatsteZevenDagen(new Set(), op('2026-10-02'));
    expect(rij[0]?.dag).toBe('2026-09-26');
    expect(rij[6]?.dag).toBe('2026-10-02');
  });
});

describe('kalenderWeken', () => {
  it('draws whole weeks from Monday, with this week last', () => {
    const weken = kalenderWeken(new Set(), op('2026-09-15'), 2);
    expect(weken).toHaveLength(2);
    expect(weken[0]?.[0]?.dag).toBe('2026-09-07');
    expect(weken[1]?.[6]?.dag).toBe('2026-09-20');
    expect(weken.flat().map((dag) => dag.weekdag)).toEqual([
      1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0,
    ]);
  });

  it('knows which days of this week are still to come', () => {
    const weken = kalenderWeken(new Set(), op('2026-09-15'), 2);
    const later = weken
      .flat()
      .filter((dag) => dag.later)
      .map((dag) => dag.dag);
    expect(later).toEqual(['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20']);
  });

  it('puts a Sunday at the end of its own week', () => {
    // getDay says 0 for Sunday. Counted naively, Sunday would open the next
    // week and the calendar would draw a week that has not started.
    const weken = kalenderWeken(new Set(), op('2026-09-13'), 1);
    expect(weken[0]?.[0]?.dag).toBe('2026-09-07');
    expect(weken[0]?.[6]?.vandaag).toBe(true);
  });
});

describe('dagenInMaand', () => {
  it('counts the days of this month only', () => {
    const geoefend = new Set(['2026-08-31', '2026-09-01', '2026-09-14']);
    expect(dagenInMaand(geoefend, op('2026-09-15'))).toBe(2);
  });
});
