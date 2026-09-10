import type { CSSProperties } from 'react';
import type { Reeks } from '@/game-core';
import { stickerById } from './stickerSet';

/**
 * A hero on its plate: the drawing in the light of the page, standing on the
 * material of its reeks.
 *
 * Two shapes of one thing. The plate is a square with its corners rounded by a
 * third of the side, which is how the child's own column shows a hero. The
 * round one is the same hero as the avatar in the app bar, inside a ring of its
 * material's soft tone.
 *
 * Decorative, always. Every place that draws one says in words who it is or
 * which level it stands for, and a drawing announced as well would be the same
 * thing twice.
 *
 * The material comes from `data-reeks` and the three tokens behind it in
 * index.css. This component names no colour, which is a lint rule and not a
 * courtesy.
 */
export function Heldplaat({
  sticker,
  reeks,
  size,
  vorm = 'plaat',
  className,
}: {
  readonly sticker: string | undefined;
  readonly reeks: Reeks;
  /** The side in px. The drawing inside is a little over half of it. */
  readonly size: number;
  readonly vorm?: 'plaat' | 'rond';
  readonly className?: string;
}) {
  const Draw = stickerById(sticker).draw;
  const classes = ['tk-held', vorm === 'rond' ? 'tk-held-rond' : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      data-reeks={reeks}
      style={{ '--held': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="tk-held-kern">
        <Draw size={Math.round(size * (vorm === 'rond' ? 0.5 : 0.55))} />
      </span>
    </span>
  );
}
