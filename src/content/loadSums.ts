import type { SumItem, SumSet } from '@/game-core';

/**
 * Rekenen's content, at build time: twelve tables, twelve sets of division
 * facts, and plus and minus in three ranges each.
 *
 * Bundled like the geography sets and unlike the geometry: five hundred sums is
 * a few kilobytes, and a round has to be able to start without waiting for
 * anything.
 *
 * Written by tools/content/build-rekenen.mjs. Generated, so a hand correction
 * here is lost at the next run — and `sums.content.test.ts` works every entry
 * back out, which is what stands in for an editor.
 *
 * **The mixes are not files.** "Alle tafels door elkaar" and the Rekenmix are
 * the union of the sets above, composed here from the same items, so answering
 * 7 × 8 in a mix moves the same Leitner box as answering it in the table. A
 * mix written out as its own file would have had to give those sums second ids,
 * and a child would then have had to learn every table twice over to fill both
 * (ADR-062).
 */

const tafelModules = import.meta.glob<{ default: SumSet }>('../../content/tafels/*.json', {
  eager: true,
});
const somModules = import.meta.glob<{ default: SumSet }>('../../content/sommen/*.json', {
  eager: true,
});

/** The ids of the sets that are unions rather than files. */
export const MIX_IDS = ['tafels-alle', 'deel-alle', 'rekenmix'] as const;
export type MixId = (typeof MIX_IDS)[number];

function bestanden(): SumSet[] {
  return [...Object.values(tafelModules), ...Object.values(somModules)].map(
    (module) => module.default,
  );
}

/**
 * Every set that is a file, in the order a child meets them: tables first by
 * table, then the division facts by table, then plus and minus by range.
 *
 * Ordered here rather than left to the filenames, which sort `tafel-10` before
 * `tafel-2` and would offer a child the tables in an order nobody teaches.
 */
export function loadSumSets(): SumSet[] {
  const rang: Record<string, number> = { keer: 0, delen: 1, plus: 2, min: 3 };
  // Which table, or which ceiling — the number at the end of the id either
  // way. Sorted as a number rather than as text, because "plus-1000" sorts
  // between "plus-100" and "plus-20" in every alphabet there is, and a child
  // offered 100, 1000, 20 in that order is looking at a bug.
  const orde = (set: SumSet) => set.tafel ?? Number(/-(\d+)$/.exec(set.id)?.[1] ?? 0);

  return bestanden().sort(
    (a, b) => (rang[a.op ?? ''] ?? 9) - (rang[b.op ?? ''] ?? 9) || orde(a) - orde(b),
  );
}

function unie(id: MixId, sets: readonly SumSet[]): SumSet {
  return {
    id,
    op: null,
    tafel: null,
    niveau: 1,
    contentVersie: sets[0]?.contentVersie ?? '',
    items: sets.flatMap((set) => set.items),
  };
}

/**
 * The sets a mix draws from. `null` for a set that is a file, which draws from
 * itself.
 */
function mixLeden(id: MixId, alles: readonly SumSet[]): SumSet[] {
  if (id === 'tafels-alle') return alles.filter((set) => set.op === 'keer');
  if (id === 'deel-alle') return alles.filter((set) => set.op === 'delen');
  return [...alles];
}

export function isMix(id: string): id is MixId {
  return (MIX_IDS as readonly string[]).includes(id);
}

export function loadSumSet(id: string): SumSet | undefined {
  const alles = loadSumSets();
  if (isMix(id)) {
    return unie(id, mixLeden(id, alles));
  }
  return alles.find((set) => set.id === id);
}

/**
 * The pool a round without a fixed length draws from: everything of the same
 * kind as the set that was chosen.
 *
 * Ten sums is over long before a minute is, so a lightning round of the table
 * of seven has to reach past those ten. It reaches to the other tables and no
 * further — a child who asks for a minute of tables should not be handed
 * "845 − 140" halfway through. A mix already spans everything it means to, so
 * it draws from itself.
 */
export function sumPool(id: string): readonly SumItem[] {
  const alles = loadSumSets();
  if (isMix(id)) return loadSumSet(id)?.items ?? [];

  const set = alles.find((candidate) => candidate.id === id);
  if (!set) return [];
  return alles
    .filter((candidate) => candidate.op === set.op)
    .flatMap((candidate) => candidate.items);
}
