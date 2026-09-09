import { isDue, type ItemState, type ModeId, type Schedulable } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { isMix, loadSumSet, loadSumSets, MIX_IDS } from '@/content/loadSums';
import { t, type TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';
import type { PlayedRound } from '@/store/progress';
import { MIX_SET_ID, SET_IDS, type PracticeMode, type SetId } from '@/features/practice/useRound';
import type { SumMode } from '@/features/sums/useSumRound';

/**
 * Every set of every built module, and the subjects they are grouped under.
 *
 * This was the top of `HomeScreen`, and it moved because it stopped being the
 * front door's private business: a module page asks the same three questions of
 * a set that K1 does — how much of it is remembered, when was it last touched,
 * what would a round of it look like — and a second copy of those three is a
 * second place to forget a module.
 *
 * **Two layers, since rekenen grew past the tables (ADR-062).** An *onderdeel*
 * is a set: ten sums, twelve provinces, the thing a round is made of. An
 * *onderwerp* is what step 1 offers: "Tafels", "Provincies", "Rekenmix". Where
 * a subject holds one set the two are the same thing and the page shows one
 * card. Where it holds thirteen — the twelve tables and all of them at once —
 * the page shows one card and asks which, because twelve cards for one subject
 * is a page a child scrolls past rather than reads, and it pushed step 2 off
 * the screen on the page whose whole argument is that the two steps are one
 * flow (ADR-061 gives step 2 the same ceiling for the same reason).
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

/**
 * How many sums a child has to have got wrong before "oefen je fouten" appears.
 *
 * Below this it is not a subject, it is a list — and a card offering three sums
 * is a card that is finished in twenty seconds and then sits there empty. It
 * also spares a child their very first mistake being turned into a heading
 * about them.
 */
export const MIN_FOUTEN = 5;

export interface Onderdeel {
  readonly moduleId: Module['id'];
  readonly setId: string;
  readonly naam: TranslationKey | null;
  readonly literalNaam: string | null;
  /**
   * The label on the chip when this set is one choice among several — "7" under
   * Tafels, "tot 100" under Plussommen. The full name is still the accessible
   * name of the chip: "7" on its own is not something a screen reader can make
   * a sentence of.
   */
  readonly kortNaam: string | null;
  /**
   * True where this set is the union of others rather than one of its own.
   *
   * It matters wherever sets are counted or compared: a mix holds every item
   * there is, so it is the biggest set, the one with the most due, and the one
   * a naive "which needs doing most" would pick every single time.
   */
  readonly mix: boolean;
  readonly items: readonly Schedulable[];
  readonly roundSize: number;
}

/**
 * A subject: what step 1 offers, and the sets under it.
 *
 * Six at most per section, which is the same ceiling step 2 has and for the
 * same reason — past six a grid stops being one glance.
 */
export interface Onderwerp {
  readonly moduleId: Module['id'];
  readonly id: string;
  readonly naam: TranslationKey;
  /** One line under the name, where the name alone does not say what is in it. */
  readonly uitleg: TranslationKey | null;
  /** The question above the chips. Null for a subject that is one set. */
  readonly keuze: TranslationKey | null;
  readonly sets: readonly Onderdeel[];
}

// ---------------------------------------------------------------------------
// Topografie

function topoOnderdelen(): Onderdeel[] {
  // In the curated order, not the order the filenames sort in. It decides what
  // a child who has never practised is offered first, and that should be the
  // set the content calls the way in — provinces — rather than whichever JSON
  // file happens to come first in the alphabet.
  const sets = loadItemSets();

  return SET_IDS.map((id) => sets.find((set) => set.id === id))
    .filter((set): set is (typeof sets)[number] => set !== undefined)
    .map((set) => ({
      moduleId: 'topo' as const,
      setId: set.id,
      naam: SET_NAME_KEY[set.id as SetId] ?? null,
      literalNaam: null,
      kortNaam: null,
      mix: false,
      items: set.items as readonly Schedulable[],
      roundSize: ROUND_SIZE.topo,
    }));
}

/**
 * Everything on the map at once.
 *
 * The same items under a second name rather than a sixth set of them, so a
 * province answered here moves the box it moves anywhere else. It is not
 * counted as part of the module's total anywhere, because that total would then
 * count every province twice (`onderdelen` leaves the mixes out).
 */
function topoMix(): Onderdeel {
  const items = topoOnderdelen().flatMap((deel) => deel.items);

  return {
    moduleId: 'topo',
    setId: MIX_SET_ID,
    naam: 'set.nl-mix',
    literalNaam: null,
    kortNaam: null,
    mix: true,
    items,
    roundSize: ROUND_SIZE.topo,
  };
}

// ---------------------------------------------------------------------------
// Rekenen

/** The name of a set of sums, and the short label on its chip. */
function rekenNaam(setId: string): { naam: string; kort: string } {
  const tafel = /^tafel-(\d+)$/.exec(setId)?.[1];
  if (tafel) return { naam: t('sums.table', { tafel }), kort: tafel };

  const deel = /^deel-(\d+)$/.exec(setId)?.[1];
  if (deel) return { naam: t('sums.divideBy', { tafel: deel }), kort: deel };

  const bereik = /^(plus|min)-(\d+)$/.exec(setId);
  const grens = bereik?.[2];
  if (bereik && grens) {
    const key = bereik[1] === 'plus' ? 'sums.plusUpTo' : 'sums.minusUpTo';
    return { naam: t(key, { grens }), kort: t('sums.upTo', { grens }) };
  }

  if (setId === 'tafels-alle') return { naam: t('sums.allTables'), kort: t('sums.allShort') };
  if (setId === 'deel-alle') return { naam: t('sums.allDivides'), kort: t('sums.allShort') };
  if (setId === 'fouten') return { naam: t('sums.mistakes'), kort: t('sums.mistakes') };

  // The Rekenmix in three difficulties and an everything. The level is the one
  // every set already carried and nothing else ever read out loud: one is a
  // rule you can say, three is the tables that get learned last (ADR-073).
  const mixNiveau = /^rekenmix-(\d)$/.exec(setId)?.[1];
  if (mixNiveau) {
    return {
      naam: t(`sums.mixLevel${mixNiveau}` as TranslationKey),
      kort: t(`sums.mixLevel${mixNiveau}.kort` as TranslationKey),
    };
  }

  return { naam: t('sums.mix'), kort: t('sums.allShort') };
}

function rekenOnderdeel(setId: string): Onderdeel | null {
  const set = loadSumSet(setId);
  if (!set) return null;
  const { naam, kort } = rekenNaam(setId);

  return {
    moduleId: 'tafels',
    setId,
    naam: null,
    literalNaam: naam,
    kortNaam: kort,
    mix: isMix(setId),
    items: set.items as readonly Schedulable[],
    roundSize: ROUND_SIZE.tafels,
  };
}

function rekenOnderdelen(): Onderdeel[] {
  return loadSumSets()
    .map((set) => rekenOnderdeel(set.id))
    .filter((deel): deel is Onderdeel => deel !== null);
}

function rekenMixen(): Onderdeel[] {
  return MIX_IDS.map((id) => rekenOnderdeel(id)).filter((deel): deel is Onderdeel => deel !== null);
}

// ---------------------------------------------------------------------------

/**
 * Every set that is a set of its own: the unit progress is counted over.
 *
 * The mixes are deliberately absent. They hold the same items under a second
 * name, and a total that added them would tell a child there are a thousand
 * sums in rekenen and that they remember four hundred of a set of ten.
 */
export function onderdelen(): Onderdeel[] {
  return [...topoOnderdelen(), ...rekenOnderdelen()];
}

/** Every set a round can be started on, mixes included. Used to name a round. */
export function startbareOnderdelen(): Onderdeel[] {
  return [...topoOnderdelen(), topoMix(), ...rekenOnderdelen(), ...rekenMixen()];
}

/**
 * The subjects a module offers, in the order a child should meet them.
 *
 * Topography is five sets and a mix of them, one subject each. Rekenen is four
 * kinds of sum and a mix of all four, and two of those four hold thirteen sets
 * apiece.
 */
export function onderwerpenVan(
  moduleId: Module['id'],
  known: ReadonlyMap<string, ItemState> = new Map(),
): Onderwerp[] {
  if (moduleId === 'topo') {
    const enkel: Onderwerp[] = topoOnderdelen().map((deel) => ({
      moduleId: 'topo' as const,
      id: deel.setId,
      naam: deel.naam as TranslationKey,
      uitleg: null,
      keuze: null,
      sets: [deel],
    }));

    return [
      ...enkel,
      {
        moduleId: 'topo',
        id: MIX_SET_ID,
        naam: 'set.nl-mix',
        uitleg: 'set.nl-mix.uitleg',
        keuze: null,
        sets: [topoMix()],
      },
    ];
  }

  if (moduleId !== 'tafels') return [];

  const sets = rekenOnderdelen();
  const mix = rekenMixen();
  const van = (prefix: string) => sets.filter((deel) => deel.setId.startsWith(prefix));
  const mixMet = (id: string) => mix.filter((deel) => deel.setId === id);

  return [
    {
      moduleId: 'tafels',
      id: 'tafels',
      naam: 'onderwerp.tafels',
      uitleg: 'onderwerp.tafels.uitleg',
      keuze: 'onderwerp.tafels.keuze',
      sets: [...van('tafel-'), ...mixMet('tafels-alle')],
    },
    {
      moduleId: 'tafels',
      id: 'delen',
      naam: 'onderwerp.delen',
      uitleg: 'onderwerp.delen.uitleg',
      keuze: 'onderwerp.delen.keuze',
      sets: [...van('deel-'), ...mixMet('deel-alle')],
    },
    {
      moduleId: 'tafels',
      id: 'plus',
      naam: 'onderwerp.plus',
      uitleg: 'onderwerp.plus.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      sets: van('plus-'),
    },
    {
      moduleId: 'tafels',
      id: 'min',
      naam: 'onderwerp.min',
      uitleg: 'onderwerp.min.uitleg',
      keuze: 'onderwerp.bereik.keuze',
      sets: van('min-'),
    },
    {
      moduleId: 'tafels',
      id: 'rekenmix',
      naam: 'onderwerp.rekenmix',
      uitleg: 'onderwerp.rekenmix.uitleg',
      keuze: 'onderwerp.rekenmix.keuze',
      sets: [
        ...mixMet('rekenmix-1'),
        ...mixMet('rekenmix-2'),
        ...mixMet('rekenmix-3'),
        ...mixMet('rekenmix'),
      ],
    },
    // Last, and only when there is something in it. It is not a kind of sum —
    // it is this child's own list, and it belongs after the four kinds and the
    // mix rather than competing with them for the way in (ADR-078).
    ...foutenOnderwerp(known),
  ];
}

/**
 * "Oefen je fouten": the sums this child has got wrong, as a subject.
 *
 * The Leitner scheduler has always put what a child keeps missing at the front
 * of a round. What it could not do is be asked: a child who knows perfectly
 * well which sums they keep getting wrong had no way to say so. This is that
 * button, and it is the only subject in the product that is different for every
 * child.
 *
 * Absent rather than empty when there is nothing in it, and absent until the
 * boxes have been read — a card that says "0 sommen" is a card about nothing.
 */
function foutenOnderwerp(known: ReadonlyMap<string, ItemState>): Onderwerp[] {
  const alles = rekenOnderdeel('fouten');
  if (!alles) return [];

  const fout = alles.items.filter((item) => (known.get(item.id)?.foutCount ?? 0) > 0);
  if (fout.length < MIN_FOUTEN) return [];

  return [
    {
      moduleId: 'tafels',
      id: 'fouten',
      naam: 'onderwerp.fouten',
      uitleg: 'onderwerp.fouten.uitleg',
      keuze: null,
      sets: [{ ...alles, items: fout }],
    },
  ];
}

/** Which subject a set belongs to, so an address for a set opens the right card. */
export function onderwerpVan(onderwerpen: readonly Onderwerp[], setId: string): Onderwerp | null {
  return onderwerpen.find((vak) => vak.sets.some((deel) => deel.setId === setId)) ?? null;
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
export function opDeRol(deel: Onderdeel, known: ReadonlyMap<string, ItemState>, now: Date): number {
  return deel.items.filter((item) => {
    const state = known.get(item.id);
    return state ? isDue(state, now) : false;
  }).length;
}

/** The whole of a subject, counted over its sets and never over its mix. */
export function itemsVan(onderwerp: Onderwerp): readonly string[] {
  const ids = new Set<string>();
  for (const deel of onderwerp.sets) {
    if (deel.mix && onderwerp.sets.length > 1) continue;
    for (const item of deel.items) ids.add(item.id);
  }
  return [...ids];
}

/**
 * Which set a played round was about.
 *
 * A round says so itself now (ADR-063). It did not always: rows written before
 * that carry only the questions they asked, so those are still matched on the
 * questions — one shared item is enough, because no two sets that are files
 * share an item. What that fallback cannot do is recognise a mix, which holds
 * every set's items and would always match the first one; a mix played before
 * the round recorded its own set therefore reads as the set it started from,
 * which is wrong and unfixable and was true of exactly one release.
 */
export function setVanRonde(ronde: PlayedRound, alles: readonly Onderdeel[]): Onderdeel | null {
  if (ronde.setId !== null) {
    const genoemd = alles.find((deel) => deel.setId === ronde.setId);
    if (genoemd) return genoemd;
  }

  const asked = new Set(ronde.itemIds);
  return alles.find((deel) => deel.items.some((item) => asked.has(item.id))) ?? null;
}

/** A round that has been placed: which set, in which way, and how it went. */
export interface Gespeeld {
  readonly deel: Onderdeel;
  readonly ronde: PlayedRound;
}

export function geplaatst(rondes: readonly PlayedRound[], alles: readonly Onderdeel[]): Gespeeld[] {
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
const SUM_MODES: readonly ModeId[] = [
  'som-typen',
  'som-meerkeuze',
  'bliksemronde',
  'overleven',
  'tafeldiploma',
];

export function asPracticeMode(mode: ModeId): PracticeMode {
  return PRACTICE_MODES.includes(mode) ? (mode as PracticeMode) : 'wijs-aan';
}

export function asSumMode(mode: ModeId): SumMode {
  return SUM_MODES.includes(mode) ? (mode as SumMode) : 'som-typen';
}
