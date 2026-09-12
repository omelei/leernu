import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import { Button } from '@/components/Button';
import { PaginaKop } from '@/components/ds';
import { SpeakButton } from '@/components/SpeakButton';
import { loadVlagSet } from '@/content/loadVlaggen';
import { Vlag } from './Vlag';
import { vlagSetNaam, werelddelenVan } from './vlagNamen';

/**
 * Ontdekken, for flags: every flag of a set with nothing being asked.
 *
 * The map's exploring screen with the flag where the map was: a list that
 * always works, at any size and with a keyboard, and beside it the flag that
 * was chosen with the four things a child is told about it — its name, where
 * it is, its capital, and one fact about its colours or its signs. Nothing is
 * scored and nothing is written to the scheduler (see `ExploreScreen`).
 *
 * It is also where a child looks up a flag before a round, which is why the
 * list is in alphabetical order rather than in the order of the set.
 */
export function VlagExploreScreen({
  setId,
  onHome,
}: {
  readonly setId: string;
  readonly onHome: () => void;
}) {
  const set = useMemo(() => loadVlagSet(setId), [setId]);
  const items = useMemo(
    () => [...(set?.items ?? [])].sort((a, b) => a.naam.localeCompare(b.naam, 'nl')),
    [set],
  );
  const [chosenId, setChosenId] = useState<string | null>(null);
  const chosen = chosenId === null ? null : (items.find((vlag) => vlag.id === chosenId) ?? null);
  const provincie = chosen?.werelddelen.includes('nederland') ?? false;

  // A sentence rather than a fragment, because it is what gets read aloud.
  const spoken =
    chosen === null
      ? ''
      : `${chosen.naam}. ${t('vlag.explore.hoofdstad')}: ${chosen.hoofdstad}. ${chosen.weetje}`;

  return (
    <div className="ln-ontdek" data-module="vlaggen">
      <div className="ln-ontdek-kop">
        <PaginaKop
          titel={set ? vlagSetNaam(set) : ''}
          meta={t('vlag.explore.kind')}
          soort="ding"
        />
        <span className="ln-ontdek-acties">
          {chosen !== null && <SpeakButton text={spoken} />}
          <Button variant="secondary" onClick={onHome}>
            {t('explore.done')}
          </Button>
        </span>
      </div>

      <p className="ln-sr-only" role="status" aria-live="polite">
        {spoken}
      </p>

      <div className="ln-ontdek-lijf">
        <nav aria-label={t('explore.listLabel')} className="ln-ontdek-lijst">
          <p className="ln-sub">{t('vlag.explore.hint')}</p>
          <ul>
            {items.map((vlag) => {
              const picked = vlag.id === chosenId;
              return (
                <li key={vlag.id}>
                  <button
                    type="button"
                    className="ln-ontdek-item"
                    aria-current={picked ? 'true' : undefined}
                    onClick={() => setChosenId(picked ? null : vlag.id)}
                  >
                    {vlag.naam}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="ln-ontdek-hoofd">
          {/* Clipped, and the flag bound by the height it is given: on a phone
              this is half a screen shared with the facts, and a flag sized to
              the width alone overflowed onto the header and took the tap meant
              for "Klaar". */}
          <div className="ln-canvas ln-canvas-midden overflow-hidden">
            {chosen === null ? (
              <p className="ln-sub">{t('vlag.explore.nothingChosen')}</p>
            ) : (
              <div className="tk-vlag-podium tk-vlag-podium-hoog">
                <Vlag vlag={chosen} alt={t('vlag.alt', { naam: chosen.naam })} lazy={false} />
              </div>
            )}
          </div>

          {/* Reserved rather than appearing, so choosing a flag does not shove
              the picture upward. */}
          <div className="ln-ontdek-uitleg">
            {chosen === null ? null : (
              <>
                <h2 className="ln-titel">{chosen.naam}</h2>
                <dl className="ln-feiten">
                  <div>
                    <dt className="ln-label">
                      {provincie ? t('vlag.explore.land') : t('vlag.explore.werelddeel')}
                    </dt>
                    <dd>{werelddelenVan(chosen)}</dd>
                  </div>
                  <div>
                    <dt className="ln-label">{t('vlag.explore.hoofdstad')}</dt>
                    <dd>
                      {chosen.hoofdstad}
                      {chosen.hoofdstadNoot ? (
                        <span className="ln-sub block">{chosen.hoofdstadNoot}</span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                <p className="ln-tekst">{chosen.weetje}</p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
