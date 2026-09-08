import type { ComponentType } from 'react';
import type { IconProps } from './Icon';
import {
  BearSticker,
  CatSticker,
  FishSticker,
  FoxSticker,
  HareSticker,
  OwlSticker,
} from './Stickers';
import type { TranslationKey } from '@/i18n';

/**
 * The six stickers, as data.
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
 * In the order they are offered, and all of them from the first day.
 *
 * There is no order of unlocking and no locked one at the end of the row. The
 * moment there is, this stops being a choice and becomes a scoreboard with
 * animals on it — which is what the reisstempels already are, properly, and
 * they are earned rather than picked (ADR-059).
 */
export const STICKERS: readonly Sticker[] = [
  { id: 'kat', name: 'sticker.kat', draw: CatSticker },
  { id: 'uil', name: 'sticker.uil', draw: OwlSticker },
  { id: 'vos', name: 'sticker.vos', draw: FoxSticker },
  { id: 'beer', name: 'sticker.beer', draw: BearSticker },
  { id: 'haas', name: 'sticker.haas', draw: HareSticker },
  { id: 'vis', name: 'sticker.vis', draw: FishSticker },
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
