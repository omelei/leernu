import { useEffect, useState } from 'react';
import { DiplomaIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { loadDiplomas } from '@/store/rewardStore';
import { PremiumLabel } from './PremiumLabel';

/** One to twelve, which is every table the product has. */
const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Twelve diplomas, on the page the tables live on.
 *
 * The tafeltoets is the one thing about the tables a Dutch child already has an
 * opinion about before they meet this app: it is what the teacher hands out,
 * and "ik heb de tafel van 7" is a sentence they have heard and want to be able
 * to say. So the product offers it, in the shape it already has — the whole
 * table, all ten right, one mistake and you sit it again — and shows the twelve
 * as a wall with the gaps visible (ADR-064).
 *
 * The gaps are the point, and it is the one place in this product where an
 * empty slot is shown on purpose. Everywhere else a shelf of things not yet
 * earned was ruled out (ADR-059), because those were rewards a child could not
 * aim at. This is twelve named tables, in the order they are taught, and every
 * gap is a thing a child can decide to go and do this afternoon: pressing one
 * chooses that table, and step 2 is directly above it.
 *
 * Not in the child's own column, and not on the front door. It belongs to
 * rekenen and to nothing else — a diploma wall on every screen would be a
 * scoreboard, which is what the column on the right is careful not to be.
 */
export function Tafeldiplomas({ onKies }: { readonly onKies: (setId: string) => void }) {
  const [behaald, setBehaald] = useState<ReadonlySet<number> | null>(null);

  useEffect(() => {
    void loadDiplomas().then(setBehaald);
  }, []);

  // Nothing until it is known: a wall that shows twelve gaps and then fills
  // four of them has told a child they had none.
  if (behaald === null) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t('rekenen.diplomasTitle')}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="tk-label">{t('rekenen.diplomasTitle')}</h2>
        <PremiumLabel hoorbaar />
      </div>
      <p className="text-tekst-secundair">
        {t('rekenen.diplomasCount', { aantal: behaald.size, totaal: TAFELS.length })}
      </p>

      <div className="tk-diplomas">
        {TAFELS.map((tafel) => {
          const gehaald = behaald.has(tafel);

          return (
            <button
              key={tafel}
              type="button"
              className="tk-diploma"
              data-gehaald={gehaald ? 'ja' : undefined}
              aria-label={
                gehaald ? t('rekenen.diplomaHave', { tafel }) : t('rekenen.diplomaWant', { tafel })
              }
              onClick={() => onKies(`tafel-${tafel}`)}
            >
              <DiplomaIcon size={24} />
              <span aria-hidden="true" className="tabular-nums">
                {tafel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
