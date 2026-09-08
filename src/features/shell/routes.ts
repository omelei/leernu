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
  // The mix, on both modules, under the word a child would say. It is not a
  // file in either of them (ADR-062, ADR-063) and it still has an address,
  // because "ga naar leer.nu/rekenen/mix" is a sentence a parent can say.
  'nl-mix': 'mix',
  rekenmix: 'mix',
  'tafels-alle': 'alle-tafels',
  'deel-alle': 'alle-deelsommen',
};

const SLUG_SET = new Map(Object.entries(SET_SLUG).map(([id, slug]) => [slug, id]));

/**
 * The sets of rekenen that answer to their own name.
 *
 * One to twelve, times and divide, and three ranges each for plus and minus. A
 * thirteenth table is a typo, not a set, and so is "plus-50": a slug that does
 * not name something opens the module rather than an error page.
 */
const REKENEN_SLUG = /^(?:tafel|deel)-(?:[1-9]|1[0-2])$|^(?:plus|min)-(?:20|100|1000)$/;

export function setSlug(setId: string): string {
  return SET_SLUG[setId] ?? setId;
}

function setIdFor(module: Module, slug: string): string | null {
  if (module.id === 'tafels') {
    if (REKENEN_SLUG.test(slug)) return slug;
    if (slug === 'mix') return 'rekenmix';
    if (slug === 'alle-tafels') return 'tafels-alle';
    if (slug === 'alle-deelsommen') return 'deel-alle';
    return null;
  }
  return SLUG_SET.get(slug) ?? null;
}

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'retention' }
  | { readonly name: 'you' }
  /** A module that exists, opened on one of its sets or on its own first. */
  | { readonly name: 'module'; readonly module: Module; readonly setId: string | null }
  /** A module the plan has but the product does not yet. */
  | { readonly name: 'soon'; readonly module: Module }
  /** A word a parent looks for, holding more than one module. */
  | { readonly name: 'category'; readonly category: Category };

export const RETENTION_SLUG = 'onthouden';
export const YOU_SLUG = 'jij';

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
  if (slug === RETENTION_SLUG) return { name: 'retention' };
  if (slug === YOU_SLUG) return { name: 'you' };

  const [head = '', tail] = slug.split('/');

  const module = MODULES.find((candidate) => MODULE_SLUG[candidate.id] === head);
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
  if (route.name === 'retention') return RETENTION_SLUG;
  if (route.name === 'you') return YOU_SLUG;
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
