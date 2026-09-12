/**
 * Calendar days in Europe/Amsterdam (ADR-106).
 *
 * A child lives in days, not in elapsed hours, and so does everything in the
 * learning core that talks about a day: when an item comes round again, which
 * day a streak counted, which week a rest day was earned in. Those all used to
 * ask the device for its own time zone, or add multiples of twenty-four hours.
 * The first made the answer depend on where the device thought it was; the
 * second moved a review by an hour every time the clocks changed, and put an
 * item practised at seven in the evening out of reach until seven the next.
 *
 * So a day is a key, `YYYY-MM-DD`, in one fixed zone: the one the product's
 * schools are in. Keys compare as strings and are added to with plain calendar
 * arithmetic, and the only place a key meets a moment in time is here, through
 * `Intl`, which a server has as well as a browser (ADR-015).
 *
 * Summer time begins and ends at 01:00 UTC, so midnight in Amsterdam is never
 * skipped and never happens twice: every key has exactly one start.
 */

export const TIJDZONE = 'Europe/Amsterdam';

const DAG_MS = 86_400_000;

const FORMAAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIJDZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface Delen {
  readonly jaar: number;
  readonly maand: number;
  readonly dag: number;
  readonly uur: number;
  readonly minuut: number;
  readonly seconde: number;
}

/** The wall clock in Amsterdam at this moment. */
function delen(moment: Date): Delen {
  const uit = new Map<string, number>();
  for (const deel of FORMAAT.formatToParts(moment)) {
    if (deel.type !== 'literal') uit.set(deel.type, Number(deel.value));
  }
  return {
    jaar: uit.get('year') ?? 1970,
    maand: uit.get('month') ?? 1,
    dag: uit.get('day') ?? 1,
    // Some engines still write midnight as 24 despite h23; it is the same hour.
    uur: (uit.get('hour') ?? 0) % 24,
    minuut: uit.get('minute') ?? 0,
    seconde: uit.get('second') ?? 0,
  };
}

function tweeCijfers(n: number): string {
  return String(n).padStart(2, '0');
}

function sleutelVan(jaar: number, maand: number, dag: number): string {
  return `${String(jaar).padStart(4, '0')}-${tweeCijfers(maand)}-${tweeCijfers(dag)}`;
}

function ontleed(sleutel: string): readonly [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sleutel);
  if (!match) throw new Error(`Not a day key: ${sleutel}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** The calendar day in Amsterdam on which this moment falls. */
export function dagSleutel(moment: Date): string {
  const d = delen(moment);
  return sleutelVan(d.jaar, d.maand, d.dag);
}

/** How many minutes Amsterdam is ahead of UTC at this moment: 60 or 120. */
export function verschilMetUtc(moment: Date): number {
  const d = delen(moment);
  const alsUtc = Date.UTC(d.jaar, d.maand - 1, d.dag, d.uur, d.minuut, d.seconde);
  const opDeSeconde = Math.floor(moment.getTime() / 1000) * 1000;
  return Math.round((alsUtc - opDeSeconde) / 60_000);
}

/**
 * The first moment of a day in Amsterdam: 00:00 there, 22:00 or 23:00 UTC the
 * evening before. The offset is read twice because the one at UTC midnight can
 * belong to the other side of a change; the second reading is always the one
 * in force at the answer.
 */
export function beginVanDag(sleutel: string): Date {
  const [jaar, maand, dag] = ontleed(sleutel);
  const middernachtUtc = Date.UTC(jaar, maand - 1, dag);
  let schatting = middernachtUtc - verschilMetUtc(new Date(middernachtUtc)) * 60_000;
  schatting = middernachtUtc - verschilMetUtc(new Date(schatting)) * 60_000;
  return new Date(schatting);
}

/** The day `dagen` calendar days after this one (or before, if negative). */
export function plusDagen(sleutel: string, dagen: number): string {
  const [jaar, maand, dag] = ontleed(sleutel);
  const d = new Date(Date.UTC(jaar, maand - 1, dag + dagen));
  return sleutelVan(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Whole calendar days from one day to another; negative when `tot` is earlier. */
export function dagenTussen(van: string, tot: string): number {
  const [j1, m1, d1] = ontleed(van);
  const [j2, m2, d2] = ontleed(tot);
  return Math.round((Date.UTC(j2, m2 - 1, d2) - Date.UTC(j1, m1 - 1, d1)) / DAG_MS);
}

/** The day of the week, Sunday 0 to Saturday 6, of a calendar day. */
export function weekdag(sleutel: string): number {
  const [jaar, maand, dag] = ontleed(sleutel);
  return new Date(Date.UTC(jaar, maand - 1, dag)).getUTCDay();
}

/** The ISO week a day belongs to, `YYYY-Www`: Monday to Sunday, the year of its Thursday. */
export function isoWeek(sleutel: string): string {
  const [jaar, maand, dag] = ontleed(sleutel);
  const d = new Date(Date.UTC(jaar, maand - 1, dag));
  const vanafMaandag = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - vanafMaandag + 3);
  const donderdag = d.getUTCFullYear();
  const eersteDonderdag = new Date(Date.UTC(donderdag, 0, 4));
  eersteDonderdag.setUTCDate(
    eersteDonderdag.getUTCDate() - ((eersteDonderdag.getUTCDay() + 6) % 7) + 3,
  );
  const week = 1 + Math.round((d.getTime() - eersteDonderdag.getTime()) / (7 * DAG_MS));
  return `${donderdag}-W${tweeCijfers(week)}`;
}
