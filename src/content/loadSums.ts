import type { SumSet } from '@/game-core';

/**
 * The twelve tables, at build time.
 *
 * Bundled like the geography sets and unlike the geometry: a hundred and twenty
 * sums is a few kilobytes, and a round has to be able to start without waiting
 * for anything.
 *
 * Written by tools/content/build-tafels.mjs. Generated, so a hand correction
 * here is lost at the next run — and `sums.content.test.ts` multiplies every
 * entry back out, which is what stands in for an editor.
 */

const modules = import.meta.glob<{ default: SumSet }>('../../content/tafels/*.json', {
  eager: true,
});

/** Ordered by table, because that is the order a child meets them in. */
export function loadSumSets(): SumSet[] {
  return Object.values(modules)
    .map((module) => module.default)
    .sort((a, b) => a.tafel - b.tafel);
}

export function loadSumSet(id: string): SumSet | undefined {
  return loadSumSets().find((set) => set.id === id);
}
