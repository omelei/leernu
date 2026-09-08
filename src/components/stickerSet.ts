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
  /**
   * The level at which this one arrives. One is the first, which every child
   * has from the first minute.
   */
  readonly level: number;
  readonly draw: ComponentType<Omit<IconProps, 'children'>>;
}

/**
 * In the order they arrive, one per level.
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
  { id: 'kat', name: 'sticker.kat', level: 1, draw: CatSticker },
  { id: 'uil', name: 'sticker.uil', level: 2, draw: OwlSticker },
  { id: 'vos', name: 'sticker.vos', level: 3, draw: FoxSticker },
  { id: 'beer', name: 'sticker.beer', level: 4, draw: BearSticker },
  { id: 'haas', name: 'sticker.haas', level: 5, draw: HareSticker },
  { id: 'vis', name: 'sticker.vis', level: 6, draw: FishSticker },
  { id: 'egel', name: 'sticker.egel', level: 7, draw: HedgehogSticker },
  { id: 'kikker', name: 'sticker.kikker', level: 8, draw: FrogSticker },
  { id: 'eekhoorn', name: 'sticker.eekhoorn', level: 9, draw: SquirrelSticker },
  { id: 'pinguin', name: 'sticker.pinguin', level: 10, draw: PenguinSticker },
  { id: 'olifant', name: 'sticker.olifant', level: 11, draw: ElephantSticker },
  { id: 'draak', name: 'sticker.draak', level: 12, draw: DragonSticker },
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

/** The ones a child has reached. Never empty: the first arrives at level one. */
export function unlockedStickers(level: number): Sticker[] {
  return STICKERS.filter((sticker) => sticker.level <= level);
}

/** The next one to arrive, or null once a child has all twelve. */
export function nextSticker(level: number): Sticker | null {
  return STICKERS.find((sticker) => sticker.level > level) ?? null;
}
