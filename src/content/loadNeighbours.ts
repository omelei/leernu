/**
 * Who lies next to whom.
 *
 * Bundled rather than fetched, unlike the geometry: this is a few hundred ids
 * and the multiple-choice round needs it before it can draw its first question,
 * so a request would be a network round trip in the way of a child answering.
 *
 * Written by tools/content/build-neighbours.mjs from the geodata (ADR-036). It
 * is generated, so a hand correction here is lost at the next run.
 */

export type NeighbourRule = 'grens' | 'afstand';

export interface NeighbourSet {
  readonly setId: string;
  readonly contentVersie: string;
  /** Which of ADR-036's two rules made this list. */
  readonly regel: NeighbourRule;
  /** Item id to its neighbours, nearest or most-bordering first. */
  readonly buren: Readonly<Record<string, readonly string[]>>;
}

const modules = import.meta.glob<{ default: NeighbourSet }>('../../content/buren/*.json', {
  eager: true,
});

export function loadNeighbourSets(): NeighbourSet[] {
  return Object.values(modules).map((module) => module.default);
}

/**
 * Every item's neighbours in one map.
 *
 * Item ids are unique across sets — content.test.ts holds that line — so one
 * map is enough and a caller never has to know which set an item came from.
 */
export function loadNeighbours(): Map<string, readonly string[]> {
  const all = new Map<string, readonly string[]>();
  for (const set of loadNeighbourSets()) {
    for (const [id, buren] of Object.entries(set.buren)) all.set(id, buren);
  }
  return all;
}
