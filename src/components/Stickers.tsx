import type { ComponentType } from 'react';
import { Icon, type IconProps } from './Icon';
import type { TranslationKey } from '@/i18n';

/**
 * Six animals, and the one thing on this screen a child gets to choose.
 *
 * Everything else on the front door is earned or measured: a mark, a forecast,
 * a run of days. This is not, and that is the point — a child who cannot yet
 * change anything about an app they are told to use can at least decide what it
 * looks like when they open it. It carries no progress, unlocks nothing, and is
 * not a reward. Making it one would put a hare behind a wall.
 *
 * Drawn on the §E frame rather than beside it. They are not part of §E's set of
 * sixteen — that list is fixed and these are not on it — but they sit in the
 * same interface, so they take the same 24 grid, the same stroke, the same
 * primitives, and no colour of their own. `src/design/icons.test.ts` checks
 * this file for the last of those the same way it checks the set proper.
 *
 * Straight lines and circles. Everything here is a head at 24 pixels, because a
 * whole animal at that size is a smudge and a head with ears is not: ears are
 * the part a five-year-old draws first and the part that tells a cat from a
 * hare.
 */

export interface Sticker {
  readonly id: string;
  readonly name: TranslationKey;
  readonly draw: ComponentType<Omit<IconProps, 'children'>>;
}

/** The cat: a round head, two pricked ears and a pair of eyes. */
function CatSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M7.2 8.6L5.5 3.5l4.6 2.4M16.8 8.6L18.5 3.5l-4.6 2.4" strokeLinejoin="round" />
      <circle cx="9.5" cy="12.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" />
      <path d="M3 15h3.5M17.5 15H21" />
    </Icon>
  );
}

/** The owl: one head, two eyes that are most of it, and a beak between them. */
function OwlSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12.5" r="8.5" />
      <circle cx="8.8" cy="10.5" r="2.4" />
      <circle cx="15.2" cy="10.5" r="2.4" />
      <path d="M12 13.5l-1.6 2.4h3.2z" strokeLinejoin="round" />
    </Icon>
  );
}

/** The fox: a snout that comes to a point, and two ears that come to two more. */
function FoxSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5L8.5 9h7l5-3.5-2 8.5L12 20.5 5.5 14z" strokeLinejoin="round" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The bear: a round head and two round ears, which is all a bear needs. */
function BearSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="14" r="6.5" />
      <circle cx="5.5" cy="7" r="2.6" />
      <circle cx="18.5" cy="7" r="2.6" />
      <circle cx="9.8" cy="13" r="1" fill="currentColor" />
      <circle cx="14.2" cy="13" r="1" fill="currentColor" />
      <path d="M10.5 17h3" />
    </Icon>
  );
}

/** The hare: the ears do the work, so they are half the icon. */
function HareSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="15.5" r="5.5" />
      <path d="M9.3 10.6L7.5 3.5M14.7 10.6L16.5 3.5" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
      <circle cx="14" cy="14.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The fish: a body and a tail, and the only one here that is not a head. */
function FishSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M9.5 6L17 12l-7.5 6L3 12z" strokeLinejoin="round" />
      <path d="M17 12l4-3.5v7z" strokeLinejoin="round" />
      <circle cx="7" cy="11.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/**
 * The six, in the order they are offered.
 *
 * All of them from the first day. There is no order of unlocking and no locked
 * one at the end of the row, because the moment there is, this stops being a
 * choice and becomes a scoreboard with animals on it.
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

export function stickerById(id: string | undefined): Sticker {
  return STICKERS.find((sticker) => sticker.id === id) ?? DEFAULT_STICKER;
}
