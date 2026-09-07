/**
 * The day streak, and the rules that stop it from being a punishment.
 *
 * Spec §4.3 asks for a streak "met opzet ontworpen om níét te straffen", which
 * is harder than it sounds: the whole force of a streak comes from not wanting
 * to lose it, and every softening trades some of that away. Three rules do the
 * work here, and each buys back more than it costs.
 *
 * **A weekend or a holiday can never break it.** School holidays are not days a
 * child failed to practise; they are days nobody asked them to. A streak that
 * makes a ten-year-old feel guilty on Boxing Day is a complaint from a parent
 * waiting to happen, and it is also simply wrong about what it is measuring.
 *
 * **But practising on those days still counts.** The asymmetry is deliberate:
 * doing the work is always rewarded, not doing it is only ever counted on a
 * school day. Pausing both ways would punish a child for practising on Sunday
 * by making it worth nothing.
 *
 * **A missed school day spends a rest day rather than resetting.** One is earned
 * for every week in which the child practised, two can be saved. One illness,
 * one school trip, one bad week does not erase two months of work.
 *
 * All dates here are calendar days in local time, formatted as YYYY-MM-DD. A
 * streak is about days a child lived through, not about hours elapsed, and
 * timestamps invite a bug where practising at 23:59 and again at 00:01 counts
 * as two days — which it is, and as one day, which it feels like.
 */

export interface HolidayPeriod {
  readonly naam: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly start: string;
  /** Inclusive, YYYY-MM-DD. */
  readonly eind: string;
}

export interface StreakState {
  readonly huidigeStreak: number;
  readonly langsteStreak: number;
  /** YYYY-MM-DD of the last day a round was finished, or null. */
  readonly laatsteActieveDag: string | null;
  readonly rustdagen: number;
  /** ISO week key (YYYY-Www) in which the last rest day was earned. */
  readonly rustdagWeek: string | null;
}

export const MAX_RUSTDAGEN = 2;

export function emptyStreak(): StreakState {
  return {
    huidigeStreak: 0,
    langsteStreak: 0,
    laatsteActieveDag: null,
    rustdagen: 0,
    rustdagWeek: null,
  };
}

/** YYYY-MM-DD in local time. Not toISOString, which is UTC and shifts the day. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDay(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** ISO week key, YYYY-Www — the unit a rest day is earned in. */
export function weekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // ISO weeks run Monday to Sunday and belong to the year of their Thursday.
  const dayOfWeek = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayOfWeek + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDayOfWeek = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayOfWeek + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isHoliday(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  const key = dayKey(date);
  return holidays.some((period) => key >= period.start && key <= period.eind);
}

/** A day the child was expected to practise: not a weekend, not a holiday. */
export function isSchoolDay(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * School days strictly between two dates — the days that were missed.
 *
 * Exclusive at both ends on purpose: the day last practised was not missed, and
 * the day being counted is being practised right now.
 */
export function missedSchoolDays(
  from: string,
  to: string,
  holidays: readonly HolidayPeriod[],
): number {
  let missed = 0;
  const cursor = parseDay(from);
  const end = parseDay(to);

  cursor.setDate(cursor.getDate() + 1);
  // A guard rather than a while(true): a corrupt date should not hang the app,
  // and nobody's streak spans two years of daily practice yet.
  for (let guard = 0; cursor < end && guard < 3650; guard++) {
    if (isSchoolDay(cursor, holidays)) missed++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return missed;
}

export interface StreakChange {
  readonly state: StreakState;
  /** True when this round was the first of a new day. */
  readonly counted: boolean;
  /** Rest days spent to bridge missed school days. */
  readonly rustdagenGebruikt: number;
  /** True when the streak restarted because there were not enough rest days. */
  readonly broken: boolean;
  /** True when this round earned a rest day. */
  readonly rustdagVerdiend: boolean;
}

/**
 * Applies one finished round.
 *
 * Idempotent within a day: a child who does four rounds on Tuesday has a streak
 * of one, not four. The number counts days, and saying so plainly is the only
 * way a child can predict it.
 */
export function recordActivity(
  state: StreakState,
  on: Date,
  holidays: readonly HolidayPeriod[] = [],
): StreakChange {
  const today = dayKey(on);

  if (state.laatsteActieveDag === today) {
    return { state, counted: false, rustdagenGebruikt: 0, broken: false, rustdagVerdiend: false };
  }

  let streak: number;
  let rustdagen = state.rustdagen;
  let rustdagenGebruikt = 0;
  let broken = false;

  if (state.laatsteActieveDag === null) {
    streak = 1;
  } else {
    const missed = missedSchoolDays(state.laatsteActieveDag, today, holidays);
    if (missed === 0) {
      streak = state.huidigeStreak + 1;
    } else if (missed <= rustdagen) {
      rustdagen -= missed;
      rustdagenGebruikt = missed;
      streak = state.huidigeStreak + 1;
    } else {
      streak = 1;
      broken = true;
    }
  }

  // One rest day per week in which the child practised, up to two saved. Earned
  // after the streak is settled, so a rest day earned today cannot also have
  // rescued today.
  const thisWeek = weekKey(on);
  let rustdagVerdiend = false;
  if (state.rustdagWeek !== thisWeek && rustdagen < MAX_RUSTDAGEN) {
    rustdagen += 1;
    rustdagVerdiend = true;
  }

  return {
    state: {
      huidigeStreak: streak,
      langsteStreak: Math.max(state.langsteStreak, streak),
      laatsteActieveDag: today,
      rustdagen,
      rustdagWeek: state.rustdagWeek === thisWeek ? state.rustdagWeek : thisWeek,
    },
    counted: true,
    rustdagenGebruikt,
    broken,
    rustdagVerdiend,
  };
}

/**
 * What the streak is worth right now, without recording anything.
 *
 * A streak shown as a number the child has already lost is worse than no
 * streak: they open the app, see 12, practise, and watch it become 1. This
 * reports what a round today would actually be joining.
 */
export function currentStreak(
  state: StreakState,
  now: Date,
  holidays: readonly HolidayPeriod[] = [],
): number {
  if (state.laatsteActieveDag === null) return 0;

  const today = dayKey(now);
  if (state.laatsteActieveDag === today) return state.huidigeStreak;

  const missed = missedSchoolDays(state.laatsteActieveDag, today, holidays);
  return missed <= state.rustdagen ? state.huidigeStreak : 0;
}
