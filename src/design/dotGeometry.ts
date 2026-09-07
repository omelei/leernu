/**
 * The dot, as arithmetic.
 *
 * Separated from the component so it can be pinned against the delivered logo
 * files in a test. The mark is the one shape the whole product is built from —
 * logo, app icon, progress bar, retention indicator, item status and the "Bijna"
 * answer state — so it is worth being unable to change it by accident.
 *
 * Styleguide §A, and confirmed against every SVG in docs/Logo.
 */

/** Below this diameter the fill drops away and a solid core takes its place. */
export const FILL_FLOOR_PX = 21;
/** Below this the ring goes too, and the dot is a solid disc. */
export const RING_FLOOR_PX = 16;
/** Air between ring and core, in the simplified sizes. */
export const CORE_GAP_PX = 1;
/** The standing fill of the dot in the wordmark, never animated there. */
export const WORDMARK_FILL = 0.62;
/** The dot is 41% of the font size — 41/100 in the delivered wordmark. */
export const WORDMARK_DOT_RATIO = 0.41;

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
 * The 10% applies wherever the mark is paper on ink. Both artefacts that say so
 * agree to four decimals: the negative wordmark carries 3.758 against the
 * positive's 3.417, and leer-nu-merkteken-papier.svg carries 8.8 against the ink
 * version's 8.
 *
 * The three app icons do not apply it, although they are paper on ink too. That
 * is an inconsistency in those three files rather than a rule — the logo
 * documentation states the correction for the paper merkteken in as many words —
 * and it is flagged for the designer. Nothing here renders an app icon anyway.
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
