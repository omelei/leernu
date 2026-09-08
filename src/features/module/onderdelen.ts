import { isDue, type ItemState, type ModeId, type Schedulable } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadSumSets } from '@/content/loadSums';
import { t, type TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';
import type { PlayedRound } from '@/store/progress';
import { SET_IDS, type PracticeMode, type SetId } from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';

/**
 * Every set of every built module, flattened, and what can be said about one.
 *
 * This was the top of `HomeScreen`, and it moved because it stopped being the
 * front door's private business: a module page asks the same three questions of
 * a set that K1 does — how much of it is remembered, when was it last touched,
 * what would a round of it look like — and a second copy of those three is a
 * second place to forget a module.
 *
 * One list rather than a branch per module. A set is a name, some items and a
 * round size; the fact that one of them is drawn on a map and another is ten
 * sums belongs to the round and not to the list of them.
 */

export const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
};

/** What one round of this set asks. Topography samples large sets; a table is whole. */
export const ROUND_SIZE = { topo: 15, tafels: 10 } as const;

/** How many favourites the column on the right holds. */
export const FAVOURITES_SHOWN = 4;

export interface Onderdeel {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly naam: TranslationKey | null;
  readonly literalNaam: string | null;
  readonly items: readonly Schedulable[];
  readonly roundSize: number;
}

export function onderdelen(): Onderdeel[] {
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

/** The sets one module holds, in the order a child should meet them. */
export function onderdelenVan(moduleId: Module['id']): Onderdeel[] {
  return onderdelen().filter((deel) => deel.moduleId === moduleId);
}

export function naamVan(deel: Onderdeel): string {
  return deel.naam ? t(deel.naam) : (deel.literalNaam ?? '');
}

/** When this set was last answered, or null. Decides what "verder" means. */
export function laatstGeoefend(
  deel: Onderdeel,
  known: ReadonlyMap<string, ItemState>,
): string | null {
  let laatste: string | null = null;
  for (const item of deel.items) {
    const at = known.get(item.id)?.laatsteReview ?? null;
    if (at !== null && (laatste === null || at > laatste)) laatste = at;
  }
  return laatste;
}

/** How many of this set the scheduler has put on today's list. */
export function opDeRol(
  deel: Onderdeel,
  known: ReadonlyMap<string, ItemState>,
  now: Date,
): number {
  return deel.items.filter((item) => {
    const state = known.get(item.id);
    return state ? isDue(state, now) : false;
  }).length;
}

/**
 * Which set a played round was about.
 *
 * A session records the questions it asked and not the set they came from, so
 * this matches on the questions. One shared item is enough: no two sets share
 * an item, and a round of fifteen out of eighty still carries fifteen of them.
 */
export function setVanRonde(ronde: PlayedRound, alles: readonly Onderdeel[]): Onderdeel | null {
  const asked = new Set(ronde.itemIds);
  return alles.find((deel) => deel.items.some((item) => asked.has(item.id))) ?? null;
}

/** A round that has been placed: which set, in which way, and how it went. */
export interface Gespeeld {
  readonly deel: Onderdeel;
  readonly ronde: PlayedRound;
}

export function geplaatst(
  rondes: readonly PlayedRound[],
  alles: readonly Onderdeel[],
): Gespeeld[] {
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
export interface Favoriet {
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly keer: number;
  readonly at: string;
}

export function favorieten(gespeeld: readonly Gespeeld[]): Favoriet[] {
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

/**
 * A stored way of answering, narrowed back to the one its module can start.
 *
 * `ModeId` is every way there is across both modules, because that is what a
 * session records. Anything a module does not recognise falls back to the way
 * that module begins — which is never wrong, only sometimes not the one that
 * was asked for.
 */
const PRACTICE_MODES: readonly ModeId[] = [
  'wijs-aan',
  'meerkeuze',
  'hoe-heet-dit',
  'bliksemronde',
  'overleven',
];
const SUM_MODES: readonly ModeId[] = ['som-typen', 'som-meerkeuze', 'bliksemronde', 'overleven'];

export function asPracticeMode(mode: ModeId): PracticeMode {
  return PRACTICE_MODES.includes(mode) ? (mode as PracticeMode) : 'wijs-aan';
}

export function asSumMode(mode: ModeId): SumMode {
  return SUM_MODES.includes(mode) ? (mode as SumMode) : 'som-typen';
}
