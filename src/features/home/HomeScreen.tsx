import { useEffect, useState } from 'react';
import {
  countMastered,
  roundPreview,
  setRetention,
  type ItemState,
  type Schedulable,
} from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadSumSets } from '@/content/loadSums';
import { Dot } from '@/components/Dot';
import { StampIcon } from '@/components/Icon';
import { RAIL_MODULES, type Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { loadItemStates } from '@/store/progress';
import { loadStamps } from '@/store/rewardStore';
import type { PracticeMode, SetId } from '@/features/practice/useRound';

/**
 * K1, the front door — which is also leer.nu itself.
 *
 * The screen argues for the product in the order it puts things. First what
 * today asks of you and why some of it is a repeat; then the date it is for;
 * then the one thing to carry on with; then everything else there is; and only
 * afterwards what you have kept and what you have earned. A score is nowhere
 * near the top, because this is not a scoreboard.
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
  const topo = loadItemSets().map((set) => ({
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

export function HomeScreen({
  onStart,
  onStartSum,
  onChoose,
  onModule,
}: {
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

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadStamps().then((held) => setStamps([...held]));
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();
  const inThreeWeeks = new Date(now.getTime() + THREE_WEEKS_DAYS * 86_400_000);

  const alles = onderdelen();

  // What "verder" means: the set touched most recently, or the first one when
  // nothing has been. Not a guess about what a child wants next — the honest
  // answer to "where was I".
  const verder =
    alles.reduce<{ deel: Onderdeel; at: string } | null>((best, deel) => {
      const at = laatstGeoefend(deel, known);
      if (at === null) return best;
      return best === null || at > best.at ? { deel, at } : best;
    }, null)?.deel ??
    alles[0] ??
    null;

  const vooruitblik = verder
    ? roundPreview({ items: verder.items, states: known, size: verder.roundSize, now })
    : { total: 0, seen: 0 };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      {/* The sentence that argues for the whole product, and it does it by
          admitting the part that looks like a mistake. A child who is handed a
          question they have had before should be told that was on purpose. */}
      <div>
        <h1 className="tk-display text-h1 font-semibold">
          {t('home.todayTitle', { aantal: vooruitblik.total })}
        </h1>
        <p className="mt-1 text-body text-ink-2">{repeatLine(vooruitblik.seen)}</p>
      </div>

      {/* The test date takes the place K1 gives it: above the work, because it
          is the reason the work is being done. */}
      <TestDate />

      {verder ? (
        <Verder
          deel={verder}
          known={known}
          onStart={onStart}
          onStartSum={onStartSum}
          onChoose={onChoose}
        />
      ) : null}

      <VerderOefenen known={known} verder={verder} onOpen={onModule} />

      <Onthouden deel={verder} known={known} inThreeWeeks={inThreeWeeks} />

      <Reisstempels stamps={stamps} />

      {/* "Samen met" belongs here, between the stamps and the foot of the page.
          It is three friends and there are none until ADR-050's backend, so it
          is absent rather than empty. */}
    </div>
  );
}

function repeatLine(seen: number): string {
  if (seen === 0) return t('home.todayFresh');
  if (seen === 1) return t('home.todayRepeatOne');
  return t('home.todayRepeats', { aantal: seen });
}

/**
 * The one thing to carry on with.
 *
 * One primary button, which is K1's rule: the shortest way into a round is
 * pointing, and every other choice lives on K2 rather than as five more
 * buttons here.
 */
function Verder({
  deel,
  known,
  onStart,
  onStartSum,
  onChoose,
}: {
  readonly deel: Onderdeel;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  readonly onStartSum: (setId: string) => void;
  readonly onChoose: (moduleId: Module['id']) => void;
}) {
  const ids = deel.items.map((item) => item.id);
  const mastered = countMastered(known, ids);
  const rondes = Math.max(1, Math.ceil(ids.length / deel.roundSize));
  const moduleNaam = t(`module.${deel.moduleId}` as TranslationKey);

  return (
    <article className="tk-card" data-module={deel.moduleId}>
      <h2 className="tk-display mb-1 text-h2 font-semibold">{naamVan(deel)}</h2>
      <p className="text-ink-2">{t('home.setsOver', { onderdelen: ids.length, rondes })}</p>
      <p className="mb-4 text-ink-2">
        {mastered === 0
          ? t('home.setNew')
          : t('home.setMastered', { goed: mastered, totaal: ids.length })}
      </p>

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
    </article>
  );
}

/**
 * Everything else there is, one row per module.
 *
 * All five, not only the two that are built (ADR-051). A child who can see that
 * clocks and flags are coming is reading a plan; a rail and a list that show
 * only what is finished make the product look like it stops here.
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

      {RAIL_MODULES.filter((module) => module.id !== verder?.moduleId).map((module) => {
        const ids = alles
          .filter((deel) => deel.moduleId === module.id)
          .flatMap((deel) => deel.items.map((item) => item.id));
        const mastered = countMastered(known, ids);
        const started = ids.some((id) => known.get(id)?.laatsteReview != null);

        return (
          <button
            key={module.id}
            type="button"
            data-module={module.id}
            className="tk-module-card w-full"
            onClick={() => onOpen?.(module.id)}
          >
            <Dot size={24} fill={ids.length === 0 ? 0 : mastered / ids.length} />
            <span className="min-w-0">
              <span className="block font-semibold">{t(module.name)}</span>
              <span className="block text-ink-2">
                {!module.built
                  ? t('soon.subtitle')
                  : started
                    ? t('home.setMastered', { goed: mastered, totaal: ids.length })
                    : t('home.setNew')}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

/**
 * The forecast, which is the number this product is for.
 *
 * It is what a child will still know in three weeks, not what they got right
 * today — and the sentence under it says so, because the two are easy to
 * confuse and only one of them is worth practising for.
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
    <section className="flex flex-col gap-2" aria-label={t('home.rememberTitle')}>
      <h2 className="tk-label">{t('home.rememberTitle')}</h2>

      {started ? (
        <>
          <div className="flex items-center gap-4">
            <Dot size={40} fill={procent / 100} />
            <div className="min-w-0">
              <p className="tk-display text-h1 font-bold tabular-nums">{`${procent}%`}</p>
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
    <section className="flex flex-col gap-2" aria-label={t('home.stampsTitle')}>
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
