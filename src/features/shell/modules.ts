import type { TranslationKey } from '@/i18n';

/**
 * The modules, in the order of ADR-029, and the destinations of the tab bar.
 *
 * Both are data. The rail renders whatever is in this array and an eighth
 * module is a row here plus a block of CSS for its accent — no component
 * changes, which is the whole reason `--accent` is resolved from `data-module`
 * rather than named at a call site.
 *
 * `built` is not a feature flag. A flag hides finished work; this says the work
 * does not exist. ADR-037: the rail shows the modules that have content, which
 * today is two. Five greyed-out entries would follow the design and be five
 * promises the app does not keep, on the screen a child sees first.
 */

export interface Module {
  /** Matches a [data-module] block in index.css, which resolves its accent. */
  readonly id: 'topo' | 'tafels' | 'klok' | 'woorden' | 'spelling' | 'tijdvakken' | 'vlaggen';
  readonly name: TranslationKey;
  readonly built: boolean;
}

/**
 * Business plan v6 §5.5, and not the design's order: clock reading is third,
 * where the plan puts it, rather than appended after the modules that already
 * existed. The order is a statement about what the product is for, and the
 * newest module does not belong where a child stops looking.
 */
export const MODULES: readonly Module[] = [
  { id: 'topo', name: 'module.topo', built: true },
  { id: 'tafels', name: 'module.tafels', built: true },
  { id: 'klok', name: 'module.klok', built: false },
  { id: 'woorden', name: 'module.woorden', built: false },
  { id: 'spelling', name: 'module.spelling', built: false },
  { id: 'tijdvakken', name: 'module.tijdvakken', built: false },
  { id: 'vlaggen', name: 'module.vlaggen', built: false },
];

export const BUILT_MODULES = MODULES.filter((module) => module.built);

/**
 * A category groups modules that a parent would look for under one word.
 *
 * There is one, and its shape is the point: **tafels belongs under rekenen,
 * klokkijken does not.** Telling the time is not arithmetic — it is reading an
 * instrument — and business plan v6 already split them into two modules with
 * two entrances and two accents (ADR-028). This keeps that split and adds the
 * word an adult actually types.
 *
 * Categories are for addresses, not for the rail. The rail lists modules,
 * because a module is what a child practises; nobody practises "rekenen".
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
 * The four places the tab bar goes on a phone.
 *
 * Same rule as the rail: a destination that does not exist is not offered. Two
 * of these need the friend layer and a backend (ADR-015), and one is step 6.
 */
export interface Destination {
  readonly id: 'vandaag' | 'onthouden' | 'vrienden' | 'jij';
  readonly name: TranslationKey;
  readonly built: boolean;
}

export const DESTINATIONS: readonly Destination[] = [
  { id: 'vandaag', name: 'nav.vandaag', built: true },
  { id: 'onthouden', name: 'nav.onthouden', built: true },
  { id: 'vrienden', name: 'nav.vrienden', built: false },
  { id: 'jij', name: 'nav.jij', built: true },
];

export const BUILT_DESTINATIONS = DESTINATIONS.filter((destination) => destination.built);

/**
 * Navigation with one destination is not navigation.
 *
 * It is a label that cannot be pressed, taking 56px off the bottom of every
 * screen on the smallest device in the range. So the bar appears when there is
 * somewhere to go, and until then the screen is the screen.
 */
export const NAVIGATION_MINIMUM = 2;
