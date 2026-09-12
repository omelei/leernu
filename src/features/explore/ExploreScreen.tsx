import { useEffect, useMemo, useState } from 'react';
import { t } from '@/i18n';
import { SpeakButton } from '@/components/SpeakButton';
import { MapCanvas, type AnswerLayer } from '@/features/practice/MapCanvas';
import { loadAnswerLayer, SETS, type SetId } from '@/features/practice/useRound';
import { loadGeoSet, type GeoSet } from '@/content/loadGeo';
import { loadItemSets } from '@/content/loadSets';
import type { Item } from '@/game-core';

/**
 * Ontdekken: the map with nothing being asked.
 *
 * Until now a child's first meeting with every item was a question they got
 * wrong. That is testing, not teaching, and with 80 cities it is a long way to
 * learn anything. This screen is the other half: look first, be asked later.
 * Nothing here is scored and nothing is written to the scheduler — a child who
 * browses has not practised, and pretending otherwise would corrupt the
 * forecast on the home screen.
 *
 * **Why a list and not just the map.** Tapping the map cannot reach everything.
 * Measured on a 640px map, 77 of the 80 cities have a neighbour closer than a
 * fingertip; even the 25 largest have 23 pairs too close, because the Randstad
 * is the Randstad. So the list is the way in that always works, at any density
 * and on any device, and it is keyboard- and screen-reader-navigable for free.
 * The map still takes taps for whatever it can show (ADR-022), so a child who
 * wants to point may point.
 */
export function ExploreScreen({
  setId,
  onHome,
}: {
  readonly setId: SetId;
  readonly onHome: () => void;
}) {
  const [geo, setGeo] = useState<GeoSet | null>(null);
  const [answers, setAnswers] = useState<AnswerLayer | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const set = useMemo(() => loadItemSets().find((candidate) => candidate.id === setId), [setId]);
  const items = useMemo(() => set?.items ?? [], [set]);

  useEffect(() => {
    let cancelled = false;
    // The set decides which map it is looked at on, the same way a round does:
    // the provinces behind a Dutch set, the countries of Europe behind a
    // European one (ADR-086).
    const shape = SETS[setId];
    void Promise.all([
      loadGeoSet(shape.achtergrond, 'region', shape.regio),
      loadAnswerLayer(shape),
    ]).then(([loadedGeo, loadedAnswers]) => {
      if (cancelled) return;
      setGeo(loadedGeo);
      setAnswers(loadedAnswers);
    });
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.geometrieRef) map.set(item.geometrieRef, item.naam);
    }
    return map;
  }, [items]);

  /** The map answers in geometry ids; the list answers in item ids. */
  const itemByGeometry = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of items) {
      if (item.geometrieRef) map.set(item.geometrieRef, item);
    }
    return map;
  }, [items]);

  const chosen = chosenId === null ? null : (items.find((item) => item.id === chosenId) ?? null);

  if (!geo || !answers) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  // A sentence rather than a fragment: it is what gets read aloud, and "Amsterdam"
  // on its own tells a child nothing they did not already see.
  const spoken = chosen === null ? '' : `${chosen.naam}. ${chosen.weetje ?? ''}`.trim();

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex flex-none items-center gap-6 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="tk-label">{t('explore.kind')}</p>
          <h1 className="tk-display truncate text-h1 font-semibold">{set?.naam ?? ''}</h1>
        </div>

        {chosen !== null && <SpeakButton text={spoken} />}

        <button type="button" className="tk-button tk-button-secondary ml-auto" onClick={onHome}>
          {t('explore.done')}
        </button>
      </header>

      {/* What the child chose, announced rather than only drawn. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {spoken}
      </p>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        {/* On a phone the list gets half the screen and scrolls inside it.
            It used to be flex-none, so its height came from its own contents —
            eighty cities in a container that could not grow — and the buttons
            ended up somewhere a thumb could not reach and a test could not
            click. Beside the map there is room for a column, so from md it goes
            back to a fixed 320.

            320 is still a layout width rather than a step on §D's scale, which
            names none for this column. Spelled out so it stays a decision. */}
        <nav
          aria-label={t('explore.listLabel')}
          className="flex min-h-0 flex-1 flex-col border-t border-line md:w-[320px] md:flex-none md:border-r md:border-t-0"
        >
          <p className="flex-none px-6 py-3 text-ink-2">{t('explore.hint')}</p>

          <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {items.map((item) => {
              const picked = item.id === chosenId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={picked ? 'true' : undefined}
                    className={
                      picked
                        ? 'w-full rounded-control border-2 border-ink bg-surface px-4 py-3 text-left font-semibold'
                        : 'w-full rounded-control border-2 border-transparent px-4 py-3 text-left'
                    }
                    onClick={() => setChosenId(picked ? null : item.id)}
                  >
                    {item.naam}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Half the screen on a phone, all of what is left beside the list on
            anything wider. Bounded rather than greedy: a map that takes the
            whole height leaves the list with none. */}
        <main className="flex min-h-0 flex-none basis-1/2 flex-col md:flex-1 md:basis-auto">
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            <MapCanvas
              background={geo}
              answers={answers}
              interaction="explore"
              namesById={namesById}
              targetId={chosen?.geometrieRef ?? ''}
              chosenId={null}
              revealed={false}
              onPick={(geometrieRef) =>
                setChosenId(itemByGeometry.get(geometrieRef)?.id ?? chosenId)
              }
            />
          </div>

          {/* Reserved rather than appearing, so choosing something does not shove
              the map upward and lose the place a child was looking at. */}
          <div className="min-h-[7rem] flex-none border-t border-line px-6 py-4">
            {chosen === null ? (
              <p className="text-ink-2">{t('explore.nothingChosen')}</p>
            ) : (
              <>
                <h2 className="tk-display text-h2 font-semibold">{chosen.naam}</h2>
                {chosen.weetje !== undefined && <p className="mt-1">{chosen.weetje}</p>}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
