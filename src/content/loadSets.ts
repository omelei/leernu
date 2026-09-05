import type { Item } from '@/game-core';

/**
 * Loads every item set from content/sets at build time.
 *
 * Content lives in versioned files, never in components, so that a spelling fix
 * or a new region is a data change reviewable by someone who does not read
 * TypeScript. There are no sets yet — phase 1 adds them — and everything here is
 * written to behave correctly with none.
 */

export interface ItemSet {
  readonly id: string;
  readonly naam: string;
  readonly regioSet: string;
  readonly contentVersie: string;
  readonly items: readonly Item[];
}

const modules = import.meta.glob<{ default: ItemSet }>('../../content/sets/*.json', {
  eager: true,
});

export function loadItemSets(): ItemSet[] {
  return Object.values(modules).map((module) => module.default);
}

export function loadAllItems(): Item[] {
  return loadItemSets().flatMap((set) => set.items);
}
