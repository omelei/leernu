/**
 * The geometry a map renderer needs, with no DOM in sight.
 *
 * All of it exists to answer one question the spec asks and no map library
 * answers for you: **can a child actually hit this?** Vlieland is roughly a
 * thousandth of the Netherlands. Rendered on a Chromebook it is four pixels
 * wide, and four pixels is not a target, it is a taunt. Spec section 8 asks for
 * 44px and this product uses 48, so anything smaller needs help.
 *
 * Pure and DOM-free on purpose (ADR-015): a hit target that is only correct
 * inside a browser cannot be tested, and this is exactly the kind of arithmetic
 * that is wrong by a factor of two without anyone noticing.
 */

/** [minX, minY, maxX, maxY] in view-box units. */
export type BoundingBox = readonly [number, number, number, number];

export const MIN_TOUCH_PX = 48;

export interface ViewFit {
  /** View-box units per CSS pixel. */
  readonly unitsPerPixel: number;
  /** CSS pixels per view-box unit. */
  readonly pixelsPerUnit: number;
  readonly renderedPx: number;
}

/**
 * How a square view box maps onto a square of screen.
 *
 * The map is always rendered square and uniformly scaled — the shape of a
 * country is not ours to stretch, and a child who learns a squashed Netherlands
 * has learned something false.
 */
export function fitView(viewBoxSize: number, renderedPx: number): ViewFit {
  return {
    unitsPerPixel: viewBoxSize / renderedPx,
    pixelsPerUnit: renderedPx / viewBoxSize,
    renderedPx,
  };
}

export function boxWidth(box: BoundingBox): number {
  return box[2] - box[0];
}

export function boxHeight(box: BoundingBox): number {
  return box[3] - box[1];
}

export function boxCentre(box: BoundingBox): readonly [number, number] {
  return [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
}

/**
 * The shape's **smallest** on-screen dimension, in CSS pixels.
 *
 * The smallest, not the largest, and the difference is not academic: Ameland is
 * 72 units long and 16 wide, so on a school laptop it is a 50-pixel streak of
 * land that is 11 pixels tall. Measuring the long side calls that comfortable.
 * A finger aiming at it disagrees, and so does WCAG 2.5.8, which asks for a
 * minimum in both directions.
 */
export function smallestSidePx(box: BoundingBox, fit: ViewFit): number {
  return Math.min(boxWidth(box), boxHeight(box)) * fit.pixelsPerUnit;
}

export function needsHelpTarget(box: BoundingBox, fit: ViewFit, minPx = MIN_TOUCH_PX): boolean {
  return smallestSidePx(box, fit) < minPx;
}

export interface HelpTarget {
  readonly cx: number;
  readonly cy: number;
  /** Radius in view-box units, so it stays 48px however the map is scaled. */
  readonly r: number;
}

/**
 * An invisible circle that makes a small shape reachable.
 *
 * Centred on the label point rather than the bounding-box centre where one
 * exists: for a shape like Zeeland the box centre sits in open water, and a
 * target centred there would let a child hit the province by tapping the sea.
 * That is the same error as the IJsselmeer inside Noord-Holland (ADR-019) —
 * rewarding a click that is geographically wrong.
 */
export function helpTargetFor(
  box: BoundingBox,
  fit: ViewFit,
  labelPoint?: readonly [number, number] | null,
  minPx = MIN_TOUCH_PX,
): HelpTarget | null {
  if (!needsHelpTarget(box, fit, minPx)) return null;

  const [cx, cy] = labelPoint ?? boxCentre(box);
  return { cx, cy, r: (minPx / 2) * fit.unitsPerPixel };
}

/**
 * Orders shapes for keyboard navigation: north to south, then west to east.
 *
 * Reading order over source order, because tabbing through a map should feel
 * like reading one. Source order is whatever the data provider happened to
 * choose, which for a child using only a keyboard is no order at all.
 */
export function keyboardOrder<T extends { readonly bbox: BoundingBox }>(shapes: readonly T[]): T[] {
  return [...shapes].sort((a, b) => {
    const [ax, ay] = boxCentre(a.bbox);
    const [bx, by] = boxCentre(b.bbox);
    // A band of 60 units counts as "the same latitude", so provinces that sit
    // side by side are not interleaved by a few units of vertical drift.
    if (Math.abs(ay - by) > 60) return ay - by;
    return ax - bx;
  });
}

/**
 * Which detail level to load for a given rendered size.
 *
 * Deliberately conservative: the cost of too much detail is a slow map on a
 * school Chromebook, and the cost of too little is a coastline that looks wrong.
 * On the devices in spec section 8 the map is rarely above 700px, so `region` is
 * the working default and `detail` is for zooming in.
 */
export function detailFor(renderedPx: number): 'overview' | 'region' | 'detail' {
  if (renderedPx < 420) return 'overview';
  if (renderedPx < 900) return 'region';
  return 'detail';
}
