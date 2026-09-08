import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  countMastered,
  formatGrade,
  grade,
  roundPreview,
  setRetention,
  testOutlook,
  type ItemState,
  type Schedulable,
} from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadSumSets } from '@/content/loadSums';
import { Dot } from '@/components/Dot';
import { ProgressBar } from '@/components/ProgressBar';
import { StampIcon, type IconProps } from '@/components/Icon';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { daysUntil, useTestPlan } from './testPlan';
import { loadItemStates, loadLastRound, type LastRound } from '@/store/progress';
import { loadStamps } from '@/store/rewardStore';
import { SET_IDS, type PracticeMode, type SetId } from '@/features/practice/useRound';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * Three areas, and the design gives a reason for each. The rail on the left is
 * the whole product. The wide middle is today and the way into it. The column
 * on the right is what has been kept — a forecast and a shelf of stamps,
 * neither of which is an instruction, and neither of which should sit above
 * the work.
 *
 * The screen argues for the product in the order it puts things. First the
 * child's own name, because a front door greets you; then what today asks and
 * why some of it is a repeat; then the test it is all for, with the one thing
 * to carry on with inside that same block; and only then everything else there
 * is to practise.
 *
 * What is deliberately not here. The five set cards moved to K2 — the design
 * gives the front door one thing to continue and a list of modules, and five
 * sets of one module on the door made topography look like the whole product.
 * "Samen met" is drawn and not built: it is three friends, and there are no
 * friends without the backend of ADR-050. An element with nothing behind it is
 * worse than a gap.
 */

const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
};

const THREE_WEEKS_DAYS = 21;

/** What one round of this set asks. Topography samples large sets; a table is whole. */
const ROUND_SIZE = { topo: 15, tafels: 10 } as const;

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

export function HomeScreen({
  naam,
  onStart,
  onStartSum,
  onChoose,
  onModule,
}: {
  /** Whose front door this is. K1 opens by saying so. */
  readonly naam: string;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  /** A table, typed, which is the shortest way into rekenen. */
  readonly onStartSum: (setId: string) => void;
  /**
   * Every other way of practising, which is K2's job — and K2 belongs to a
   * module, so this carries which one. Sending a child who was doing tables to
   * the topography chooser is the bug this parameter exists to make impossible.
   */
  readonly onChoose: (moduleId: Module['id']) => void;
  readonly onModule?: ((id: Module['id']) => void) | undefined;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [stamps, setStamps] = useState<readonly string[]>([]);
  // Three states, not two: `undefined` is "not read yet". A row that says
  // "nog geen ronde gedaan" and then changes its mind a frame later is worse
  // than a row that arrives a moment after the rest of the card.
  const [lastRound, setLastRound] = useState<LastRound | null | undefined>(undefined);
  const plan = useTestPlan();

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadStamps().then((held) => setStamps([...held]));
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();
  const inThreeWeeks = new Date(now.getTime() + THREE_WEEKS_DAYS * 86_400_000);

  const alles = onderdelen();
  const verder = verderMet(alles, known, plan.subject);

  // The previous round over this set, which is what the mark is about. Read
  // once the set is known, and again when it changes — switching the subject
  // of the test switches which round "vorige keer" refers to.
  const verderSetId = verder?.setId ?? null;
  useEffect(() => {
    if (verderSetId === null) return;
    const deel = onderdelen().find((kandidaat) => kandidaat.setId === verderSetId);
    if (!deel) return;

    // Back to unknown first. Changing the subject of the test changes which
    // set this is about, and the previous set's mark must not stand under the
    // new set's name even for a frame.
    setLastRound(undefined);

    let cancelled = false;
    void loadLastRound(deel.items.map((item) => item.id)).then((round) => {
      if (!cancelled) setLastRound(round);
    });

    return () => {
      cancelled = true;
    };
  }, [verderSetId]);

  const vooruitblik = verder
    ? roundPreview({ items: verder.items, states: known, size: verder.roundSize, now })
    : { total: 0, seen: 0 };

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

        {/* The one block with a surface and a border: the test, the set it is
            about, how the last round went, and the way in. One card because it
            is one thought — this is why you are here, and this is the door. */}
        {verder ? (
          <section
            className="tk-card tk-card-accented flex flex-col gap-6"
            data-module={verder.moduleId}
          >
            {/* Nothing in this card waits for IndexedDB. It did, and on WebKit
                — an iPad in a classroom — the screenshots caught the whole
                block absent: the one thing on the front door a child is meant
                to press, missing for as long as the read took, and then
                pushing the button down when it landed. The boxes, the stamps
                and the test all queue behind one database handle, so the card
                settles once and nothing moves. */}
            <TestDate plan={plan} now={now} />

            {/* What the date is for. On its own it is a sticker — the child
                already knew when the test was. */}
            <Vooruitzicht deel={verder} known={known} date={plan.date} now={now} />

            <Verder
              deel={verder}
              known={known}
              lastRound={lastRound}
              onStart={onStart}
              onStartSum={onStartSum}
              onChoose={onChoose}
            />
          </section>
        ) : null}
      </div>

      {/* The right-hand column: what you have kept, and what you earned by
          keeping it. Beside the work rather than under it, because neither of
          them is something to do.

          "Samen met" belongs at the foot of this column. It is three friends,
          and there are none until ADR-050's backend, so it is absent rather
          than empty. */}
      <aside className="tk-home-aside">
        <Onthouden deel={verder} known={known} inThreeWeeks={inThreeWeeks} />
        <Reisstempels stamps={stamps} />
      </aside>

      <VerderOefenen known={known} verder={verder} onOpen={onModule} />
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
 * The forecast, aimed at the day the child actually cares about.
 *
 * The number in the right-hand column is about three weeks from now, which is
 * the right horizon for the product and the wrong one for a test on Friday.
 * This is the same model asked the same question about that Friday, and asked
 * twice: once as things stand, and once having practised every day until then.
 * The gap between the two answers is the whole argument for opening the app
 * tomorrow.
 *
 * It is absent without a date, and absent once the date has gone by. A plan for
 * a day that has been is not a plan.
 */
function Vooruitzicht({
  deel,
  known,
  date,
  now,
}: {
  readonly deel: Onderdeel;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly date: string | null;
  readonly now: Date;
}) {
  if (date === null) return null;

  const days = daysUntil(date, now);
  if (days < 1) return null;

  const [year, month, dayOfMonth] = date.split('-').map(Number);
  const testDay = new Date(year ?? 1970, (month ?? 1) - 1, dayOfMonth ?? 1);

  const outlook = testOutlook({
    states: known,
    itemIds: deel.items.map((item) => item.id),
    now,
    testDay,
    perDay: deel.roundSize,
  });

  // Rounded figures, so a gap of a point or two is noise rather than an
  // argument. Below that, saying "practise and it goes up" would be selling.
  const worthIt = outlook.practised - outlook.asIs > 2;

  return (
    <p className="text-ink-2">
      {!outlook.started
        ? t('home.testOutlookStart', { straks: outlook.practised })
        : worthIt
          ? t('home.testOutlook', { nu: outlook.asIs, straks: outlook.practised })
          : t('home.testOutlookSteady', { nu: outlook.asIs })}
    </p>
  );
}

/**
 * The one thing to carry on with, and how the last attempt at it went.
 *
 * One primary button, which is K1's rule: the shortest way into a round is
 * pointing, and every other choice lives on K2 rather than as five more
 * buttons here.
 *
 * The bar and the mark beside it are the same fact twice — the round that has
 * been, drawn and then named. They deliberately do not report retention. That
 * is the forecast in the right-hand column, it is the number this product
 * argues from, and putting the two on one line would make them look like one
 * thing.
 */
function Verder({
  deel,
  known,
  lastRound,
  onStart,
  onStartSum,
  onChoose,
}: {
  readonly deel: Onderdeel;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly lastRound: LastRound | null | undefined;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  readonly onStartSum: (setId: string) => void;
  readonly onChoose: (moduleId: Module['id']) => void;
}) {
  const ids = deel.items.map((item) => item.id);
  const mastered = countMastered(known, ids);
  const started = ids.some((id) => known.get(id)?.laatsteReview != null);
  const rondes = Math.max(1, Math.ceil(ids.length / deel.roundSize));
  const moduleNaam = t(`module.${deel.moduleId}` as TranslationKey);
  const cijfer = lastRound ? grade(lastRound.correct, lastRound.answered) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="tk-display text-h3 font-semibold">{naamVan(deel)}</h3>
        <p className="text-ink-2">
          {rondes === 1
            ? t('home.setsOverOne', { onderdelen: ids.length })
            : t('home.setsOver', { onderdelen: ids.length, rondes })}
        </p>
        {/* Only once there is something to report. Before the first round the
            line under this one already says so, and "nog niet geoefend"
            directly above "nog geen ronde gedaan" is one fact told twice. */}
        {started ? (
          <p className="text-ink-2">
            {t('home.setMastered', { goed: mastered, totaal: ids.length })}
          </p>
        ) : null}
      </div>

      {lastRound === undefined ? null : cijfer !== null && lastRound !== null ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ProgressBar
            className="min-w-[8rem] flex-1"
            value={lastRound.correct / lastRound.answered}
            showDot={false}
            label={t('home.lastGradeBar', {
              goed: lastRound.correct,
              totaal: lastRound.answered,
            })}
          />
          <p className="font-semibold tabular-nums">
            {t('home.lastGrade', { cijfer: formatGrade(cijfer) })}
          </p>
        </div>
      ) : (
        <p className="text-ink-2">{t('home.lastGradeNone')}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {/* One primary way in per module: pointing on a map, typing a sum. Both
            are the way that module starts, and both are one press away. */}
        <button
          type="button"
          className="tk-button"
          onClick={() =>
            deel.moduleId === 'topo'
              ? onStart(deel.setId as SetId, 'wijs-aan')
              : onStartSum(deel.setId)
          }
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
    <section className="tk-home-more" aria-label={t('home.practiceMore')}>
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
 * The forecast, which is the number this product is for.
 *
 * It is what a child will still know in three weeks, not what they got right
 * today — and the sentence under it says so, because the two are easy to
 * confuse and only one of them is worth practising for. It sits in the right
 * column, away from the mark on the card, so that neither is read as the other.
 */
function Onthouden({
  deel,
  known,
  inThreeWeeks,
}: {
  readonly deel: Onderdeel | null;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly inThreeWeeks: Date;
}) {
  const ids = deel ? deel.items.map((item) => item.id) : [];
  const started = ids.some((id) => known.get(id)?.laatsteReview != null);
  const procent = started ? setRetention(known, ids, inThreeWeeks) : 0;
  const moduleNaam = deel ? t(`module.${deel.moduleId}` as TranslationKey) : '';

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.rememberTitle')}>
      <h2 className="tk-label">{t('home.rememberTitle')}</h2>

      {started ? (
        <>
          <div className="flex items-center gap-4">
            <Dot size={72} fill={procent / 100} />
            <div className="min-w-0">
              <p className="tk-display text-score font-bold tabular-nums">{`${procent}%`}</p>
              <p className="text-ink-2">{t('home.rememberOf', { module: moduleNaam })}</p>
            </div>
          </div>
          <p className="text-ink-2">{t('home.rememberWhy')}</p>
        </>
      ) : (
        // Before the first round the honest answer is "nothing yet". A 0% here
        // reads as failure rather than as a start.
        <p className="text-ink-2">{t('home.rememberNone')}</p>
      )}
    </section>
  );
}

/** What has been earned, named. ADR-040: every one of them by practising. */
function Reisstempels({ stamps }: { readonly stamps: readonly string[] }) {
  const namen = stamps.map((id) => t(`stamp.${id}` as TranslationKey));

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.stampsTitle')}>
      <h2 className="tk-label">{t('home.stampsTitle')}</h2>

      {namen.length === 0 ? (
        <p className="text-ink-2">{t('home.stampsNone')}</p>
      ) : (
        <ul className="flex flex-col gap-2 p-0">
          {stamps.map((id, n) => (
            <li key={id} className="flex items-center gap-3">
              <StampIcon size={24} />
              <span>{namen[n]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
