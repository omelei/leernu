import { dayKey } from './streak';

/**
 * The days a child practised, laid out as days (ADR-110).
 *
 * The streak keeps one number and the last day it moved, which is all it needs
 * to be fair and not enough to draw a week: "5 dagen op rij" says how many, and
 * a child also wants to see which. Those days are already written down — every
 * finished round carries the moment it ended — so they are read back from the
 * rounds rather than kept a second time on the streak's row, where two records
 * of the same fact could one day disagree.
 *
 * Days, not rounds: four rounds on a Tuesday are one Tuesday, for the reason
 * `recordActivity` is idempotent within a day. And the same calendar day as the
 * streak's own, local and YYYY-MM-DD, through the same `dayKey`, so a round at
 * 23:59 cannot be Monday here and Tuesday there.
 */

/** One calendar day, as the week row and the calendar draw it. */
export interface Oefendag {
  /** YYYY-MM-DD. */
  readonly dag: string;
  /** 0 is Sunday, as `Date.getDay` counts. */
  readonly weekdag: number;
  readonly dagVanDeMaand: number;
  /** A round was finished on it. */
  readonly geoefend: boolean;
  readonly vandaag: boolean;
  /** Still to come. A calendar shows a whole week, and today is not its end. */
  readonly later: boolean;
}

/** The days on which a round ended, from the moments the rounds ended. */
export function dagenGeoefend(momenten: readonly string[]): ReadonlySet<string> {
  return new Set(momenten.map((moment) => dayKey(new Date(moment))));
}

/** Midnight, `offset` days from `now`. Built from parts, so a month rolls over by itself. */
function dagVanaf(now: Date, offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

function oefendag(date: Date, geoefend: ReadonlySet<string>, vandaag: string): Oefendag {
  const dag = dayKey(date);
  return {
    dag,
    weekdag: date.getDay(),
    dagVanDeMaand: date.getDate(),
    geoefend: geoefend.has(dag),
    vandaag: dag === vandaag,
    later: dag > vandaag,
  };
}

/**
 * The last seven days, today last.
 *
 * A week that ends today rather than one that starts on Monday: on a Monday a
 * calendar week is one empty day, and the row is there to show what came
 * before today.
 */
export function laatsteZevenDagen(geoefend: ReadonlySet<string>, now: Date): Oefendag[] {
  const vandaag = dayKey(now);
  return Array.from({ length: 7 }, (_, index) =>
    oefendag(dagVanaf(now, index - 6), geoefend, vandaag),
  );
}

/**
 * Whole weeks, Monday to Sunday, the last of them this one.
 *
 * Monday first because that is how a Dutch school calendar is drawn, and the
 * ISO week a rest day is earned in (`weekKey`) starts there too.
 */
export function kalenderWeken(
  geoefend: ReadonlySet<string>,
  now: Date,
  weken: number,
): Oefendag[][] {
  const vandaag = dayKey(now);
  const naarMaandag = -((now.getDay() + 6) % 7);
  return Array.from({ length: weken }, (_, week) =>
    Array.from({ length: 7 }, (_, dag) =>
      oefendag(dagVanaf(now, naarMaandag - (weken - 1 - week) * 7 + dag), geoefend, vandaag),
    ),
  );
}

/** How many days of the month `now` is in had a round in them. */
export function dagenInMaand(geoefend: ReadonlySet<string>, now: Date): number {
  const maand = dayKey(now).slice(0, 7);
  return [...geoefend].filter((dag) => dag.startsWith(maand)).length;
}
