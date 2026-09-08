import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  countMastered,
  formatGrade,
  grade,
  roundPreview,
  type ItemState,
  type ModeId,
  type Schedulable,
} from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadSumSets } from '@/content/loadSums';
import { Dot } from '@/components/Dot';
import { ProgressBar } from '@/components/ProgressBar';
import type { IconProps } from '@/components/Icon';
import { STICKERS, stickerById } from '@/components/stickerSet';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { useTestPlan } from './testPlan';
import { loadAccuracy, loadItemStates, loadPlayedRounds } from '@/store/progress';
import type { Accuracy, PlayedRound } from '@/store/progress';
import { SET_IDS, type PracticeMode, type SetId } from '@/features/practice/useRound';
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
 */

const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
};

/** What one round of this set asks. Topography samples large sets; a table is whole. */
const ROUND_SIZE = { topo: 15, tafels: 10 } as const;

/** How many rounds the history shows, and how many favourites the column holds. */
const RECENT_SHOWN = 3;
const FAVOURITES_SHOWN = 4;

interface Onderdeel {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly naam: TranslationKey | null;
  readonly literalNaam: string | null;
  readonly items: readonly Schedulable[];
  readonly roundSize: number;
}

/**
 * Every set of every built module, flattened.
 *
 * One list rather than a branch per module: the front door asks the same three
 * questions of all of them — how much is remembered, when was it last touched,
 * what would a round look like — and a second module should not mean a second
 * copy of those three.
 */
function onderdelen(): Onderdeel[] {
  // In the curated order, not the order the filenames sort in. It decides what
  // a child who has never practised is offered first, and that should be the
  // set the content calls the way in — provinces — rather than whichever JSON
  // file happens to come first in the alphabet.
  const sets = loadItemSets();
  const geordend = SET_IDS.map((id) => sets.find((set) => set.id === id)).filter(
    (set): set is (typeof sets)[number] => set !== undefined,
  );

  const topo = geordend.map((set) => ({
    moduleId: 'topo' as const,
    setId: set.id,
    naam: SET_NAME_KEY[set.id as SetId] ?? null,
    literalNaam: null,
    items: set.items as readonly Schedulable[],
    roundSize: ROUND_SIZE.topo,
  }));

  const tafels = loadSumSets().map((set) => ({
    moduleId: 'tafels' as const,
    setId: set.id,
    naam: null,
    literalNaam: t('sums.table', { tafel: set.tafel }),
    items: set.items as readonly Schedulable[],
    roundSize: ROUND_SIZE.tafels,
  }));

  return [...topo, ...tafels];
}

function naamVan(deel: Onderdeel): string {
  return deel.naam ? t(deel.naam) : (deel.literalNaam ?? '');
}

/** When this set was last answered, or null. Decides what "verder" means. */
function laatstGeoefend(deel: Onderdeel, known: ReadonlyMap<string, ItemState>): string | null {
  let laatste: string | null = null;
  for (const item of deel.items) {
    const at = known.get(item.id)?.laatsteReview ?? null;
    if (at !== null && (laatste === null || at > laatste)) laatste = at;
  }
  return laatste;
}

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

/**
 * Which set a played round was about.
 *
 * A session records the questions it asked and not the set they came from, so
 * this matches on the questions. One shared item is enough: no two sets share
 * an item, and a round of fifteen out of eighty still carries fifteen of them.
 */
function setVanRonde(ronde: PlayedRound, alles: readonly Onderdeel[]): Onderdeel | null {
  const asked = new Set(ronde.itemIds);
  return alles.find((deel) => deel.items.some((item) => asked.has(item.id))) ?? null;
}

/** A round that has been placed: which set, in which way, and how it went. */
interface Gespeeld {
  readonly deel: Onderdeel;
  readonly ronde: PlayedRound;
}

function geplaatst(rondes: readonly PlayedRound[], alles: readonly Onderdeel[]): Gespeeld[] {
  return rondes
    .map((ronde) => ({ deel: setVanRonde(ronde, alles), ronde }))
    .filter((played): played is Gespeeld => played.deel !== null);
}

/**
 * What a child keeps going back to: one entry per set and way of answering, the
 * ones chosen most often first.
 *
 * "Favourite" as in chosen, not as in recommended. There is no model here and
 * there is not going to be one — a child's own front door should not be a thing
 * that has opinions about them.
 */
interface Favoriet {
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly keer: number;
  readonly at: string;
}

function favorieten(gespeeld: readonly Gespeeld[]): Favoriet[] {
  const byKey = new Map<string, Favoriet>();

  for (const { deel, ronde } of gespeeld) {
    const key = `${deel.setId}|${ronde.mode}`;
    const seen = byKey.get(key);
    byKey.set(key, {
      deel,
      mode: ronde.mode,
      keer: (seen?.keer ?? 0) + 1,
      // The list arrives newest first, so the first sighting is the latest one.
      at: seen?.at ?? ronde.at,
    });
  }

  return [...byKey.values()]
    .sort((a, b) => b.keer - a.keer || b.at.localeCompare(a.at))
    .slice(0, FAVOURITES_SHOWN);
}

export interface HomeScreenProps {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  /** Which animal they chose, out of their own profile. */
  readonly sticker: string | undefined;
  readonly onSticker: (id: string) => void;
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

export function HomeScreen({
  naam,
  sticker,
  onSticker,
  onStart,
  onStartSum,
  onChoose,
  onModule,
}: HomeScreenProps) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [played, setPlayed] = useState<readonly PlayedRound[]>([]);
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const plan = useTestPlan();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then(setPlayed);
    void loadAccuracy().then(setAccuracy);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const alles = onderdelen();
  const verder = verderMet(alles, known, plan.subject);
  const gespeeld = geplaatst(played, alles);

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

      {/* The child's own column: how the whole of it is going, where they keep
          going back to, and the animal they picked.

          "Samen met" belongs at the foot of it. It is three friends, and there
          are none until ADR-050's backend, so it is absent rather than empty. */}
      <aside className="tk-home-aside">
        <Goed accuracy={accuracy} />
        <Favorieten gespeeld={gespeeld} onBegin={begin} />
        <Stickerkaart chosen={sticker} onChoose={onSticker} />
      </aside>

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
 * A stored way of answering, narrowed back to the one its module can start.
 *
 * `ModeId` is every way there is across both modules, because that is what a
 * session records. Anything a module does not recognise falls back to the way
 * that module begins — which is the way K1 offers anyway, and is never wrong,
 * only sometimes not the one that was asked for.
 */
const PRACTICE_MODES: readonly ModeId[] = [
  'wijs-aan',
  'meerkeuze',
  'hoe-heet-dit',
  'bliksemronde',
  'overleven',
];
const SUM_MODES: readonly ModeId[] = ['som-typen', 'som-meerkeuze', 'bliksemronde', 'overleven'];

function asPracticeMode(mode: ModeId): PracticeMode {
  return PRACTICE_MODES.includes(mode) ? (mode as PracticeMode) : 'wijs-aan';
}

function asSumMode(mode: ModeId): SumMode {
  return SUM_MODES.includes(mode) ? (mode as SumMode) : 'som-typen';
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

      <div className="flex flex-wrap gap-3">
        {/* One primary way in per module: pointing on a map, typing a sum. Both
            are the way that module starts, and both are one press away. */}
        <button
          type="button"
          className="tk-button"
          onClick={() => onBegin(deel, deel.moduleId === 'topo' ? 'wijs-aan' : 'som-typen')}
        >
          {t('home.continueWith', { module: moduleNaam })}
        </button>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          onClick={() => onChoose(deel.moduleId)}
        >
          {t('home.moreWays')}
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

/**
 * Everything answered, ever, as one fraction.
 *
 * Deliberately not a retention figure, and worded so the two cannot be
 * confused: this is what has been answered correctly, over every round there
 * has been. It moves slowly, it never resets, and it is the only number on this
 * screen about the whole of the work rather than about this week.
 */
function Goed({ accuracy }: { readonly accuracy: Accuracy | null }) {
  // Nothing until it is known. A card that says nought percent and then changes
  // its mind has told a child something about themselves that was not true.
  if (accuracy === null) return null;

  const procent =
    accuracy.answered === 0 ? 0 : Math.round((accuracy.correct / accuracy.answered) * 100);

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.accuracyTitle')}>
      <h2 className="tk-label">{t('home.accuracyTitle')}</h2>

      {accuracy.answered === 0 ? (
        <p className="text-ink-2">{t('home.accuracyNone')}</p>
      ) : (
        <div className="flex items-center gap-4">
          <Dot size={64} fill={procent / 100} />
          <div className="min-w-0">
            <p className="tk-display text-score font-bold tabular-nums">{`${procent}%`}</p>
            <p className="text-ink-2">
              {t('home.accuracyOf', { goed: accuracy.correct, totaal: accuracy.answered })}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Where a child keeps going back to, one press away. */
function Favorieten({
  gespeeld,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const lijst = favorieten(gespeeld);

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.favouritesTitle')}>
      <h2 className="tk-label">{t('home.favouritesTitle')}</h2>

      {lijst.length === 0 ? (
        <p className="text-ink-2">{t('home.favouritesNone')}</p>
      ) : (
        <ul className="flex flex-col gap-2 p-0">
          {lijst.map((favoriet) => {
            const ModuleIcon: ComponentType<Omit<IconProps, 'children'>> =
              MODULE_ICON[favoriet.deel.moduleId];

            return (
              <li key={`${favoriet.deel.setId}-${favoriet.mode}`}>
                <button
                  type="button"
                  data-module={favoriet.deel.moduleId}
                  className="tk-favourite"
                  onClick={() => onBegin(favoriet.deel, favoriet.mode)}
                >
                  <ModuleIcon size={24} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{naamVan(favoriet.deel)}</span>
                    <span className="block truncate text-ink-2">
                      {t(`mode.${favoriet.mode}` as TranslationKey)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * The sticker, which is the one thing on this screen a child chooses.
 *
 * It takes the place of the reisstempels in this corner. Those still exist and
 * are still awarded at the end of a round; what they are not any more is the
 * view from a child's own front door, because a shelf of things you have not
 * got yet is a poor thing to be shown every morning.
 *
 * Nothing here is locked. All six from the first day — the moment one has to be
 * earned this stops being a choice and becomes a scoreboard with animals on it.
 */
function Stickerkaart({
  chosen,
  onChoose,
}: {
  readonly chosen: string | undefined;
  readonly onChoose: (id: string) => void;
}) {
  const current = stickerById(chosen);
  const Big = current.draw;

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.stickersTitle')}>
      <h2 className="tk-label">{t('home.stickersTitle')}</h2>

      <div className="flex items-center gap-4">
        {/* Decorative: the row underneath says which one is yours, with a name
            and a pressed state, and hearing the animal twice is worse than
            hearing it once. */}
        <span className="tk-sticker-big">
          <Big size={56} />
        </span>
        <p className="text-ink-2">{t('home.stickersPick')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STICKERS.map((sticker) => {
          const Draw = sticker.draw;

          return (
            // The name is on the button and not on the drawing inside it. A
            // <title> in an SVG is an accessible name in Chromium and is not
            // one in WebKit, which is where these are read out loud: axe called
            // all six of them buttons with no discernible text, on the browser
            // an iPad in a classroom runs.
            <button
              key={sticker.id}
              type="button"
              className="tk-sticker"
              aria-label={t(sticker.name)}
              aria-pressed={sticker.id === current.id}
              onClick={() => onChoose(sticker.id)}
            >
              <Draw size={28} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
