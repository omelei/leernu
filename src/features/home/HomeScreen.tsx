import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  countMastered,
  formatGrade,
  grade,
  roundPreview,
  type ItemState,
  type ModeId,
} from '@/game-core';
import { ProgressBar } from '@/components/ProgressBar';
import { GoIcon, type IconProps } from '@/components/Icon';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { useTestPlan } from './testPlan';
import { SideColumn } from './SideColumn';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import type { PlayedRound } from '@/store/progress';
import {
  asPracticeMode,
  asSumMode,
  geplaatst,
  laatstGeoefend,
  naamVan,
  onderdelen,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import type { PracticeMode, SetId } from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';

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
 * child's own name; then what today asks and why some of it is a repeat; then
 * the test, which is the reason any of it is happening this week; then what was
 * just practised and how it went; then everything else there is.
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

/**
 * What "verder" means.
 *
 * The subject of the test comes first, and that is the whole reason the test
 * block asks for one. A child practising for Tuesday's topography test should
 * not be offered last night's tables because those were touched more recently:
 * the plan outranks the history.
 *
 * Within a subject, and with no subject set, it is the set touched most
 * recently. Not a guess about what a child wants next — the honest answer to
 * "where was I".
 */
function verderMet(
  alles: readonly Onderdeel[],
  known: ReadonlyMap<string, ItemState>,
  subject: Module['id'] | null,
): Onderdeel | null {
  const binnenVak = subject === null ? alles : alles.filter((deel) => deel.moduleId === subject);
  const lijst = binnenVak.length > 0 ? binnenVak : alles;

  const laatste = lijst.reduce<{ deel: Onderdeel; at: string } | null>((best, deel) => {
    const at = laatstGeoefend(deel, known);
    if (at === null) return best;
    return best === null || at > best.at ? { deel, at } : best;
  }, null);

  return laatste?.deel ?? lijst[0] ?? null;
}

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** Which animal they chose. This screen only passes it on to their column. */
  readonly sticker: string | undefined;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  /** A table, in a chosen way. */
  readonly onStartSum: (setId: string, sumMode: SumMode) => void;
  /**
   * Every other way of practising, which is K2's job — and K2 belongs to a
   * module, so this carries which one. Sending a child who was doing tables to
   * the topography chooser is the bug this parameter exists to make impossible.
   */
  readonly onChoose: (moduleId: Module['id']) => void;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}

export function HomeScreen({ naam, onStart, onStartSum, onChoose, onModule }: HomeScreenProps) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const plan = useTestPlan();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setPlayed);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const alles = onderdelen();
  const verder = verderMet(alles, known, plan.subject);
  // Over every set a round can be started on, mixes included: a round of the
  // Rekenmix that could not be placed would drop out of the history entirely.
  const gespeeld = geplaatst(played, startbareOnderdelen());

  const vooruitblik = verder
    ? roundPreview({ items: verder.items, states: known, size: verder.roundSize, now })
    : { total: 0, seen: 0 };

  /** One way into a round, wherever on this screen it is pressed. */
  const begin = (deel: Onderdeel, mode: ModeId) => {
    if (deel.moduleId === 'topo') onStart(deel.setId as SetId, asPracticeMode(mode));
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
          <p className="mt-1 text-body text-ink-2">
            {`${countLine(vooruitblik.total)} ${repeatLine(vooruitblik.seen)}`}
          </p>
        </div>

        {/* The one block with a surface and a border, and it is about the test.
            When it is, what it is for, and the way in — and nothing else. A
            mark or a bar here would turn the reason to start into a report on
            the child. */}
        {verder ? (
          <section
            className="tk-card tk-card-accented flex flex-col gap-6"
            data-module={verder.moduleId}
          >
            {/* Nothing in this card waits for IndexedDB. It did, and on WebKit
                — an iPad in a classroom — the screenshots caught the whole
                block absent: the one thing on the front door a child is meant
                to press, missing for as long as the read took, and then
                pushing the button down when it landed. */}
            <TestDate plan={plan} now={now} />
            <Verder deel={verder} onBegin={begin} onChoose={onChoose} />
          </section>
        ) : null}
      </div>

      <SideColumn sticker={sticker} onBegin={begin} />

      <div className="tk-home-more">
        <Recent gespeeld={gespeeld} onBegin={begin} />
        <VerderOefenen known={known} verder={verder} onOpen={onModule} />
      </div>
    </div>
  );
}

function countLine(total: number): string {
  return total === 1 ? t('home.todayCountOne') : t('home.todayCount', { aantal: total });
}

function repeatLine(seen: number): string {
  if (seen === 0) return t('home.todayFresh');
  if (seen === 1) return t('home.todayRepeatOne');
  return t('home.todayRepeats', { aantal: seen });
}

/**
 * The way in, inside the test block.
 *
 * One primary button, which is K1's rule: the shortest way into a round is
 * pointing, and every other choice lives on K2 rather than as five more buttons
 * here. The set is named because the button is about to start it, and nothing
 * else is said about it — how it is going belongs under "recent geoefend" and
 * in the column on the right.
 */
function Verder({
  deel,
  onBegin,
  onChoose,
}: {
  readonly deel: Onderdeel;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
  readonly onChoose: (moduleId: Module['id']) => void;
}) {
  const moduleNaam = t(`module.${deel.moduleId}` as TranslationKey);
  const rondes = Math.max(1, Math.ceil(deel.items.length / deel.roundSize));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="tk-display text-h3 font-semibold">{naamVan(deel)}</h3>
        <p className="text-ink-2">
          {rondes === 1
            ? t('home.setsOverOne', { onderdelen: deel.items.length })
            : t('home.setsOver', { onderdelen: deel.items.length, rondes })}
        </p>
      </div>

      {/* The way on sits at the end of the line, and the alternative before it
          — the same shape the module page's start row has (ADR-066). A child
          who has learned where the button is on one page should find it in the
          same place on the other. */}
      <div className="tk-choose-start">
        <button
          type="button"
          className="tk-button tk-button-secondary"
          onClick={() => onChoose(deel.moduleId)}
        >
          {t('home.moreWays')}
        </button>
        {/* One primary way in per module: pointing on a map, typing a sum. Both
            are the way that module starts, and both are one press away. */}
        <button
          type="button"
          className="tk-button tk-button-go"
          onClick={() => onBegin(deel, deel.moduleId === 'topo' ? 'wijs-aan' : 'som-typen')}
        >
          <span className="tk-button-label">
            {t('home.continueWith', { module: moduleNaam })}
            <GoIcon size={24} />
          </span>
        </button>
      </div>
    </div>
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
  verder,
  onOpen,
}: {
  readonly known: ReadonlyMap<string, ItemState>;
  readonly verder: Onderdeel | null;
  readonly onOpen?: ((id: Module['id']) => void) | undefined;
}) {
  const alles = onderdelen();

  return (
    <section className="flex flex-col gap-3" aria-label={t('home.practiceMore')}>
      <h2 className="tk-label">{t('home.practiceMore')}</h2>

      <div className="tk-tiles">
        {RAIL_MODULES.filter((module) => module.id !== verder?.moduleId).map((module) => {
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
