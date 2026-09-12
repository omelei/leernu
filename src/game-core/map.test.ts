import { describe, expect, it } from 'vitest';
import {
  boxCentre,
  detailFor,
  fitView,
  helpTargetFor,
  keyboardOrder,
  reachablePoints,
  MIN_TOUCH_PX,
  needsHelpTarget,
  smallestSidePx,
  tekenvolgorde,
  trefruimtePx,
  type BoundingBox,
} from './map';

const VIEW = 1000;

describe('fitView', () => {
  it('relates view-box units and pixels both ways', () => {
    const fit = fitView(VIEW, 500);
    expect(fit.unitsPerPixel).toBe(2);
    expect(fit.pixelsPerUnit).toBe(0.5);
  });
});

describe('smallestSidePx', () => {
  it('measures the narrow side, because that is what limits a finger', () => {
    const fit = fitView(VIEW, 500);
    // 200 units wide and 40 tall, at half a pixel per unit: a long thin strip
    // that is 20 pixels across however far it stretches.
    expect(smallestSidePx([0, 0, 200, 40], fit)).toBe(20);
  });
});

describe('needsHelpTarget', () => {
  const fit = fitView(VIEW, 640);

  it('leaves a province alone', () => {
    // Utrecht, the smallest province, measured from the real data.
    expect(needsHelpTarget([0, 0, 179, 155], fit)).toBe(false);
  });

  it('helps an island', () => {
    // Vlieland, measured from the built content: 66 by 36 units.
    expect(needsHelpTarget([0, 0, 66, 36], fit)).toBe(true);
  });

  /**
   * Ameland is 72 units long and 16 wide. Judged on its longest side it looks
   * like a comfortable 50-pixel target; judged on the side a finger actually
   * has to land within, it is 11. Real content found this, not a unit test.
   */
  it('helps a long thin island that looks big enough', () => {
    expect(needsHelpTarget([0, 0, 72, 16], fit)).toBe(true);
  });

  it('helps a point, which has no size at all', () => {
    expect(needsHelpTarget([500, 500, 500, 500], fit)).toBe(true);
  });

  it('is a function of the screen, not the shape alone', () => {
    const shape: BoundingBox = [0, 0, 60, 60];
    // The same shape is fine on a digibord and too small on a phone.
    expect(needsHelpTarget(shape, fitView(VIEW, 1200))).toBe(false);
    expect(needsHelpTarget(shape, fitView(VIEW, 320))).toBe(true);
  });
});

describe('helpTargetFor', () => {
  const fit = fitView(VIEW, 500);

  it('returns nothing when the shape is already big enough', () => {
    expect(helpTargetFor([0, 0, 400, 400], fit)).toBeNull();
  });

  it('is exactly the minimum touch target across, whatever the scale', () => {
    for (const px of [320, 500, 1024, 1920]) {
      const target = helpTargetFor([500, 500, 502, 502], fitView(VIEW, px));
      expect(target).not.toBeNull();
      // Diameter in units, converted back to pixels, is the minimum.
      const diameterPx = (target as { r: number }).r * 2 * fitView(VIEW, px).pixelsPerUnit;
      expect(diameterPx).toBeCloseTo(MIN_TOUCH_PX, 6);
    }
  });

  it('sits on the label point rather than the box centre when there is one', () => {
    // A crescent-shaped province: the box centre is in open water, so a target
    // there would let a child hit the province by tapping the sea (ADR-019).
    const box: BoundingBox = [0, 0, 20, 20];
    expect(boxCentre(box)).toEqual([10, 10]);

    const target = helpTargetFor(box, fit, [3, 17]);
    expect(target?.cx).toBe(3);
    expect(target?.cy).toBe(17);
  });

  it('falls back to the box centre when no label point exists', () => {
    const target = helpTargetFor([0, 0, 20, 20], fit, null);
    expect(target?.cx).toBe(10);
    expect(target?.cy).toBe(10);
  });
});

/** Stap 10, S27: the zone comes from the surface, and it is at least 44. */
describe('trefruimtePx', () => {
  it('is 44 points at the least', () => {
    expect(MIN_TOUCH_PX).toBe(44);
  });

  it('is the diameter of a circle with the same surface', () => {
    const fit = fitView(VIEW, 500);
    // A circle of radius 50 units, at half a pixel per unit: 50 pixels across.
    expect(trefruimtePx([0, 0, 100, 100], fit, Math.PI * 50 * 50)).toBeCloseTo(50, 6);
  });

  it('falls back to the narrow side of the box without a surface', () => {
    const fit = fitView(VIEW, 500);
    expect(trefruimtePx([0, 0, 200, 40], fit)).toBe(20);
    expect(trefruimtePx([0, 0, 200, 40], fit, null)).toBe(20);
  });

  it('decides whether a shape needs a zone from its surface when it has one', () => {
    const fit = fitView(VIEW, 640);
    // A province-sized surface clears 44 easily; an island's does not, even
    // judged by its surface rather than its narrow side.
    expect(needsHelpTarget([0, 0, 179, 155], fit, MIN_TOUCH_PX, 20000)).toBe(false);
    expect(needsHelpTarget([0, 0, 72, 16], fit, MIN_TOUCH_PX, 700)).toBe(true);
  });
});

/** Stap 10: what is drawn last is what a tap lands on, so the smallest goes last. */
describe('tekenvolgorde', () => {
  const vorm = (id: string, oppervlak: number) => ({
    id,
    bbox: [0, 0, 10, 10] as BoundingBox,
    oppervlak,
  });

  it('keeps shapes without a zone in the order given, and puts the zoned ones last', () => {
    const shapes = [vorm('groot', 900), vorm('eiland', 20), vorm('midden', 400), vorm('rots', 5)];
    const zones = new Map([
      ['eiland', null],
      ['rots', null],
    ]);

    expect(tekenvolgorde(shapes, zones).map((s) => s.id)).toEqual([
      'groot',
      'midden',
      'eiland',
      'rots',
    ]);
  });

  it('changes nothing where no shape has a zone', () => {
    const shapes = [vorm('b', 10), vorm('a', 900)];
    expect(tekenvolgorde(shapes, new Map()).map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('keyboardOrder', () => {
  it('reads north to south, then west to east', () => {
    const shapes = [
      { id: 'zuid-west', bbox: [0, 800, 100, 900] as BoundingBox },
      { id: 'noord-oost', bbox: [800, 0, 900, 100] as BoundingBox },
      { id: 'noord-west', bbox: [0, 0, 100, 100] as BoundingBox },
      { id: 'zuid-oost', bbox: [800, 800, 900, 900] as BoundingBox },
    ];

    expect(keyboardOrder(shapes).map((s) => s.id)).toEqual([
      'noord-west',
      'noord-oost',
      'zuid-west',
      'zuid-oost',
    ]);
  });

  it('treats a small vertical difference as the same row', () => {
    // Twenty units apart vertically is not a reason to reorder two provinces
    // that a reader would see as side by side.
    const shapes = [
      { id: 'rechts', bbox: [800, 0, 900, 100] as BoundingBox },
      { id: 'links', bbox: [0, 20, 100, 120] as BoundingBox },
    ];

    expect(keyboardOrder(shapes).map((s) => s.id)).toEqual(['links', 'rechts']);
  });

  it('does not mutate the array it is given', () => {
    const shapes = [
      { id: 'b', bbox: [0, 500, 10, 510] as BoundingBox },
      { id: 'a', bbox: [0, 0, 10, 10] as BoundingBox },
    ];
    keyboardOrder(shapes);
    expect(shapes.map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('detailFor', () => {
  it('picks a level from the rendered size', () => {
    expect(detailFor(360)).toBe('overview');
    expect(detailFor(640)).toBe('region');
    expect(detailFor(1080)).toBe('detail');
  });
});

describe('reachablePoints', () => {
  const fit = fitView(1000, 640);
  const punt = (id: string, x: number, y: number) => ({ id, punt: [x, y] as const });

  it('leaves a sparse set alone', () => {
    // 200 units is 128 px at this fit: comfortably apart.
    const points = [punt('a', 0, 0), punt('b', 200, 0), punt('c', 400, 0)];

    expect(reachablePoints(points, fit, 'a').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('drops a point that would sit under its neighbour', () => {
    const points = [punt('a', 0, 0), punt('b', 10, 0), punt('c', 400, 0)];

    expect(reachablePoints(points, fit, 'a').map((p) => p.id)).toEqual(['a', 'c']);
  });

  /** The child must be able to answer, so the answer is never the one dropped. */
  it('keeps the target even when it is the crowded one', () => {
    const points = [punt('a', 0, 0), punt('b', 10, 0)];

    expect(reachablePoints(points, fit, 'b').map((p) => p.id)).toEqual(['b']);
  });

  /** Target-first selection must not become target-first rendering. */
  it('returns points in input order, so tab order does not reveal the answer', () => {
    const points = [punt('a', 0, 0), punt('b', 400, 0), punt('c', 800, 0)];

    expect(reachablePoints(points, fit, 'c').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('measures in pixels, so a smaller map shows fewer points', () => {
    const points = [punt('a', 0, 0), punt('b', 80, 0)];

    expect(reachablePoints(points, fitView(1000, 1200), 'a')).toHaveLength(2);
    expect(reachablePoints(points, fitView(1000, 400), 'a')).toHaveLength(1);
  });
});
