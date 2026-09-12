/**
 * The dot, as arithmetic.
 *
 * Separated from the component so it can be pinned in a test. The dot is the
 * product's one shape for how far along something is — progress bar, retention
 * indicator, item status and the "Bijna" answer state — so it is worth being
 * unable to change it by accident.
 *
 * Styleguide §A, and confirmed against every SVG of the first logo, which was
 * this dot until ADR-108 gave the logo a shape of its own.
 */

/** Below this diameter the fill drops away and a solid core takes its place. */
export const FILL_FLOOR_PX = 21;
/** Below this the ring goes too, and the dot is a solid disc. */
export const RING_FLOOR_PX = 16;
/** Air between ring and core, in the simplified sizes. */
export const CORE_GAP_PX = 1;

export interface DotGeometry {
  /** Ring thickness. */
  readonly ring: number;
  /** Radius of the ring's own path, which the stroke straddles. */
  readonly radius: number;
  /** Radius of the area the fill is clipped to: the ring's inner edge. */
  readonly innerRadius: number;
  /** Top edge of the fill, measured from the top of the box. */
  readonly fillTop: number;
  /** Height of the fill. */
  readonly fillHeight: number;
}

/**
 * @param size      diameter in px
 * @param negative  paper on ink, where the ring is 10% heavier
 *
 * The ring is exactly one twelfth, never rounded. The styleguide's canvas
 * samples show whole-pixel rings only because a CSS border cannot be
 * fractional; the delivered SVGs carry 3.417 on a 41px dot, which is 41/12.
 *
 * The 10% applies wherever the dot is paper on ink. The first logo's files
 * agreed to four decimals: the negative wordmark carried 3.758 against the
 * positive's 3.417, and the paper merkteken 8.8 against the ink version's 8.
 */
export function dotGeometry(size: number, fill: number, negative = false): DotGeometry {
  const filled = Math.min(1, Math.max(0, fill));
  const ring = (size / 12) * (negative ? 1.1 : 1);
  const radius = (size - ring) / 2;
  const innerRadius = radius - ring / 2;
  const fillHeight = 2 * innerRadius * filled;

  return {
    ring,
    radius,
    innerRadius,
    fillTop: size / 2 + innerRadius - fillHeight,
    fillHeight,
  };
}
