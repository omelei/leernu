import { loadVlagSet } from '@/content/loadVlaggen';
import { CATEGORIES, MODULES, type Category, type Module } from './modules';

/**
 * The paths, and why the app has any.
 *
 * `App.tsx` said a router would be furniture until there was more than one
 * module. There still is only one, but the reason has changed: a module now has
 * an address a child can be sent, and the styleguide builds on that — §A's
 * "leer.nu/topografie" is a lockup, and it reads as a sentence, which only works
 * if the path is real.
 *
 * Hand-rolled rather than a router package. The whole map is a handful of
 * literal paths with one optional segment, no data loading and no nesting worth
 * the name, and the rule against a new runtime dependency (build brief §0.2) is
 * worth more than the fifty lines this saves.
 *
 * Two things arrived after ADR-044 and both are about the word a parent types.
 * A **set has an address** — leer.nu/topografie/provincies — so a child can be
 * sent to one exercise rather than to a chooser. And a **category that holds
 * one built module is that module**: /rekenen opened onto a page with a single
 * card on it saying "Rekenen", which is a redirect wearing a hat. The category
 * survives in `modules.ts` for the day arithmetic is more than the tables; what
 * it no longer does is cost a child a click to say so.
 */

/** The path segment for each module. Dutch, and the word a child would type. */
export const MODULE_SLUG: Record<Module['id'], string> = {
  topo: 'topografie',
  tafels: 'tafels',
  klok: 'klokkijken',
  woorden: 'woordjes',
  spelling: 'spelling',
  tijdvakken: 'tijdvakken',
  vlaggen: 'vlaggen',
};

/**
 * The path segment for a set inside a module.
 *
 * The map sets carry a source prefix in their ids — `nl-provincies` — which is
 * right in a filename and wrong in an address: nobody types the country twice.
 * The tables already name themselves, so `tafel-7` is both the id and the word.
 */
const SET_SLUG: Record<string, string> = {
  'nl-provincies': 'provincies',
  'nl-hoofdsteden': 'hoofdsteden',
  'nl-waddeneilanden': 'waddeneilanden',
  'nl-wateren': 'wateren',
  'nl-steden': 'steden',
  // The countries, at the word a parent would type. Not "europa-landen": the
  // module is topography and the address already says so, so the second
  // segment only has to say which map.
  'europa-landen': 'europa',
  'afrika-landen': 'afrika',
  'azie-landen': 'azie',
  'noord-amerika-landen': 'noord-amerika',
  'zuid-amerika-landen': 'zuid-amerika',
  'oceanie-landen': 'oceanie',
  'wereld-landen': 'wereld',
  // The mix, on both modules, under the word a child would say. It is not a
  // file in either of them (ADR-062, ADR-063) and it still has an address,
  // because "ga naar leer.nu/rekenen/mix" is a sentence a parent can say.
  'nl-mix': 'mix',
  rekenmix: 'mix',
  'tafels-alle': 'alle-tafels',
  'deel-alle': 'alle-deelsommen',
  'rekenmix-1': 'mix-makkelijk',
  'rekenmix-2': 'mix-gemiddeld',
  'rekenmix-3': 'mix-pittig',
  fouten: 'fouten',
  // The clock, at the four words a teacher uses for the four steps. The ids
  // are short because they are ids; "leer.nu/klok/halve-uren" is what somebody
  // writes on a note.
  'klok-heel': 'hele-uren',
  'klok-half': 'halve-uren',
  'klok-kwart': 'kwartieren',
  'klok-vijf': 'vijf-minuten',
  'klok-mix': 'mix',
  // "Oefen je fouten" (ADR-103): for Nederland and the clock the one word,
  // further out the werelddeel in front of it, because each map has its own.
  'nl-fouten': 'fouten',
  'europa-fouten': 'europa-fouten',
  'afrika-fouten': 'afrika-fouten',
  'azie-fouten': 'azie-fouten',
  'noord-amerika-fouten': 'noord-amerika-fouten',
  'zuid-amerika-fouten': 'zuid-amerika-fouten',
  'oceanie-fouten': 'oceanie-fouten',
  'wereld-fouten': 'wereld-fouten',
  'klok-fouten': 'fouten',
};

/**
 * A second word a module answers to.
 *
 * "Klokkijken" is what the module is called and "klok" is what the rail says,
 * what a child says, and therefore what a parent types. That is the same
 * relationship /rekenen and /tafels have, one level up — a word people use and
 * a word the product uses — and it costs one row here to stop the shorter one
 * landing on the front door.
 *
 * Aliases go one way. `pathFor` still writes the module's own slug, so nothing
 * in the app links here; it is for an address somebody typed or wrote down.
 */
const MODULE_ALIAS: Record<string, Module['id']> = {
  klok: 'klok',
};

/** The map's own lists of mistakes, further out than Nederland ("nl-" covers home). */
const TOPO_FOUTEN = /^(?:europa|afrika|azie|noord-amerika|zuid-amerika|oceanie|wereld)-fouten$/;

/**
 * The way back, for the map sets only.
 *
 * `SET_SLUG` holds both modules, and both of them call their mix "mix" — which
 * is right in an address and fatal in one reverse lookup: built over the whole
 * table, `mix` resolved to whichever entry came last, and /topografie/mix
 * opened the Rekenmix. A slug means something inside a module, so the way back
 * from one belongs to that module. Rekenen answers for its own in `setIdFor`.
 */
const SLUG_SET = new Map(
  Object.entries(SET_SLUG)
    .filter(([id]) => id.startsWith('nl-') || id.endsWith('-landen') || TOPO_FOUTEN.test(id))
    .map(([id, slug]) => [slug, id]),
);

/**
 * The sets of rekenen that answer to their own name.
 *
 * One to twelve, times and divide, three ranges each for plus and minus, and two
 * for the keersommen past the tables. A thirteenth table is a typo, not a set,
 * and so is "plus-50": a slug that does not name something opens the module
 * rather than an error page.
 */
const REKENEN_SLUG =
  /^(?:tafel|deel)-(?:[1-9]|1[0-2])$|^(?:plus|min)-(?:20|100|1000)$|^keer-(?:100|1000)$/;

/**
 * Flags answer to where and what, in the order the page asks them —
 * leer.nu/vlaggen/europa-bekend — and the provinces to the one word a parent
 * would type. The set ids carry a `vlag-` prefix the address does not need.
 */
const VLAG_PROVINCIES = 'vlag-nederland-provincies';

export function setSlug(setId: string): string {
  if (setId === VLAG_PROVINCIES) return 'provincies';
  if (setId.startsWith('vlag-')) return setId.slice('vlag-'.length);
  return SET_SLUG[setId] ?? setId;
}

/** The rekenen slugs that are not a set id: the mixes and the child's own list. */
const REKENEN_MIX: Record<string, string> = {
  mix: 'rekenmix',
  'mix-makkelijk': 'rekenmix-1',
  'mix-gemiddeld': 'rekenmix-2',
  'mix-pittig': 'rekenmix-3',
  'alle-tafels': 'tafels-alle',
  'alle-deelsommen': 'deel-alle',
  fouten: 'fouten',
};

/** The way back for the clock. Its own map, for the reason `SLUG_SET` has one. */
const KLOK_SLUG: Record<string, string> = {
  'hele-uren': 'klok-heel',
  'halve-uren': 'klok-half',
  kwartieren: 'klok-kwart',
  'vijf-minuten': 'klok-vijf',
  mix: 'klok-mix',
  fouten: 'klok-fouten',
};

function setIdFor(module: Module, slug: string): string | null {
  if (module.id === 'tafels') {
    if (REKENEN_SLUG.test(slug)) return slug;
    return REKENEN_MIX[slug] ?? null;
  }
  if (module.id === 'klok') return KLOK_SLUG[slug] ?? null;
  if (module.id === 'vlaggen') {
    const id = slug === 'provincies' ? VLAG_PROVINCIES : `vlag-${slug}`;
    return loadVlagSet(id) ? id : null;
  }
  return SLUG_SET.get(slug) ?? null;
}

export type Route =
  /** Vandaag, the front door (S2). */
  | { readonly name: 'home' }
  /** Oefenen: every module, and the way into each (S3). */
  | { readonly name: 'oefenen' }
  /** Jij (S12). */
  | { readonly name: 'you' }
  /** The collection: twelve heroes in five materials (S11). */
  | { readonly name: 'verzameling' }
  /** A module that exists, opened on one of its sets or on its own first. */
  | { readonly name: 'module'; readonly module: Module; readonly setId: string | null }
  /** A module the plan has but the product does not yet. */
  | { readonly name: 'soon'; readonly module: Module }
  /** A word a parent looks for, holding more than one module. */
  | { readonly name: 'category'; readonly category: Category };

export const YOU_SLUG = 'jij';
/** The list of modules, the second of the four destinations (S3). */
export const OEFENEN_SLUG = 'oefenen';
/** The collection, the third of the four destinations (S11). */
export const VERZAMELING_SLUG = 'verzameling';
/**
 * Words that used to name a page and still answer, so an address somebody wrote
 * down keeps working. Nothing links to them.
 *
 * "voortgang" and "ontdekkingsreis" were the collection before it was one of
 * the four destinations. "onthouden" was a destination of its own, K9, and
 * the house style has no such page: the dot on every card says what it said,
 * so the word opens Vandaag.
 */
const OUDE_WOORDEN: Readonly<Record<string, Route>> = {
  voortgang: { name: 'verzameling' },
  ontdekkingsreis: { name: 'verzameling' },
  onthouden: { name: 'home' },
};

/**
 * Vite serves from `/` on a domain of our own and from `/<repo>/` on Pages
 * without one, so the base is stamped in at build time and stripped here.
 */
function withoutBase(pathname: string): string {
  const base = import.meta.env.BASE_URL;
  const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return path.replace(/^\/+|\/+$/g, '');
}

/** The modules under a category that a child can actually practise today. */
function builtUnder(category: Category): Module[] {
  return MODULES.filter((module) => module.built && category.modules.includes(module.id));
}

/** The category a module is currently the whole of, if there is one. */
function soleCategoryOf(module: Module): Category | null {
  return (
    CATEGORIES.find((category) => {
      const built = builtUnder(category);
      return built.length === 1 && built[0]?.id === module.id;
    }) ?? null
  );
}

function moduleRoute(module: Module, tail: string | undefined): Route {
  if (!module.built) return { name: 'soon', module };
  // A set nobody has heard of opens the module rather than an error page: the
  // child asked for topography and topography is what they get.
  const setId = tail === undefined || tail === '' ? null : setIdFor(module, tail);
  return { name: 'module', module, setId };
}

export function routeFor(pathname: string): Route {
  const slug = withoutBase(pathname);
  if (slug === '') return { name: 'home' };
  if (slug === YOU_SLUG) return { name: 'you' };
  if (slug === OEFENEN_SLUG) return { name: 'oefenen' };
  if (slug === VERZAMELING_SLUG) return { name: 'verzameling' };
  const oud = OUDE_WOORDEN[slug];
  if (oud) return oud;

  const [head = '', tail] = slug.split('/');

  const alias = MODULE_ALIAS[head];
  const module = MODULES.find(
    (candidate) => MODULE_SLUG[candidate.id] === head || candidate.id === alias,
  );
  if (module) return moduleRoute(module, tail);

  const category = CATEGORIES.find((candidate) => candidate.id === head);
  if (category) {
    const built = builtUnder(category);
    const only = built[0];
    if (built.length === 1 && only) return moduleRoute(only, tail);
    if (built.length > 1) return { name: 'category', category };
  }

  // Anything else is the front door. A child who mistypes a module gets the
  // place they can find one, not an error page about their spelling.
  return { name: 'home' };
}

function slugFor(route: Route): string {
  if (route.name === 'home') return '';
  if (route.name === 'you') return YOU_SLUG;
  if (route.name === 'oefenen') return OEFENEN_SLUG;
  if (route.name === 'verzameling') return VERZAMELING_SLUG;
  if (route.name === 'category') return route.category.id;
  if (route.name === 'soon') return MODULE_SLUG[route.module.id];

  // The word a parent types wins where there is one: the tables are the whole
  // of rekenen today, so /rekenen is their address and /tafels is a synonym
  // that keeps working for anyone who wrote it down.
  const head = soleCategoryOf(route.module)?.id ?? MODULE_SLUG[route.module.id];
  return route.setId === null ? head : `${head}/${setSlug(route.setId)}`;
}

export function pathFor(route: Route): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${slugFor(route)}`.replace(/\/{2,}/g, '/');
}

/*
 * There used to be an `addressFor` here, and the app bar printed what it
 * returned beside the wordmark: "leer.nu" + "/rekenen". It is gone (ADR-068).
 *
 * The addresses are real and that has not changed — a set still has one, the
 * router still reads it, and a parent can still write one down. What the app
 * bar was doing was reading the current one back to a child who had just
 * arrived by pressing something, in a spelling nobody says out loud, in the
 * one strip of the screen where width is worth the most. A page that says
 * where you are twice — once in the rail, once in the heading — does not need
 * a third.
 */
