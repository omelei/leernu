import { useMemo, useState } from 'react';
import { t } from '@/i18n';
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
 * scored and nothing is written to the scheduler: a child who browses has not
 * practised, and pretending otherwise would corrupt the forecast (see
 * `ExploreScreen`).
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
    <div className="flex h-screen flex-col bg-paper" data-module="vlaggen">
      <header className="flex flex-none items-center gap-6 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="tk-label">{t('vlag.explore.kind')}</p>
          <h1 className="tk-display truncate text-display font-semibold">
            {set ? vlagSetNaam(set) : ''}
          </h1>
        </div>

        {chosen !== null && <SpeakButton text={spoken} />}

        <button type="button" className="tk-button tk-button-secondary ml-auto" onClick={onHome}>
          {t('explore.done')}
        </button>
      </header>

      <p className="tk-sr-only" role="status" aria-live="polite">
        {spoken}
      </p>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <nav
          aria-label={t('explore.listLabel')}
          className="flex min-h-0 flex-1 flex-col border-t border-line md:w-[320px] md:flex-none md:border-r md:border-t-0"
        >
          <p className="flex-none px-6 py-3 text-ink-2">{t('vlag.explore.hint')}</p>

          <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {items.map((vlag) => {
              const picked = vlag.id === chosenId;
              return (
                <li key={vlag.id}>
                  <button
                    type="button"
                    aria-current={picked ? 'true' : undefined}
                    className={
                      picked
                        ? 'w-full rounded-chip border-2 border-ink bg-surface px-4 py-3 text-left font-semibold'
                        : 'w-full rounded-chip border-2 border-transparent px-4 py-3 text-left'
                    }
                    onClick={() => setChosenId(picked ? null : vlag.id)}
                  >
                    {vlag.naam}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="flex min-h-0 flex-none basis-1/2 flex-col md:flex-1 md:basis-auto">
          {/* Clipped, and the flag bound by the height it is given: on a phone
              this is half a screen shared with the facts, and a flag sized to
              the width alone overflowed onto the header and took the tap meant
              for "Klaar". */}
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6">
            {chosen === null ? (
              <p className="text-ink-2">{t('vlag.explore.nothingChosen')}</p>
            ) : (
              <div className="tk-vlag-podium tk-vlag-podium-hoog">
                <Vlag vlag={chosen} alt={t('vlag.alt', { naam: chosen.naam })} lazy={false} />
              </div>
            )}
          </div>

          {/* Reserved rather than appearing, so choosing a flag does not shove
              the picture upward. */}
          <div className="min-h-[9rem] flex-none border-t border-line px-6 py-4">
            {chosen === null ? null : (
              <>
                <h2 className="tk-display text-title font-semibold">{chosen.naam}</h2>
                <dl className="tk-vlag-feiten">
                  <div>
                    <dt className="tk-label">
                      {provincie ? t('vlag.explore.land') : t('vlag.explore.werelddeel')}
                    </dt>
                    <dd>{werelddelenVan(chosen)}</dd>
                  </div>
                  <div>
                    <dt className="tk-label">{t('vlag.explore.hoofdstad')}</dt>
                    <dd>
                      {chosen.hoofdstad}
                      {chosen.hoofdstadNoot ? (
                        <span className="tk-hulp block">{chosen.hoofdstadNoot}</span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2">{chosen.weetje}</p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
