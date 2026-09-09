import type { TranslationKey } from '@/i18n';
import type { Module } from '@/features/shell/modules';

/**
 * Where on the map, which is the first question topography has to ask.
 *
 * Step 1 used to offer five named sets in a flat list — "Provincies van
 * Nederland", "Hoofdsteden van de provincies", "Steden van Nederland" — and
 * every one of them said where it was in its own name. Five cards that each
 * repeat the same word are five cards a child reads instead of scans, and the
 * moment there are countries of Europe as well the list is nine and the word
 * is doing the work a heading should be doing.
 *
 * So the page asks the coarse question first: **Wereld, Europa, Nederland.**
 * Then what — provincies, steden, wateren, eilanden, mix — in one word each,
 * because the region above has already said the rest. Then how, which is step
 * 2 and has not moved (ADR-083).
 *
 * **Two of the three do not exist yet and say so.** That is the same promise
 * the rail makes about klokkijken and vlaggen (ADR-051): a child who can see
 * that the countries of Europe are coming is reading a plan, and a region that
 * is not built is not dressed up as one that is. What it must never do is open
 * onto nothing, so it cannot be pressed at all.
 */
export interface Regio {
  readonly id: 'wereld' | 'europa' | 'nederland';
  readonly naam: TranslationKey;
  /** Whether there are sets behind it today. */
  readonly built: boolean;
}

export const TOPO_REGIOS: readonly Regio[] = [
  { id: 'wereld', naam: 'regio.wereld', built: false },
  { id: 'europa', naam: 'regio.europa', built: false },
  { id: 'nederland', naam: 'regio.nederland', built: true },
];

/**
 * The regions a module divides its subjects by, or none.
 *
 * Only topography has any, and the shape is a list rather than a flag so that
 * rekenen — which has no geography to divide — simply gets an empty one and
 * the page draws no row. A module with one region would draw a row of one,
 * which is a label you cannot press, so the row waits for two.
 */
export function regiosVan(moduleId: Module['id']): readonly Regio[] {
  return moduleId === 'topo' ? TOPO_REGIOS : [];
}

/** The region that has sets behind it, which is where the page opens. */
export function eersteRegio(regios: readonly Regio[]): Regio['id'] | null {
  return regios.find((regio) => regio.built)?.id ?? null;
}
