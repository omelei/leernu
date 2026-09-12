import type { TranslationKey } from '@/i18n';

/**
 * The modules, in the order of ADR-029, and the four destinations of the rail.
 *
 * Both are data. The page Oefenen lists whatever is in the module array, and an
 * eighth module is a row here plus a tint in tokens.css — no component changes,
 * which is the whole reason a tint is resolved from `data-module` rather than
 * named at a call site.
 *
 * `built` is not a feature flag. A flag hides finished work; this says the work
 * does not exist. It decides what a module's address does — an unbuilt one
 * answers with "nog niet gebouwd" rather than a round.
 */

export interface Module {
  /** Matches a [data-module] block in tokens.css, which resolves its tint. */
  readonly id: 'topo' | 'tafels' | 'klok' | 'woorden' | 'spelling' | 'tijdvakken' | 'vlaggen';
  /** The short word, where a module is one of many on a line. */
  readonly name: TranslationKey;
  /** The whole name, as S3 and a module's own page write it. */
  readonly naam: TranslationKey;
  /** What is in it, in one line under its name on Oefenen (S3). */
  readonly sub: TranslationKey;
  readonly built: boolean;
}

/**
 * Business plan v6 §5.5, which is also the order S3 draws: topography,
 * tables, the clock, then the four under taal and the flags.
 */
export const MODULES: readonly Module[] = [
  {
    id: 'topo',
    name: 'module.topo',
    naam: 'oefenen.naam.topo',
    sub: 'oefenen.sub.topo',
    built: true,
  },
  {
    id: 'tafels',
    name: 'module.tafels',
    naam: 'oefenen.naam.tafels',
    sub: 'oefenen.sub.tafels',
    built: true,
  },
  {
    id: 'klok',
    name: 'module.klok',
    naam: 'oefenen.naam.klok',
    sub: 'oefenen.sub.klok',
    built: true,
  },
  {
    id: 'woorden',
    name: 'module.woorden',
    naam: 'oefenen.naam.woorden',
    sub: 'oefenen.nietGebouwd',
    built: false,
  },
  {
    id: 'spelling',
    name: 'module.spelling',
    naam: 'oefenen.naam.spelling',
    sub: 'oefenen.nietGebouwd',
    built: false,
  },
  {
    id: 'tijdvakken',
    name: 'module.tijdvakken',
    naam: 'oefenen.naam.tijdvakken',
    sub: 'oefenen.nietGebouwd',
    built: false,
  },
  {
    id: 'vlaggen',
    name: 'module.vlaggen',
    naam: 'oefenen.naam.vlaggen',
    sub: 'oefenen.sub.vlaggen',
    built: true,
  },
];

export const BUILT_MODULES = MODULES.filter((module) => module.built);

/**
 * The five entrances the front door lists under "Verder oefenen": the ones the
 * product is planned around. Spelling and tijdvakken sit under taal.
 */
export const RAIL_MODULES = MODULES.filter((module) =>
  (['topo', 'tafels', 'woorden', 'klok', 'vlaggen'] as const).some((id) => id === module.id),
);

/**
 * A category groups modules that a parent would look for under one word.
 *
 * There is one, and its shape is the point: **tafels belongs under rekenen,
 * klokkijken does not.** Telling the time is not arithmetic — it is reading an
 * instrument. Categories are for addresses, not for navigation.
 */
export interface Category {
  readonly id: 'rekenen';
  readonly name: TranslationKey;
  readonly modules: readonly Module['id'][];
}

export const CATEGORIES: readonly Category[] = [
  { id: 'rekenen', name: 'category.rekenen', modules: ['tafels'] },
];

/**
 * The four places the rail goes (README; stap 7, point 12): Vandaag, Oefenen,
 * Verzameling, Jij. The same four at every width — the rail from a tablet on
 * its side up, the tab bar below it — and never both at once.
 *
 * Which screen each one is, from stap 2: Vandaag is S2, the front door;
 * Oefenen is S3, the list of modules ("Waar wil je in oefenen?"); Verzameling
 * is S11; Jij is S12. The VO guise will put "Duels" in the third place
 * (stap 11); that is out of scope.
 */
export interface Destination {
  readonly id: 'vandaag' | 'oefenen' | 'verzameling' | 'jij';
  readonly name: TranslationKey;
}

export const DESTINATIONS: readonly Destination[] = [
  { id: 'vandaag', name: 'nav.vandaag' },
  { id: 'oefenen', name: 'nav.oefenen' },
  { id: 'verzameling', name: 'nav.verzameling' },
  { id: 'jij', name: 'nav.jij' },
];
