import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  dayKey,
  emptyStreak,
  isSchoolDay,
  missedSchoolDays,
  recordActivity,
  weekKey,
  type HolidayPeriod,
  type StreakState,
} from './streak';

/** All weekdays verified: 7 Sept 2026 is a Monday, 12–13 Sept a weekend. */
const day = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

const KERST: HolidayPeriod[] = [
  { naam: 'Kerstvakantie', start: '2026-12-19', eind: '2027-01-03' },
];

function after(state: StreakState, key: string, holidays: HolidayPeriod[] = []) {
  return recordActivity(state, day(key), holidays).state;
}

describe('dayKey', () => {
  it('uses the local calendar day, not UTC', () => {
    // Late in the evening in a positive offset, toISOString would say tomorrow.
    expect(dayKey(new Date(2026, 8, 7, 23, 30))).toBe('2026-09-07');
  });
});

describe('weekKey', () => {
  it('groups a week from Monday to Sunday', () => {
    expect(weekKey(day('2026-09-07'))).toBe(weekKey(day('2026-09-13')));
    expect(weekKey(day('2026-09-13'))).not.toBe(weekKey(day('2026-09-14')));
  });
});

describe('isSchoolDay', () => {
  it('is false at the weekend', () => {
    expect(isSchoolDay(day('2026-09-12'), [])).toBe(false);
    expect(isSchoolDay(day('2026-09-13'), [])).toBe(false);
  });

  it('is false during a holiday', () => {
    expect(isSchoolDay(day('2026-12-21'), KERST)).toBe(false);
  });

  it('is true on an ordinary weekday', () => {
    expect(isSchoolDay(day('2026-09-08'), KERST)).toBe(true);
  });
});

describe('missedSchoolDays', () => {
  it('is zero between consecutive days', () => {
    expect(missedSchoolDays('2026-09-07', '2026-09-08', [])).toBe(0);
  });

  it('is zero across a weekend', () => {
    // Friday to Monday: nothing was missed, because nothing was asked.
    expect(missedSchoolDays('2026-09-11', '2026-09-14', [])).toBe(0);
  });

  it('counts the school days actually skipped', () => {
    // Monday to Thursday: Tuesday and Wednesday.
    expect(missedSchoolDays('2026-09-07', '2026-09-10', [])).toBe(2);
  });

  it('counts nothing across a holiday', () => {
    expect(missedSchoolDays('2026-12-18', '2027-01-04', KERST)).toBe(0);
  });
});

describe('recordActivity', () => {
  it('starts at one', () => {
    const change = recordActivity(emptyStreak(), day('2026-09-07'));
    expect(change.state.huidigeStreak).toBe(1);
    expect(change.counted).toBe(true);
  });

  it('counts days, not rounds', () => {
    const first = after(emptyStreak(), '2026-09-07');
    const again = recordActivity(first, day('2026-09-07'));

    expect(again.counted).toBe(false);
    expect(again.state.huidigeStreak).toBe(1);
  });

  it('grows on consecutive school days', () => {
    let state = after(emptyStreak(), '2026-09-07');
    state = after(state, '2026-09-08');
    state = after(state, '2026-09-09');
    expect(state.huidigeStreak).toBe(3);
  });

  // The rule that matters most: a weekend is not a failure.
  it('survives a weekend without spending anything', () => {
    const friday = after(emptyStreak(), '2026-09-11');
    const change = recordActivity(friday, day('2026-09-14'));

    expect(change.state.huidigeStreak).toBe(2);
    expect(change.freezesUsed).toBe(0);
    expect(change.broken).toBe(false);
  });

  it('survives a two-week holiday without spending anything', () => {
    const before = after(emptyStreak(), '2026-12-18', KERST);
    const change = recordActivity(before, day('2027-01-04'), KERST);

    expect(change.state.huidigeStreak).toBe(2);
    expect(change.freezesUsed).toBe(0);
  });

  it('rewards practising during a holiday rather than ignoring it', () => {
    // The asymmetry: holidays never count against you, but they do count for
    // you. Pausing both ways would make Sunday's work worth nothing.
    const before = after(emptyStreak(), '2026-12-18', KERST);
    const change = recordActivity(before, day('2026-12-21'), KERST);

    expect(change.counted).toBe(true);
    expect(change.state.huidigeStreak).toBe(2);
  });

  it('spends a freeze for one missed school day', () => {
    let state = after(emptyStreak(), '2026-09-07');
    expect(state.vriezers).toBe(1); // earned in this week

    // Skips Tuesday, comes back Wednesday.
    const change = recordActivity(state, day('2026-09-09'));
    expect(change.freezesUsed).toBe(1);
    expect(change.state.huidigeStreak).toBe(2);
    expect(change.broken).toBe(false);
  });

  it('restarts when there are not enough freezes', () => {
    const state = after(emptyStreak(), '2026-09-07');
    // Four school days missed, at most two freezes ever.
    const change = recordActivity(state, day('2026-09-14'));

    expect(change.broken).toBe(true);
    expect(change.state.huidigeStreak).toBe(1);
  });

  it('earns one freeze per week and saves no more than two', () => {
    let state = after(emptyStreak(), '2026-09-07');
    expect(state.vriezers).toBe(1);

    // Same week: no second freeze.
    state = after(state, '2026-09-08');
    expect(state.vriezers).toBe(1);

    // Next week: a second.
    state = after(state, '2026-09-14');
    expect(state.vriezers).toBe(2);

    // The week after that: still two, because two is the ceiling.
    state = after(state, '2026-09-21');
    expect(state.vriezers).toBe(2);
  });

  it('remembers the longest run even after a break', () => {
    let state = after(emptyStreak(), '2026-09-07');
    state = after(state, '2026-09-08');
    state = after(state, '2026-09-09');
    expect(state.langsteStreak).toBe(3);

    const broken = recordActivity(state, day('2026-09-21')).state;
    expect(broken.huidigeStreak).toBe(1);
    expect(broken.langsteStreak).toBe(3);
  });
});

describe('currentStreak', () => {
  it('is zero before anything happens', () => {
    expect(currentStreak(emptyStreak(), day('2026-09-07'))).toBe(0);
  });

  it('still stands over a weekend', () => {
    const friday = after(emptyStreak(), '2026-09-11');
    expect(currentStreak(friday, day('2026-09-13'))).toBe(1);
  });

  /**
   * A streak shown as a number the child has already lost is worse than no
   * streak at all: they open the app on 12, practise, and watch it become 1.
   * This reports what a round today would actually be joining.
   */
  it('reports zero once the freezes can no longer cover the gap', () => {
    const state = after(emptyStreak(), '2026-09-07');
    expect(currentStreak(state, day('2026-09-09'))).toBe(1); // one freeze covers it
    expect(currentStreak(state, day('2026-09-14'))).toBe(0); // four days, one freeze
  });
});

describe('the holiday calendar', () => {
  const calendar = JSON.parse(
    readFileSync(join(process.cwd(), 'content', 'vakanties.json'), 'utf8'),
  ) as { vakanties: HolidayPeriod[]; bronUrl: string; geraadpleegd: string };

  it('records where it came from and when', () => {
    // Spec section 12: nothing goes in without a source and a date.
    expect(calendar.bronUrl).toContain('rijksoverheid.nl');
    expect(calendar.geraadpleegd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has periods that start before they end', () => {
    for (const period of calendar.vakanties) {
      expect(period.start <= period.eind, period.naam).toBe(true);
    }
  });

  /**
   * A holiday calendar expires quietly, and the failure lands a year later on a
   * child who loses a streak during a holiday nobody told the app about. This
   * fails while there is still time to extend it, which is the only moment
   * anyone would act.
   */
  it('has at least a hundred days left before it runs out', () => {
    const last = calendar.vakanties.map((period) => period.eind).sort().at(-1) ?? '';
    const daysLeft = Math.round(
      (new Date(last).getTime() - Date.now()) / 86_400_000,
    );

    expect(
      daysLeft,
      `content/vakanties.json ends on ${last}. Extend it from ${calendar.bronUrl}.`,
    ).toBeGreaterThan(100);
  });
});
