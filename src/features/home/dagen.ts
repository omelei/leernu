import { beginVanDag, dagenTussen, dagSleutel, TIJDZONE } from '@/game-core';
import { t } from '@/i18n';

/**
 * Days in words, the way the front door says them (S2): "Dinsdag 15 september
 * · zes dagen op rij", "Gisteren geoefend", "Vier dagen niet geoefend".
 *
 * Every day here is a calendar day in Europe/Amsterdam — the same days a review
 * falls on and a streak counts (ADR-106).
 */

const TELWOORDEN = [
  'nul',
  'één',
  'twee',
  'drie',
  'vier',
  'vijf',
  'zes',
  'zeven',
  'acht',
  'negen',
  'tien',
  'elf',
  'twaalf',
  'dertien',
  'veertien',
  'vijftien',
  'zestien',
  'zeventien',
  'achttien',
  'negentien',
  'twintig',
] as const;

/** A small number as a word, as S2 writes it; from 21 up, the figure. */
export function telwoord(n: number): string {
  const heel = Math.max(0, Math.floor(n));
  return TELWOORDEN[heel] ?? String(heel);
}

/** A sentence starts with a capital, including one that starts with a number. */
export function metHoofdletter(tekst: string): string {
  return tekst.charAt(0).toLocaleUpperCase('nl-NL') + tekst.slice(1);
}

const DATUM = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "dinsdag 15 september", for a moment or for a day key. */
export function datumLang(dag: Date | string): string {
  const moment = typeof dag === 'string' ? new Date(beginVanDag(dag).getTime() + 12 * 3_600_000) : dag;
  return DATUM.format(moment);
}

/**
 * The meta line under "Vandaag": the date, and how many days in a row. A child
 * with no streak yet is on their first day, which is what S2's empty state
 * says.
 */
export function vandaagMeta(nu: Date, dagenOpRij: number): string {
  const reeks =
    dagenOpRij <= 0
      ? t('vandaag.streakEerste')
      : dagenOpRij === 1
        ? t('vandaag.streakEen')
        : t('vandaag.streakVeel', { aantal: telwoord(dagenOpRij) });
  return t('vandaag.meta', { datum: metHoofdletter(datumLang(nu)), streak: reeks });
}

/**
 * When a set was last practised, as the line on its card: "Vandaag geoefend",
 * "Gisteren geoefend", "Vier dagen niet geoefend", or "Nog niet geoefend".
 */
export function geoefendTekst(laatste: string | null, nu: Date): string {
  if (laatste === null) return t('vandaag.statusNooit');
  const dagen = dagenTussen(dagSleutel(new Date(laatste)), dagSleutel(nu));
  if (dagen <= 0) return t('vandaag.statusVandaag');
  if (dagen === 1) return t('vandaag.statusGisteren');
  return metHoofdletter(t('vandaag.statusDagen', { aantal: telwoord(dagen) }));
}

/** "nog acht dagen" until a test, or "vandaag" on the day itself. */
export function nogTot(datum: string, nu: Date): string {
  const dagen = dagenTussen(dagSleutel(nu), datum);
  if (dagen <= 0) return t('vandaag.toetsVandaag');
  if (dagen === 1) return t('vandaag.nogDag');
  return t('vandaag.nogDagen', { aantal: telwoord(dagen) });
}
