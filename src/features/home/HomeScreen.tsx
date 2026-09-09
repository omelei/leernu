import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { countMastered, formatGrade, grade, type ItemState, type ModeId } from '@/game-core';
import { ProgressBar } from '@/components/ProgressBar';
import { type IconProps } from '@/components/Icon';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { useTestPlan } from './testPlan';
import { SideColumn } from './SideColumn';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import type { PlayedRound } from '@/store/progress';
import {
  asKlokMode,
  asPracticeMode,
  asSumMode,
  geplaatst,
  meestGeoefend,
  naamVan,
  onderdelen,
  starters,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
  type Populair,
} from '@/features/module/onderdelen';
import type { PracticeMode, SetId } from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';
import type { KlokMode } from '@/features/klok/useKlokRound';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Three areas, and the design gives a reason for each. The rail on the left is
 * the whole product. The wide middle is today, what was just practised, and
 * everything else there is to do. The column on the right is the child's own:
 * how the whole of it is going, where they keep going back to, and the one
 * thing on the screen they get to choose.
 *
 * The screen argues for the product in the order it puts things. First the
 * child's own name; then what practising here is like, which is the sentence
 * that admits the part that looks like a mistake; then the test, which is the
 * reason any of it is happening this week; then the exercises this child keeps
 * coming back to; then what was just practised and how it went; then
 * everything else there is.
 *
 * **The block between the test and the log is a way in, not a report.** It
 * held one set with its size, its number of rounds and two buttons — a card
 * that explained a decision the child had not asked to make yet. What stands
 * there now is four exercises with the number of times each was played, which
 * is the same question answered in the form a child actually uses: not "here
 * is what we suggest", but "here is where you keep going" (ADR-082).
 *
 * Two things it deliberately does not do. **It does not forecast.** "Wat
 * onthoud je" is K9's and it stays there: it is the number the product argues
 * from, and on the front door beside a mark it read as a second opinion about
 * the same thing. And **the test block is about the test.** When it is, what it
 * is for, and the way in — no mark, no bar, no projection. A block that reports
 * on the child is not a reason to start.
 *
 * The catalogue of sets and the column on the right both used to live in this
 * file. They are shared with the module pages now and moved out to be shared;
 * nothing about what this screen draws changed with them.
 */

/** How many rounds the history shows. */
const RECENT_SHOWN = 3;

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** Which animal they chose. This screen only passes it on to their column. */
  readonly sticker: string | undefined;
  /** The way to the collection, which their column links to. */
  readonly onReis: () => void;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  /** A table, in a chosen way. */
  readonly onStartSum: (setId: string, sumMode: SumMode) => void;
  /** A step of the clock, in a chosen way. */
  readonly onStartKlok: (setId: string, klokMode: KlokMode) => void;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}

export function HomeScreen({
  naam,
  sticker,
  onReis,
  onStart,
  onStartSum,
  onStartKlok,
  onModule,
}: HomeScreenProps) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const plan = useTestPlan();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setPlayed);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const gespeeld = geplaatst(played, startbareOnderdelen());
  const populair = meestGeoefend(gespeeld);

  /** One way into a round, wherever on this screen it is pressed. */
  const begin = (deel: Onderdeel, mode: ModeId) => {
    if (deel.moduleId === 'topo') onStart(deel.setId as SetId, asPracticeMode(mode));
    else if (deel.moduleId === 'klok') onStartKlok(deel.setId, asKlokMode(mode));
    else onStartSum(deel.setId, asSumMode(mode));
  };

  return (
    <div className="tk-home">
      <div className="tk-home-top">
        {/* The child's own name, and under it the sentence that argues for the
            whole product by admitting the part that looks like a mistake: a
            child handed a question they have had before should be told that
            was on purpose. */}
        <div>
          <h1 className="tk-display text-h1 font-semibold">{t('home.welcome', { naam })}</h1>
          <p className="mt-1 text-body text-ink-2">{t('home.todayOpen')}</p>
        </div>

        {/* The one block with a surface and a border, and it is about the
            tests. When they are and what they are about — and nothing else
            (ADR-077). The way into a round used to be inside this border too,
            which made one block answer two questions: when is the test, and
            what shall I do now.

            Nothing in this card waits for IndexedDB. It did, and on WebKit —
            an iPad in a classroom — the screenshots caught the whole block
            absent: the reason the child is here, missing for as long as the
            read took, and then pushing everything under it down. */}
        <section className="tk-card tk-card-accented" data-module={plan.subject ?? undefined}>
          <TestDate plan={plan} now={now} />
        </section>

        {/* And the ways on, out from under it: where this child actually goes,
            with the count that says so. */}
        <Populairst populair={populair} onBegin={begin} />
      </div>

      <SideColumn sticker={sticker} onReis={onReis} onBegin={begin} />

      <div className="tk-home-more">
        <Recent gespeeld={gespeeld} onBegin={begin} />
        <VerderOefenen known={known} onOpen={onModule} />
      </div>
    </div>
  );
}

/**
 * Where this child keeps going, as four tiles with the count on them.
 *
 * The tiles are the shape the rail uses for a module and the foot of the page
 * uses for the ones that are coming, which is deliberate: a tile in this
 * product is a door, and these are doors. What is different is the line at the
 * bottom — "12 keer gespeeld" — and that line is the whole point of the block.
 * A child who has played the provinces twelve times knows something about
 * themselves that no bar and no mark tells them.
 *
 * **The count is this device's own.** There is no backend and nothing leaves
 * the machine (ADR-015), so there is no "most popular with everyone" to report
 * and no honest way to invent one. On a profile with no rounds behind it the
 * block says so and offers four to start with, at nought rather than at a
 * number that would be a guess.
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
    <section className="flex flex-col gap-3" aria-label={t('home.popularTitle')}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="tk-label">{t('home.popularTitle')}</h2>
        <p className="text-ink-2">{leeg ? t('home.popularNew') : t('home.popularIntro')}</p>
      </div>

      <div className="tk-tiles">
        {lijst.map(({ deel, mode, keer }) => {
          const ModuleIcon: ComponentType<Omit<IconProps, 'children'>> = MODULE_ICON[deel.moduleId];

          return (
            <button
              key={`${deel.setId}-${mode}`}
              type="button"
              data-module={deel.moduleId}
              className="tk-tile"
              onClick={() => onBegin(deel, mode)}
            >
              <span className="tk-tile-head">
                <ModuleIcon size={24} />
                <span className="tk-display text-h3 font-semibold">{naamVan(deel)}</span>
              </span>

              <span className="text-ink-2">{t(`mode.${mode}` as TranslationKey)}</span>

              {/* The count, which is the reason the block exists. Nought is a
                  sentence rather than a nought: "0 keer gespeeld" reads as a
                  score on a child who has done nothing wrong. */}
              <span className="tk-tile-count">
                {keer === 0
                  ? t('home.popularNone')
                  : keer === 1
                    ? t('home.popularOnce')
                    : t('home.popularTimes', { aantal: keer })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * What was just practised, and what it came to.
 *
 * A log and not a league table: newest first, three of them, each one a round
 * that happened. The mark is over what was answered rather than what was asked,
 * because a round can be stopped early and the questions nobody saw were not
 * got wrong.
 *
 * Every tile starts that same set the same way again, which is the one thing a
 * child wants from a list of what they just did.
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
    <section className="flex flex-col gap-3" aria-label={t('home.recentTitle')}>
      <h2 className="tk-label">{t('home.recentTitle')}</h2>

      {recent.length === 0 ? (
        <p className="text-ink-2">{t('home.recentNone')}</p>
      ) : (
        <div className="tk-tiles">
          {recent.map(({ deel, ronde }) => {
            const cijfer = grade(ronde.correct, ronde.answered);
            const ModuleIcon: ComponentType<Omit<IconProps, 'children'>> =
              MODULE_ICON[deel.moduleId];

            return (
              <button
                key={ronde.at}
                type="button"
                data-module={deel.moduleId}
                className="tk-tile"
                onClick={() => onBegin(deel, ronde.mode)}
              >
                <span className="tk-tile-head">
                  <ModuleIcon size={24} />
                  <span className="tk-display text-h3 font-semibold">{naamVan(deel)}</span>
                </span>

                <span className="flex items-baseline gap-3">
                  <span className="tk-label">{t('home.recentGrade')}</span>
                  <span className="tk-display text-h2 font-bold tabular-nums">
                    {cijfer === null ? '' : formatGrade(cijfer)}
                  </span>
                </span>

                <span className="text-ink-2">
                  {`${t(`mode.${ronde.mode}` as TranslationKey)} · ${t('home.recentOutOf', {
                    goed: ronde.correct,
                    totaal: ronde.answered,
                  })}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Everything else there is, as tiles across the foot of the page.
 *
 * All five, not only the two that are built (ADR-051). A child who can see
 * that clocks and flags are coming is reading a plan; a rail and a list that
 * show only what is finished make the product look like it stops here — and a
 * module that does not exist yet says so on its own face rather than opening
 * onto nothing.
 */
function VerderOefenen({
  known,
  onOpen,
}: {
  readonly known: ReadonlyMap<string, ItemState>;
  readonly onOpen?: ((id: Module['id']) => void) | undefined;
}) {
  const alles = onderdelen();

  return (
    <section className="flex flex-col gap-3" aria-label={t('home.practiceMore')}>
      <h2 className="tk-label">{t('home.practiceMore')}</h2>

      <div className="tk-tiles">
        {RAIL_MODULES.map((module) => {
          const ids = alles
            .filter((deel) => deel.moduleId === module.id)
            .flatMap((deel) => deel.items.map((item) => item.id));
          const mastered = countMastered(known, ids);
          const started = ids.some((id) => known.get(id)?.laatsteReview != null);
          const ModuleIcon: ComponentType<Omit<IconProps, 'children'>> = MODULE_ICON[module.id];

          return (
            <button
              key={module.id}
              type="button"
              data-module={module.id}
              data-soon={module.built ? undefined : 'ja'}
              className="tk-tile"
              onClick={() => onOpen?.(module.id)}
            >
              <span className="tk-tile-head">
                <ModuleIcon size={24} />
                <span className="tk-display text-h3 font-semibold">{t(module.name)}</span>
              </span>

              {/* A bar only where there is something to fill it. An empty rail
                  under a module that does not exist reads as nought percent
                  rather than as not yet.

                  Hidden from the accessibility tree, because the line under it
                  says the same thing in words and the whole tile is one button:
                  without this the bar's own name is folded into the button's,
                  and a screen reader reads "Rekenen, 8 van de 12 onthoud je, 8
                  van de 12 onthoud je". */}
              {module.built ? (
                <span aria-hidden="true">
                  <ProgressBar
                    value={ids.length === 0 ? 0 : mastered / ids.length}
                    showDot={false}
                    label={t('home.setMastered', { goed: mastered, totaal: ids.length })}
                  />
                </span>
              ) : null}

              <span className="text-ink-2">
                {!module.built
                  ? t('soon.subtitle')
                  : started
                    ? t('home.setMastered', { goed: mastered, totaal: ids.length })
                    : t('home.setNew')}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
