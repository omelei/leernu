import type { KlokItem, KlokSet } from '@/game-core';

/**
 * Klokkijken's content, at build time: four steps and a hundred and
 * forty-four faces.
 *
 * Bundled like the sums and unlike the geometry. A hundred and forty-four times
 * is under three kilobytes, and a round has to be able to start without waiting
 * for anything.
 *
 * Written by tools/content/build-klok.mjs. Generated, so a hand correction here
 * is lost at the next run — and `klok.content.test.ts` works every entry back
 * out, which is what stands in for an editor.
 *
 * **The mix is not a file.** "Alle tijden door elkaar" is the union of the four
 * sets, composed here from the same items, so half past seven answered in the
 * mix moves the same Leitner box as half past seven answered under "halve
 * uren". A mix written out as its own file would have had to give those faces
 * second ids, and a child would then have had to learn the clock twice over to
 * fill both (ADR-062, in the module it was written for).
 */

const modules = import.meta.glob<{ default: KlokSet }>('../../content/klok/*.json', {
  eager: true,
});

/** The id of the set that is a union rather than a file. */
export const KLOK_MIX_ID = 'klok-mix';

/**
 * The four, in the order a child meets them: whole hours, half hours, quarters,
 * then the five-minute steps.
 *
 * Ordered here rather than left to the filenames, which sort `klok-half` before
 * `klok-heel` and would offer a child half past before they had met the hour.
 */
const VOLGORDE = ['klok-heel', 'klok-half', 'klok-kwart', 'klok-vijf'];

export function loadKlokSets(): KlokSet[] {
  const sets = Object.values(modules).map((module) => module.default);
  return VOLGORDE.map((id) => sets.find((set) => set.id === id)).filter(
    (set): set is KlokSet => set !== undefined,
  );
}

export function isKlokMix(id: string): boolean {
  return id === KLOK_MIX_ID;
}

/** Everything on the face at once, under one name. */
function klokMix(sets: readonly KlokSet[]): KlokSet {
  return {
    id: KLOK_MIX_ID,
    // Null, because the items in it sit at four different steps. A mix that
    // claimed one of them would be claiming to be a set it is not.
    stap: null,
    niveau: 1,
    contentVersie: sets[0]?.contentVersie ?? '',
    items: sets.flatMap((set) => set.items),
  };
}

export function loadKlokSet(id: string): KlokSet | undefined {
  const sets = loadKlokSets();
  if (isKlokMix(id)) return klokMix(sets);
  return sets.find((set) => set.id === id);
}

/**
 * The pool a round without a fixed length draws from: the whole face.
 *
 * Twelve whole hours is over long before a minute is, so a lightning round of
 * "hele uren" has to reach past those twelve. Unlike rekenen it reaches all the
 * way — there is no second kind of thing to stray into. A clock is a clock, and
 * a child who reaches for the stopwatch on it is one who can already read it.
 */
export function klokPool(id: string): readonly KlokItem[] {
  return loadKlokSet(isKlokMix(id) ? id : KLOK_MIX_ID)?.items ?? [];
}
