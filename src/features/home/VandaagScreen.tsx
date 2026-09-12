import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { HeldTegel, PaginaKop, Plaat, SectieKop } from '@/components/ds';
import { STICKERS } from '@/components/stickerSet';
import {
  aantalOnthouden,
  currentStreak,
  dagSleutel,
  type ItemState,
  type ModeId,
  type StreakState,
} from '@/game-core';
import { formsFor, questionCount } from '@/features/module/forms';
import {
  geplaatst,
  laatstGeoefend,
  naamVan,
  onderdelen,
  starters,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { useHelden } from '@/features/reis/useHelden';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import { HOLIDAYS, loadStreak } from '@/store/streakStore';
import { geoefendTekst, vandaagMeta } from './dagen';
import { JouwWeek } from './JouwWeek';
import { ToetsKaart } from './ToetsKaart';

/**
 * Vandaag (S2): the front door, and the first of the four destinations.
 *
 * A place, so its heading is the display size, and one meta line: the date and
 * how many days in a row. Then, in this order: the test card; "Verder oefenen",
 * the sets this child is in the middle of; the start bar, whose one primary
 * button is the shortest way to practising; "Jouw helden"; "Jouw week".
 *
 * **No greeting and no column beside it.** The child's name is in the kopbalk,
 * and the old front door's own column — progress, level, favourites — is what
 * the handoff draws the other way round: the heroes move to the collection
 * and the level is gone (stap 3, bewijsstuk 3).
 *
 * **Verder oefenen** is the sets practised most recently, newest first, four of
 * them, topped up from the sets to start with. Each card leads to its module's
 * page with that set chosen. On a phone they are rows of 72 with the count at
 * the end (S2); from a tablet up, cards in a grid.
 *
 * **The start bar** starts the round last played, the same set the same way, or
 * the first set to start with for a child who has played nothing. On a phone
 * it is fixed above the tab bar.
 */

const VERDER = 4;

export function VandaagScreen({
  sticker,
  onBegin,
  onSet,
  onOefenen,
  onVerzameling,
}: {
  readonly sticker: string | undefined;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  /** A card: its module's page, with this set chosen. */
  readonly onSet: (deel: Onderdeel) => void;
  readonly onOefenen: () => void;
  readonly onVerzameling: () => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[] | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const helden = useHelden();
  const nu = useMemo(() => new Date(), []);

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, startbareOnderdelen())));
    void loadStreak().then(setStreak);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const rondes = gespeeld ?? [];

  // The sets in the middle of being practised, one card each, newest first.
  const verder: { readonly deel: Onderdeel; readonly mode: ModeId }[] = [];
  for (const { deel, ronde } of rondes) {
    if (verder.some((kaart) => kaart.deel.setId === deel.setId)) continue;
    verder.push({ deel, mode: ronde.mode });
    if (verder.length === VERDER) break;
  }
  for (const start of starters()) {
    if (verder.length === VERDER) break;
    if (verder.some((kaart) => kaart.deel.setId === start.deel.setId)) continue;
    verder.push({ deel: start.deel, mode: start.mode });
  }

  const eerste = verder[0] ?? null;
  const dagen = streak ? currentStreak(streak, nu, HOLIDAYS) : 0;
  const geoefendOp = new Set(rondes.map(({ ronde }) => dagSleutel(new Date(ronde.at))));

  /** A test in this module is about the set last practised in it, or its first. */
  const setVoor = (module: Module['id'] | null): Onderdeel | null => {
    if (module === null) return null;
    return (
      rondes.find(({ deel }) => deel.moduleId === module && !deel.mix)?.deel ??
      onderdelen().find((deel) => deel.moduleId === module) ??
      null
    );
  };

  return (
    <div className="ln-pagina ln-pagina-met-start">
      <PaginaKop titel={t('vandaag.titel')} meta={vandaagMeta(nu, dagen)} />

      {states === null ? null : <ToetsKaart states={known} setVoor={setVoor} nu={nu} />}

      <section className="flex flex-col gap-4" aria-labelledby="verder-oefenen">
        <SectieKop
          id="verder-oefenen"
          titel={t('home.practiceMore')}
          actie={
            <Button variant="tertiary" onClick={onOefenen}>
              {t('vandaag.alles')}
            </Button>
          }
        />
        <ul className="ln-verder" aria-busy={gespeeld === null}>
          {verder.map(({ deel }) => (
            <li key={deel.setId}>
              <VerderKaart deel={deel} known={known} nu={nu} onClick={() => onSet(deel)} />
            </li>
          ))}
        </ul>
      </section>

      {eerste ? <StartBalk deel={eerste.deel} mode={eerste.mode} onBegin={onBegin} /> : null}

      {helden && helden.helden.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="jouw-helden-vandaag">
          <SectieKop
            id="jouw-helden-vandaag"
            titel={t('vandaag.helden')}
            actie={
              <Button variant="tertiary" onClick={onVerzameling}>
                {t('vandaag.alles')}
              </Button>
            }
          />
          <ul className="ln-helden">
            {helden.helden.slice(0, 6).map((held) => {
              const dier = STICKERS[held.plek];
              if (!dier) return null;
              return (
                <li key={dier.id}>
                  <HeldTegel sticker={dier.id} reeks={held.reeks} gedragen={dier.id === sticker} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="jouw-week">
        <SectieKop id="jouw-week" titel={t('vandaag.week')} />
        <JouwWeek geoefend={geoefendOp} streak={streak} nu={nu} />
      </section>
    </div>
  );
}

/** One set the child is in the middle of: its plate, its name, where it stands. */
function VerderKaart({
  deel,
  known,
  nu,
  onClick,
}: {
  readonly deel: Onderdeel;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly nu: Date;
  readonly onClick: () => void;
}) {
  const ids = deel.items.map((item) => item.id);
  const laatste = laatstGeoefend(deel, known);
  const goed = aantalOnthouden(known, ids, nu);
  const telt = laatste !== null && ids.length > 0;

  return (
    <button type="button" className="ln-verder-kaart" onClick={onClick}>
      <Plaat Icoon={MODULE_ICON[deel.moduleId]} module={deel.moduleId} />
      <span className="ln-rij-tekst">
        <span className="ln-titel">{naamVan(deel)}</span>
        <span className="ln-sub">
          {geoefendTekst(laatste, nu)}
          {telt ? (
            <span className="ln-verder-lang">
              {t('vandaag.statusOnthouden', { goed, totaal: ids.length })}
            </span>
          ) : null}
        </span>
      </span>
      {telt ? (
        <span className="ln-getal ln-verder-getal" aria-hidden="true">
          {`${goed} / ${ids.length}`}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The one primary action: the round last played, said out loud — "Provincies
 * van Nederland · aanwijzen · 12 vragen". A way that is no longer offered — a
 * clock round from before the house style — starts the module's first way.
 */
function StartBalk({
  deel,
  mode,
  onBegin,
}: {
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const forms = formsFor(deel.moduleId);
  const form =
    forms.find(
      (kandidaat) => kandidaat.id === mode && !kandidaat.needsClock && !kandidaat.alleenToets,
    ) ??
    forms[0] ??
    null;
  if (form === null) return null;

  const aantal = questionCount(form, deel.items.length);
  const manier = t(form.name).toLocaleLowerCase('nl-NL');
  const regel =
    aantal === null
      ? t('vandaag.startRegelOpen', { set: naamVan(deel), manier })
      : t('vandaag.startRegel', {
          set: naamVan(deel),
          manier,
          vragen: t('start.vragen', { aantal }),
        });

  return (
    <div className="ln-start">
      <Button onClick={() => onBegin(deel, form.id)}>{t('vandaag.start')}</Button>
      <span className="ln-tekst ln-start-regel">{regel}</span>
    </div>
  );
}
