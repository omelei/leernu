import { useEffect, useState } from 'react';
import { countMastered, formatGrade, grade, type ItemState, type ModeId } from '@/game-core';
import { ProgressBar } from '@/components/ProgressBar';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { useDesk } from '@/features/shell/useSmallScreen';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import type { PlayedRound } from '@/store/progress';
import {
  geplaatst,
  meestGeoefend,
  naamVan,
  onderdelen,
  starters,
  startbareOnderdelen,
  POPULAR_SHOWN,
  type Gespeeld,
  type Onderdeel,
  type Populair,
} from '@/features/module/onderdelen';
import { ScrollRij } from './ScrollRij';
import { FavorietenBlok, GoedBlok, VoortgangBlok } from './SideColumn';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Redrawn in 2026-09 (ADR-094) and still the same argument, in the same order.
 * First the child's own name, and under it what doing this is: choose a
 * subject, do a round, earn the next one. Then three rows of ways in — what this
 * child goes back to most, what they did last and how it went, and everything
 * else there is, furthest along first. Then the child's own column: the tests,
 * the level, how the whole of it is going, and their favourites.
 *
 * **Three rows that scroll sideways.** Each one used to be a grid that wrapped
 * onto as many lines as it needed, which made the page as long as the child's
 * history. As rows they are one line each at every size, with five cards in the
 * first two and every module in the third, and what is past the edge is one
 * swipe, one press or one arrow key away (`ScrollRij`).
 *
 * **The column moves, the page does not.** From 1200 it stands beside the rows.
 * Below that its four blocks go into the flow of this page: progress and tests
 * side by side on a tablet above the rows, and the other two after them. Which
 * block goes where is decided here, in React, because it is the reading order
 * as well as the drawing (see `useDesk`).
 *
 * Two things it deliberately does not do. **It does not forecast** — "wat
 * onthoud je" is K9's. And **the test block is about the tests**: when they are
 * and what they are about, with no mark, no bar and no projection.
 */

/**
 * How many rounds the history shows: as many cards as "meest geoefend" holds,
 * so the two rows the handoff draws as one shape are also one length.
 */
const RECENT_SHOWN = POPULAR_SHOWN;

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** Which animal they chose. This screen only passes it on to their column. */
  readonly sticker: string | undefined;
  /** The way to the collection, which their column links to. */
  readonly onReis: () => void;
  /**
   * One way into a round, whichever module it is in: the same one the child's
   * own column and the module pages use. There were three callbacks here, one
   * per module, and a fourth module would have made it four.
   */
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}

export function HomeScreen({ naam, sticker, onReis, onBegin, onModule }: HomeScreenProps) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const desk = useDesk();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setPlayed);
  }, []);

  const known = states ?? new Map<string, ItemState>();

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const gespeeld = geplaatst(played, startbareOnderdelen());
  const populair = meestGeoefend(gespeeld);

  /** One way into a round, wherever on this screen it is pressed. */
  const begin = onBegin;

  const kop = (
    <div className="tk-home-kop">
      <h1 className="tk-display tk-titel font-semibold">{t('home.welcome', { naam })}</h1>
      <p className="text-body text-ink-2">{t('home.todayOpen')}</p>
    </div>
  );

  const rijen = (
    <>
      <Populairst populair={populair} onBegin={begin} />
      <Recent gespeeld={gespeeld} onBegin={begin} />
      <VerderOefenen known={known} onOpen={onModule} />
    </>
  );

  const toetsen = <ToetsenBlok />;
  const voortgang = <VoortgangBlok sticker={sticker} onReis={onReis} />;
  const goed = <GoedBlok />;
  const favorieten = <FavorietenBlok onBegin={begin} />;

  if (desk) {
    return (
      <div className="tk-home">
        <div className="tk-home-main">
          {kop}
          {rijen}
        </div>

        <aside className="tk-home-aside">
          {toetsen}
          {voortgang}
          {goed}
          {favorieten}
        </aside>
      </div>
    );
  }

  return (
    <div className="tk-home">
      {kop}
      <div className="tk-home-paar">
        {voortgang}
        {toetsen}
      </div>
      {rijen}
      {goed}
      {favorieten}
    </div>
  );
}

/**
 * One card in the first two rows. They are the same card in both, on purpose:
 * a mark, the exercise, the way it was done, and under a rule the one line the
 * row is about — how often, or how it went.
 */
function GeoefendKaart({
  deel,
  vorm,
  status,
  onClick,
}: {
  readonly deel: Onderdeel;
  readonly vorm: string;
  readonly status: string;
  readonly onClick: () => void;
}) {
  const ModuleIcon = MODULE_ICON[deel.moduleId];

  return (
    <button type="button" data-module={deel.moduleId} className="tk-kaart" onClick={onClick}>
      <span className="tk-plaat tk-plaat-groot">
        <ModuleIcon size={24} />
      </span>
      <span className="tk-kaart-titel tk-kaart-titel-twee">{naamVan(deel)}</span>
      <span className="tk-kaart-regel">{vorm}</span>
      <span className="tk-kaart-voet">{status}</span>
    </button>
  );
}

/**
 * Where this child keeps going, most played first, with the count on each.
 *
 * **The count is this device's own.** There is no backend and nothing leaves
 * the machine (ADR-015), so there is no "most popular with everyone" and no
 * honest way to invent one. A profile with no rounds behind it is offered the
 * ones to start with, at nought rather than at a number that would be a guess.
 */
function Populairst({
  populair,
  onBegin,
}: {
  readonly populair: readonly Populair[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const leeg = populair.length === 0;
  const lijst = leeg ? starters() : populair;
  if (lijst.length === 0) return null;

  return (
    <ScrollRij
      titel={t('home.popularTitle')}
      onder={leeg ? <p className="text-ink-2">{t('home.popularNew')}</p> : null}
    >
      {lijst.map(({ deel, mode, keer }) => (
        <GeoefendKaart
          key={`${deel.setId}-${mode}`}
          deel={deel}
          vorm={t(`mode.${mode}` as TranslationKey)}
          // Nought is a sentence rather than a nought: "0 keer gespeeld" reads
          // as a score on a child who has done nothing wrong.
          status={
            keer === 0
              ? t('home.popularNone')
              : keer === 1
                ? t('home.popularOnce')
                : t('home.popularTimes', { aantal: keer })
          }
          onClick={() => onBegin(deel, mode)}
        />
      ))}
    </ScrollRij>
  );
}

/**
 * What was just practised, and what it came to — newest first.
 *
 * A log and not a league table. The mark is over what was answered rather than
 * what was asked, because a round can be stopped early and the questions nobody
 * saw were not got wrong. Every card starts that same set the same way again.
 */
function Recent({
  gespeeld,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const recent = gespeeld.slice(0, RECENT_SHOWN);

  return (
    <ScrollRij
      titel={t('home.recentTitle')}
      leeg={recent.length === 0 ? t('home.recentNone') : undefined}
    >
      {recent.map(({ deel, ronde }) => {
        const cijfer = grade(ronde.correct, ronde.answered);
        const uit = { goed: ronde.correct, totaal: ronde.answered };

        return (
          <GeoefendKaart
            key={ronde.at}
            deel={deel}
            vorm={t(`mode.${ronde.mode}` as TranslationKey)}
            status={
              cijfer === null
                ? t('home.recentOutOf', uit)
                : t('home.recentLine', { cijfer: formatGrade(cijfer), ...uit })
            }
            onClick={() => onBegin(deel, ronde.mode)}
          />
        );
      })}
    </ScrollRij>
  );
}

/**
 * Everything else there is, furthest along first.
 *
 * All five, not only the ones that are built (ADR-051): a child who can see
 * that flags are coming is reading a plan. The ones that exist are sorted by how
 * much of them is remembered, and the ones that do not come after all of them,
 * in the rail's order — a stable sort keeps it.
 */
function VerderOefenen({
  known,
  onOpen,
}: {
  readonly known: ReadonlyMap<string, ItemState>;
  readonly onOpen?: ((id: Module['id']) => void) | undefined;
}) {
  const alles = onderdelen();

  const kaarten = RAIL_MODULES.map((module) => {
    const ids = alles
      .filter((deel) => deel.moduleId === module.id)
      .flatMap((deel) => deel.items.map((item) => item.id));
    const mastered = countMastered(known, ids);

    return {
      module,
      totaal: ids.length,
      mastered,
      stand: ids.length === 0 ? 0 : mastered / ids.length,
      started: ids.some((id) => known.get(id)?.laatsteReview != null),
    };
  }).sort((a, b) => Number(b.module.built) - Number(a.module.built) || b.stand - a.stand);

  return (
    <ScrollRij titel={t('home.practiceMore')}>
      {kaarten.map(({ module, totaal, mastered, stand, started }) => {
        const ModuleIcon = MODULE_ICON[module.id];
        const onthoud = t('home.setMastered', { goed: mastered, totaal });

        return (
          <button
            key={module.id}
            type="button"
            data-module={module.id}
            data-soon={module.built ? undefined : 'ja'}
            className="tk-kaart tk-verder"
            onClick={() => onOpen?.(module.id)}
          >
            <span className="tk-verder-kop">
              <span className="tk-plaat tk-plaat-groot">
                <ModuleIcon size={24} />
              </span>
              <span className="tk-kaart-titel">{t(module.name)}</span>
            </span>

            {/* The bar is the handoff's, and it is hidden from the
                accessibility tree: the whole card is one button, and a bar's
                own name folded into the button's is read out twice. What it
                shows is said in words instead, for the reader who cannot see
                it. */}
            {module.built ? (
              <>
                <span aria-hidden="true">
                  <ProgressBar value={stand} label={onthoud} />
                </span>
                <span className="tk-sr-only">{started ? onthoud : t('home.setNew')}</span>
              </>
            ) : (
              <span className="tk-kaart-regel">{t('soon.subtitle')}</span>
            )}
          </button>
        );
      })}
    </ScrollRij>
  );
}
