import { useEffect, useMemo, useState } from 'react';
import { t } from '@/i18n';
import { Button } from '@/components/Button';
import { Laden, PaginaKop } from '@/components/ds';
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
 * browses has not practised, and pretending otherwise would corrupt what
 * Vandaag says.
 *
 * Not a round, so not in the round's dark theme; and no navigation either,
 * because it is a way of practising and one press of "Klaar" leaves it. The
 * stap-2 screens do not draw it: this is the component set applied to the
 * layout it already had.
 *
 * **Why a list and not just the map.** Tapping the map cannot reach everything.
 * Measured on a 640px map, 77 of the 80 cities have a neighbour closer than a
 * fingertip; even the 25 largest have 23 pairs too close, because the Randstad
 * is the Randstad. So the list is the way in that always works, at any density
 * and on any device, and it is keyboard- and screen-reader-navigable for free.
 * The map still takes taps for whatever it can show (ADR-022).
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
      <main className="ln-ronde ln-ronde-laden" aria-busy="true">
        <Laden label={t('practice.loading')} />
      </main>
    );
  }

  // A sentence rather than a fragment: it is what gets read aloud, and "Amsterdam"
  // on its own tells a child nothing they did not already see.
  const spoken = chosen === null ? '' : `${chosen.naam}. ${chosen.weetje ?? ''}`.trim();

  return (
    <div className="ln-ontdek">
      <div className="ln-ontdek-kop">
        <PaginaKop titel={set?.naam ?? ''} meta={t('explore.kind')} soort="ding" />
        <span className="ln-ontdek-acties">
          {chosen !== null && <SpeakButton text={spoken} />}
          <Button variant="secondary" onClick={onHome}>
            {t('explore.done')}
          </Button>
        </span>
      </div>

      {/* What the child chose, announced rather than only drawn. */}
      <p className="ln-sr-only" role="status" aria-live="polite">
        {spoken}
      </p>

      <div className="ln-ontdek-lijf">
        {/* On a phone the list gets half the screen and scrolls inside it;
            beside the map from a tablet up, in a column of its own. */}
        <nav aria-label={t('explore.listLabel')} className="ln-ontdek-lijst">
          <p className="ln-sub">{t('explore.hint')}</p>
          <ul>
            {items.map((item) => {
              const picked = item.id === chosenId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ln-ontdek-item"
                    aria-current={picked ? 'true' : undefined}
                    onClick={() => setChosenId(picked ? null : item.id)}
                  >
                    {item.naam}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="ln-ontdek-hoofd">
          <div className="ln-canvas">
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
          <div className="ln-ontdek-uitleg">
            {chosen === null ? (
              <p className="ln-sub">{t('explore.nothingChosen')}</p>
            ) : (
              <>
                <h2 className="ln-titel">{chosen.naam}</h2>
                {chosen.weetje !== undefined && <p className="ln-tekst">{chosen.weetje}</p>}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
