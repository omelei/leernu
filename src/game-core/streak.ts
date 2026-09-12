import { dagSleutel, isoWeek, plusDagen, weekdag } from './kalender';

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
 * **The freezer is a rest day.** "Vriezer" is the handoff's word for what this
 * file calls a rest day. **Holiday mode** is the child's own holiday, switched
 * on and off on Jij: while it is on, no day is a school day, exactly as in a
 * school holiday, and practising still counts.
 *
 * All dates here are calendar days in Europe/Amsterdam, formatted as
 * YYYY-MM-DD (ADR-106) — the same days a review falls on, from the same place
 * (kalender.ts). A streak is about days a child lived through, not about hours
 * elapsed, and timestamps invite a bug where practising at 23:59 and again at
 * 00:01 counts as two days — which it is, and as one day, which it feels like.
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
  /**
   * The child's own holidays: every period holiday mode was on, the one still
   * on ending on OPEN_EIND. Absent on rows written before it existed, which
   * reads as none.
   */
  readonly eigenVakanties?: readonly HolidayPeriod[];
}

export const MAX_RUSTDAGEN = 2;

/** The end of a holiday that is still on. Later than any day there will be. */
export const OPEN_EIND = '9999-12-31';

export function emptyStreak(): StreakState {
  return {
    huidigeStreak: 0,
    langsteStreak: 0,
    laatsteActieveDag: null,
    rustdagen: 0,
    rustdagWeek: null,
  };
}

/** The calendar day in Amsterdam of a moment, YYYY-MM-DD. */
export function dayKey(date: Date): string {
  return dagSleutel(date);
}

/** ISO week key, YYYY-Www — the unit a rest day is earned in. */
export function weekKey(date: Date): string {
  return isoWeek(dagSleutel(date));
}

function isWeekendDag(key: string): boolean {
  const dag = weekdag(key);
  return dag === 0 || dag === 6;
}

function isVakantieDag(key: string, holidays: readonly HolidayPeriod[]): boolean {
  return holidays.some((period) => key >= period.start && key <= period.eind);
}

function isSchoolDag(key: string, holidays: readonly HolidayPeriod[]): boolean {
  return !isWeekendDag(key) && !isVakantieDag(key, holidays);
}

export function isWeekend(date: Date): boolean {
  return isWeekendDag(dagSleutel(date));
}

export function isHoliday(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  return isVakantieDag(dagSleutel(date), holidays);
}

/** A day the child was expected to practise: not a weekend, not a holiday. */
export function isSchoolDay(date: Date, holidays: readonly HolidayPeriod[]): boolean {
  return isSchoolDag(dagSleutel(date), holidays);
}

/**
 * School days strictly between two dates — the days that were missed.
 *
 * Exclusive at both ends on purpose: the day last practised was not missed, and
 * the day being counted is being practised right now. Walked on day keys, so
 * the answer is the same whatever zone the device is in.
 */
export function missedSchoolDays(
  from: string,
  to: string,
  holidays: readonly HolidayPeriod[],
): number {
  let missed = 0;
  let cursor = plusDagen(from, 1);
  // A guard rather than a while(true): a corrupt date should not hang the app,
  // and nobody's streak spans ten years of daily practice yet.
  for (let guard = 0; cursor < to && guard < 3650; guard++) {
    if (isSchoolDag(cursor, holidays)) missed++;
    cursor = plusDagen(cursor, 1);
  }

  return missed;
}

/** The school holidays and the child's own, together: every day nobody asked for. */
function vrijeDagen(
  state: StreakState,
  holidays: readonly HolidayPeriod[],
): readonly HolidayPeriod[] {
  return [...holidays, ...(state.eigenVakanties ?? [])];
}

/** Whether holiday mode is on. */
export function vakantieAan(state: StreakState): boolean {
  return (state.eigenVakanties ?? []).some((period) => period.eind === OPEN_EIND);
}

/**
 * Switches holiday mode on or off.
 *
 * On, from today: today is already a holiday, so a child who switches it on in
 * the morning and practises anyway still has that day counted for them. Off,
 * the holiday ends yesterday and today is an ordinary day again; switched off
 * on the day it was switched on, it leaves no holiday behind at all.
 */
export function zetVakantie(state: StreakState, aan: boolean, op: Date): StreakState {
  const vandaag = dagSleutel(op);
  const perioden = state.eigenVakanties ?? [];

  if (aan) {
    if (vakantieAan(state)) return state;
    return {
      ...state,
      eigenVakanties: [...perioden, { naam: 'vakantiemodus', start: vandaag, eind: OPEN_EIND }],
    };
  }

  if (!vakantieAan(state)) return state;
  const gisteren = plusDagen(vandaag, -1);
  const gesloten = perioden.flatMap((period) => {
    if (period.eind !== OPEN_EIND) return [period];
    return period.start > gisteren ? [] : [{ ...period, eind: gisteren }];
  });
  return { ...state, eigenVakanties: gesloten };
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
    const missed = missedSchoolDays(state.laatsteActieveDag, today, vrijeDagen(state, holidays));
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
      ...(state.eigenVakanties ? { eigenVakanties: state.eigenVakanties } : {}),
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

  const missed = missedSchoolDays(state.laatsteActieveDag, today, vrijeDagen(state, holidays));
  return missed <= state.rustdagen ? state.huidigeStreak : 0;
}

// ---------------------------------------------------------------------------

/**
 * The other streak: correct answers in a row, with no day in it.
 *
 * The day streak above measures turning up. This one measures getting it right,
 * and it is the only number in the product that a single wrong answer takes
 * away — which is exactly why it is not allowed to be the one a child is shown
 * first (ADR-072). It keeps its best alongside its current, and losing it costs
 * nothing else: no coins, no level, no stamp.
 *
 * It runs across rounds and across modules on purpose. "Twaalf goed op rij" is
 * a thing a child says about themselves, not about one round of one table, and
 * a counter that reset at the end of every round would be reporting the round.
 */
export interface FlawlessRun {
  /** How many correct answers in a row, right now. */
  readonly nu: number;
  /** The longest run there has ever been. Never goes down. */
  readonly beste: number;
}

export function emptyRun(): FlawlessRun {
  return { nu: 0, beste: 0 };
}

/**
 * One answer, counted.
 *
 * "Ik weet het niet" is a wrong answer here, the same as any other: the run is
 * about knowing, and ADR-048 makes not knowing cheap everywhere it costs
 * something real — a life, a box, a mark. A run is none of those.
 */
export function recordAnswerRun(run: FlawlessRun, correct: boolean): FlawlessRun {
  if (!correct) return { nu: 0, beste: run.beste };
  const nu = run.nu + 1;
  return { nu, beste: Math.max(nu, run.beste) };
}
