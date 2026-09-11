import type { TranslationKey } from '@/i18n';

/**
 * The twelve heroes, as data (ADR-098).
 *
 * Split from the plate that draws them for the same reason
 * `features/shell/moduleIcons.ts` is split from `Icon.tsx`: a registry that is
 * data can be read by a test without rendering anything. The file keeps its old
 * name because "sticker" is what the profile has called the choice since
 * ADR-059, and a rename of a stored field is a migration for no gain a child can
 * see.
 */

export interface Sticker {
  /**
   * What the profile stores. A first name, so it can never be mistaken for an
   * id an older version wrote: `vos` was the animal in place 2, and Valerie Vos
   * is in place 0.
   */
  readonly id: string;
  readonly name: TranslationKey;
  /**
   * The animal, which is the file the plate is drawn from:
   * `public/helden/<dier>-<reeks>.webp`.
   */
  readonly dier: string;
  /**
   * The id this place had before ADR-098, when it was a drawing of an animal.
   * A choice stored then still finds its place, so a child who wore the cat
   * wears the hero in the cat's place — with the reeks and the duplicates that
   * place had, because those are kept by place and not by picture.
   */
  readonly vroeger: string;
}

/**
 * In the order they are shown, which is also their place: `Held.plek` is an
 * index into this list, and the migration off the old ladder (`uitLadder`) kept
 * places. So a new child holds the first three — Valerie Vos, Daan Das and Olaf
 * Otter — and wears the first.
 *
 * **The order says nothing about earning them.** Which hero a chest offers, and
 * in which order, is `KIST_VOLGORDE` in `game-core/helden.ts` — pure, testable
 * without React, and the only place that rule exists.
 *
 * One pose per hero, fixed for good, and a name that begins with the animal's
 * letter so a child of seven can read it out and remember it. The reeks is a
 * layer over the same drawing: the outfit takes the material and the rings
 * count the steps (docs/helden/LEESMIJ.md).
 */
export const STICKERS: readonly Sticker[] = [
  { id: 'valerie', name: 'held.valerie', dier: 'vos', vroeger: 'kat' },
  { id: 'daan', name: 'held.daan', dier: 'das', vroeger: 'uil' },
  { id: 'olaf', name: 'held.olaf', dier: 'otter', vroeger: 'vos' },
  { id: 'harm', name: 'held.harm', dier: 'havik', vroeger: 'beer' },
  { id: 'willem', name: 'held.willem', dier: 'wolf', vroeger: 'haas' },
  { id: 'esmee', name: 'held.esmee', dier: 'egel', vroeger: 'vis' },
  { id: 'bart', name: 'held.bart', dier: 'bever', vroeger: 'egel' },
  { id: 'udo', name: 'held.udo', dier: 'uil', vroeger: 'kikker' },
  { id: 'minou', name: 'held.minou', dier: 'marter', vroeger: 'eekhoorn' },
  { id: 'fem', name: 'held.fem', dier: 'flamingo', vroeger: 'pinguin' },
  { id: 'richard', name: 'held.richard', dier: 'ree', vroeger: 'olifant' },
  { id: 'ben', name: 'held.ben', dier: 'buizerd', vroeger: 'draak' },
];

/** The first one, which is what a child who has never chosen is shown. */
export const DEFAULT_STICKER = STICKERS[0] as Sticker;

/**
 * The chosen one, or the first.
 *
 * An id from before ADR-098 finds the hero in its place. An id that is in
 * neither list reads as no choice rather than as an error: that is what a
 * profile written by a later version and read by an earlier one looks like, and
 * a front door is not the place to fail over it.
 */
export function stickerById(id: string | undefined): Sticker {
  return (
    STICKERS.find((sticker) => sticker.id === id) ??
    STICKERS.find((sticker) => sticker.vroeger === id) ??
    DEFAULT_STICKER
  );
}
