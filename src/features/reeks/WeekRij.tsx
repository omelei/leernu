import { StreakIcon } from '@/components/Icon';
import type { Oefendag } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/** "wo", "do": the two letters over each bar. */
export function dagKort(weekdag: number): string {
  return t(`dag.kort.${weekdag}` as TranslationKey);
}

/** "woensdag": the day in full, for whoever hears it rather than reads it. */
export function dagLang(weekdag: number): string {
  return t(`dag.lang.${weekdag}` as TranslationKey);
}

/**
 * Days in a row, as one large number and the words after it.
 *
 * Nought is a sentence rather than a nought, as on the front door's cards: "0
 * dagen op rij" reads as a score on a child who has done nothing wrong.
 */
export function ReeksGetal({ dagen }: { readonly dagen: number }) {
  return (
    <p className="tk-reeks-getal">
      <StreakIcon size={24} />
      {dagen === 0 ? (
        <span className="tk-reeks-zin">{t('reeks.nul')}</span>
      ) : (
        <>
          <span className="tk-reeks-aantal">{dagen}</span>
          <span className="tk-reeks-zin">{dagen === 1 ? t('reeks.een') : t('reeks.veel')}</span>
        </>
      )}
    </p>
  );
}

/**
 * The last seven days as seven bars under their names, today last (ADR-110):
 * ink where a round was finished, a hairline tone where none was.
 *
 * The names are drawn for the eye and said in full to a screen reader, one day
 * at a time, because "wo" is not a word anyone reads aloud and a bar has no
 * name of its own.
 */
export function WeekRij({ dagen }: { readonly dagen: readonly Oefendag[] }) {
  return (
    <ol className="tk-weekrij" aria-label={t('reeks.week')}>
      {dagen.map((dag) => (
        <li key={dag.dag} className="tk-weekdag" data-geoefend={dag.geoefend ? 'ja' : undefined}>
          <span className="tk-weekdag-naam" aria-hidden="true">
            {dagKort(dag.weekdag)}
          </span>
          <span className="tk-weekdag-balk" aria-hidden="true" />
          <span className="tk-sr-only">{dagZin(dag)}</span>
        </li>
      ))}
    </ol>
  );
}

function dagZin(dag: Oefendag): string {
  if (dag.vandaag) return dag.geoefend ? t('reeks.vandaagWel') : t('reeks.vandaagNiet');
  const naam = dagLang(dag.weekdag);
  return dag.geoefend ? t('reeks.dagWel', { dag: naam }) : t('reeks.dagNiet', { dag: naam });
}
