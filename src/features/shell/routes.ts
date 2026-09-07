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
 * literal paths with no parameters, no nesting and no data loading, and the
 * rule against a new runtime dependency (build brief §0.2) is worth more than
 * the fifty lines this saves.
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

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'retention' }
  /** A module that exists. */
  | { readonly name: 'module'; readonly module: Module }
  /** A module the plan has but the product does not yet. */
  | { readonly name: 'soon'; readonly module: Module }
  /** A word a parent looks for, holding the modules that sit under it. */
  | { readonly name: 'category'; readonly category: Category };

export const RETENTION_SLUG = 'onthouden';

/**
 * Vite serves from `/` on a domain of our own and from `/<repo>/` on Pages
 * without one, so the base is stamped in at build time and stripped here.
 */
function withoutBase(pathname: string): string {
  const base = import.meta.env.BASE_URL;
  const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return path.replace(/^\/+|\/+$/g, '');
}

export function routeFor(pathname: string): Route {
  const slug = withoutBase(pathname);
  if (slug === '') return { name: 'home' };
  if (slug === RETENTION_SLUG) return { name: 'retention' };

  const module = MODULES.find((candidate) => MODULE_SLUG[candidate.id] === slug);
  if (module) return module.built ? { name: 'module', module } : { name: 'soon', module };

  const category = CATEGORIES.find((candidate) => candidate.id === slug);
  if (category) return { name: 'category', category };

  // Anything else is the front door. A child who mistypes a module gets the
  // place they can find one, not an error page about their spelling.
  return { name: 'home' };
}

export function pathFor(route: Route): string {
  const base = import.meta.env.BASE_URL;
  const slug =
    route.name === 'home'
      ? ''
      : route.name === 'retention'
        ? RETENTION_SLUG
        : route.name === 'category'
          ? route.category.id
          : MODULE_SLUG[route.module.id];
  return `${base}${slug}`.replace(/\/{2,}/g, '/');
}
