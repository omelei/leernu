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

/**
 * Which answer points may be drawn at once, so every one of them is reachable.
 *
 * Eighty cities on a map of the Netherlands is not a map, it is a smear.
 * Beverwijk and Heemskerk land six pixels apart on a phone; measured over the
 * whole set, 77 of the 80 have a neighbour closer than a fingertip, and a round
 * of fifteen drawn at random contains an unhittable pair 99.9% of the time. A
 * child who taps the right place and is told they are wrong has been failed by
 * the interface, not by their knowledge.
 *
 * So the rule that already governs shapes governs points too: nothing that can
 * be answered is drawn closer to another answer than {@link MIN_TOUCH_PX}. The
 * target is always kept — it must be answerable — and the rest are taken in
 * input order, which for the cities is descending population. That gives the
 * pleasant side effect that the neighbour who survives is the better-known one:
 * a child choosing near Rotterdam is offered Rotterdam, not Schiedam.
 *
 * For the twelve capitals and the six bodies of water this changes nothing —
 * they already clear the threshold — which is the point: one rule, no set-specific
 * branch, and the sparse sets keep showing every option.
 *
 * The result comes back in **input order**, not target-first. Which point is the
 * answer must not be visible in the order they are drawn: a renderer that puts
 * the target first hands it to the first child who presses Tab.
 */
export function reachablePoints<
  T extends { readonly id: string; readonly punt: readonly [number, number] },
>(points: readonly T[], fit: ViewFit, targetId: string | null, minPx: number = MIN_TOUCH_PX): T[] {
  const minUnits = minPx * fit.unitsPerPixel;
  const target = points.find((point) => point.id === targetId);
  const rest = points.filter((point) => point.id !== targetId);
  const kept: T[] = target ? [target] : [];

  for (const point of rest) {
    const clashes = kept.some((other) => {
      const dx = point.punt[0] - other.punt[0];
      const dy = point.punt[1] - other.punt[1];
      return Math.hypot(dx, dy) < minUnits;
    });
    if (!clashes) kept.push(point);
  }

  const order = new Map(points.map((point, index) => [point.id, index]));
  return kept.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
