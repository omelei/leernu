import type { ComponentType } from 'react';
import type { IconProps } from './Icon';
import {
  BearSticker,
  CatSticker,
  DragonSticker,
  ElephantSticker,
  FishSticker,
  FoxSticker,
  FrogSticker,
  HareSticker,
  HedgehogSticker,
  OwlSticker,
  PenguinSticker,
  SquirrelSticker,
} from './Stickers';
import type { TranslationKey } from '@/i18n';

/**
 * The twelve stickers, as data.
 *
 * Split from the drawings for the same reason `features/shell/moduleIcons.ts`
 * is split from `Icon.tsx`: a file that exports components exports only
 * components, and a registry that is data can be read by a test without
 * rendering anything.
 */

export interface Sticker {
  readonly id: string;
  readonly name: TranslationKey;
  readonly draw: ComponentType<Omit<IconProps, 'children'>>;
}

/**
 * In the order they arrive: three from the first minute, then one per level,
 * twelve to a reeks and five reeksen of them (ADR-071).
 *
 * **The order is all this file knows about earning them.** Which level hands
 * out which one, how many a child has, and which material a row is drawn in
 * are `game-core/collection.ts` — pure, testable without React, and the only
 * place that arithmetic exists. This list carried a `level` field of its own
 * for one release, which was a second copy of the same rule and exactly how
 * two of them come to disagree.
 *
 * **Three at level one, not one.** ADR-059's real point was that a child who
 * cannot change anything about an app they are told to use can at least decide
 * what it looks like, and a ladder that starts with a single animal takes that
 * away for the fifteen correct answers it costs to reach the second. Three is a
 * choice; one is a default.
 *
 * This reverses ADR-059, which had all six unlocked from the first day on the
 * argument that a sticker is a choice and not a scoreboard. That argument was
 * right about what was there and wrong about what was missing: the product
 * counted XP for every correct answer, worked out a level from it, and showed
 * a child neither. The one thing on the front door that was theirs unlocked
 * nothing, and the one thing that was earned was invisible.
 *
 * So they are a ladder now, and ADR-067 sets the three conditions it has to
 * keep: **nothing is behind money or chance**, **nothing is behind waiting** —
 * only correct answers move it — and **a child always has one**, so the ladder
 * can never leave anybody with nothing to be. What that buys is the thing a
 * ten-year-old already understands from every game they play: you can see the
 * next one, and you know exactly what it costs.
 */
export const STICKERS: readonly Sticker[] = [
  { id: 'kat', name: 'sticker.kat', draw: CatSticker },
  { id: 'uil', name: 'sticker.uil', draw: OwlSticker },
  { id: 'vos', name: 'sticker.vos', draw: FoxSticker },
  { id: 'beer', name: 'sticker.beer', draw: BearSticker },
  { id: 'haas', name: 'sticker.haas', draw: HareSticker },
  { id: 'vis', name: 'sticker.vis', draw: FishSticker },
  { id: 'egel', name: 'sticker.egel', draw: HedgehogSticker },
  { id: 'kikker', name: 'sticker.kikker', draw: FrogSticker },
  { id: 'eekhoorn', name: 'sticker.eekhoorn', draw: SquirrelSticker },
  { id: 'pinguin', name: 'sticker.pinguin', draw: PenguinSticker },
  { id: 'olifant', name: 'sticker.olifant', draw: ElephantSticker },
  { id: 'draak', name: 'sticker.draak', draw: DragonSticker },
];

/** The first one, which is what a child who has never chosen is shown. */
export const DEFAULT_STICKER = STICKERS[0] as Sticker;

/**
 * The chosen one, or the first.
 *
 * An id that is not in the list reads as no choice rather than as an error:
 * that is what a profile written by a later version and read by an earlier one
 * looks like, and a front door is not the place to fail over it.
 */
export function stickerById(id: string | undefined): Sticker {
  return STICKERS.find((sticker) => sticker.id === id) ?? DEFAULT_STICKER;
}
