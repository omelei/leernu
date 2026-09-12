import { NextIcon } from '@/components/Icon';
import { laatsteZevenDagen } from '@/game-core';
import { ReeksGetal, WeekRij } from '@/features/reeks/WeekRij';
import { useReeks } from '@/features/reeks/useReeks';
import { t } from '@/i18n';
import { Blok } from './Blok';

/**
 * Days in a row, and the week behind the number (ADR-110).
 *
 * Between the tests and the progress card: it is the one block in the column
 * about turning up rather than about what was answered. The number is the app
 * bar's — the same `currentStreak`, read against today — and the row under it
 * is the seven days that made it, today last, so a child sees which days count
 * instead of taking the number on trust.
 *
 * It leads to the streak's own page, where the same days are a calendar and the
 * numbers behind them are written out.
 */
export function ReeksBlok({ onReeks }: { readonly onReeks: () => void }) {
  const reeks = useReeks();

  // Empty until it is known, for the reason the progress card gives.
  if (reeks === null) return <Blok titel={t('reeks.titel')} bezig />;

  return (
    <Blok titel={t('reeks.titel')}>
      <ReeksGetal dagen={reeks.dagen} />
      <WeekRij dagen={laatsteZevenDagen(reeks.geoefend, reeks.vandaag)} />
      <button type="button" className="tk-blok-knop" onClick={onReeks}>
        <NextIcon size={20} />
        {t('reeks.bekijk')}
      </button>
    </Blok>
  );
}
