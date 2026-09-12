import type { VlagItem } from '@/game-core';
import { vlagSrc } from './vlagSrc';

/**
 * One flag, in a frame of four by three.
 *
 * The frame is the same for every flag, so a grid of them lines up and nothing
 * moves while the pictures arrive: the frame has its size before the picture
 * does. The flag inside keeps its own shape — not cropped, not stretched — so
 * Zwitserland and Vaticaanstad stay square, Nepal keeps its two points and
 * Qatar stays long. Its width is worked out from its shape rather than left to
 * the browser, so the thin outline sits on the flag's own edge and a white flag
 * like Japan's still has one.
 *
 * `alt` is the caller's: a description where the name would give the answer
 * away, the name where it would not, and empty where a label next to it says
 * the same.
 */
export function Vlag({
  vlag,
  alt,
  lazy = true,
}: {
  readonly vlag: VlagItem;
  readonly alt: string;
  /** False for the one flag a screen is about, which should not wait. */
  readonly lazy?: boolean;
}) {
  // A frame of 4:3 is three quarters as high as it is wide, so a flag that
  // fills its height is `verhouding × 75%` of its width.
  const breedte = Math.min(100, vlag.verhouding * 75);

  return (
    <span className="tk-vlag">
      <img
        src={vlagSrc(vlag)}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        style={{ width: `${breedte}%`, aspectRatio: String(vlag.verhouding) }}
      />
    </span>
  );
}
