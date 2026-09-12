import { useEffect, useState } from 'react';
import { DiplomaIcon } from '@/components/Icon';
import { DIPLOMA_WERELDDELEN, type DiplomaWerelddeel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadVlagDiplomas } from '@/store/rewardStore';

/**
 * Six vlaggendiploma's, one per werelddeel, with the gaps showing (ADR-104).
 *
 * The tafeldiploma wall's shape and its argument: every gap is one werelddeel a
 * child can decide to go and sit this afternoon, so on the flags page pressing
 * one chooses it — the werelddeel, all its flags, and the diploma — and on the
 * collection page the same six are there to be looked at.
 */
export function VlagDiplomas({
  onKies,
}: {
  /** Where pressing a diploma chooses it. Absent where the wall is only shown. */
  readonly onKies?: (deel: DiplomaWerelddeel) => void;
}) {
  const [behaald, setBehaald] = useState<ReadonlySet<DiplomaWerelddeel> | null>(null);

  useEffect(() => {
    void loadVlagDiplomas().then(setBehaald);
  }, []);

  // Nothing until it is known: a wall that shows six gaps and then fills two of
  // them has told a child they had none.
  if (behaald === null) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('vlag.diplomasTitle')}>
      <div>
        <h2 className="tk-label">{t('vlag.diplomasTitle')}</h2>
        <p className="text-ink-2">
          {t('vlag.diplomasCount', { aantal: behaald.size, totaal: DIPLOMA_WERELDDELEN.length })}
        </p>
      </div>

      <div className="tk-diplomas">
        {DIPLOMA_WERELDDELEN.map((deel) => {
          const gehaald = behaald.has(deel);
          const naam = t(`regio.${deel}` as TranslationKey);
          const label = gehaald
            ? t('vlag.diplomaHave', { deel: naam })
            : t('vlag.diplomaWant', { deel: naam });
          const inhoud = (
            <>
              <DiplomaIcon size={24} />
              <span aria-hidden="true">{naam}</span>
            </>
          );

          return onKies ? (
            <button
              key={deel}
              type="button"
              className="tk-diploma"
              data-gehaald={gehaald ? 'ja' : undefined}
              aria-label={label}
              onClick={() => onKies(deel)}
            >
              {inhoud}
            </button>
          ) : (
            <span
              key={deel}
              className="tk-diploma"
              data-gehaald={gehaald ? 'ja' : undefined}
              role="img"
              aria-label={label}
            >
              {inhoud}
            </span>
          );
        })}
      </div>
    </section>
  );
}
