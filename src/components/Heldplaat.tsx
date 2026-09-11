import type { CSSProperties } from 'react';
import type { Reeks } from '@/game-core';
import { stickerById } from './stickerSet';

/**
 * Below this the rings are thinner than two pixels and cannot be counted, so
 * only the plate is drawn and its tone carries the reeks on its own. The rank
 * is read on /voortgang, where the plate is 112 (docs/helden/LEESMIJ.md).
 */
export const RINGEN_VANAF = 64;

/** Where one hero in one reeks is drawn. Served as it is, never bundled. */
export function heldBeeld(dier: string, reeks: Reeks): string {
  return `${import.meta.env.BASE_URL}helden/${dier}-${reeks}.webp`;
}

/**
 * A hero on its plate, with a ring round it for every reeks it has climbed.
 *
 * **The reeks is a count, not only a colour.** Bronze has no ring, silver one,
 * gold two, platinum three and ultra four, so a child can see which of two
 * heroes stands higher without knowing the names of the materials. The four
 * ring slots are always reserved in the drawing, so a plate is the same size in
 * every reeks and a card does not jump when its hero climbs.
 *
 * From 64 pixels it is the whole drawing, clipped just outside the outer ring
 * — the file stands on paper, and a square of paper in the dark theme would be a
 * frame nobody drew. Below 64 it is the plate alone, enlarged until it fills the
 * frame.
 *
 * **Not found yet** is a chest: the surface with a band across it both ways,
 * the plate's size and nothing else. No faded drawing and no silhouette,
 * because which hero it turns out to be is what a chest is for (ADR-081).
 *
 * Decorative, always. Every place that draws one says in words who it is and
 * which reeks, and a picture announced as well would be the same thing twice.
 */
export function Heldplaat({
  sticker,
  reeks,
  size,
  gevonden = true,
  className,
}: {
  readonly sticker: string | undefined;
  readonly reeks: Reeks;
  /** The side in px. */
  readonly size: number;
  readonly gevonden?: boolean;
  readonly className?: string;
}) {
  const ringen = size >= RINGEN_VANAF;
  const classes = ['tk-held', ringen ? 'tk-held-ringen' : 'tk-held-klein', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      data-reeks={reeks}
      style={{ '--held': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      {gevonden ? (
        <img
          className="tk-held-beeld"
          src={heldBeeld(stickerById(sticker).dier, reeks)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="tk-held-kist" />
      )}
    </span>
  );
}
