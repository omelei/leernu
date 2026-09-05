import { describe, expect, it } from 'vitest';
import {
  boxCentre,
  detailFor,
  fitView,
  helpTargetFor,
  keyboardOrder,
  MIN_TOUCH_PX,
  needsHelpTarget,
  renderedSizePx,
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

describe('renderedSizePx', () => {
  it('measures the larger dimension, because that is what a finger meets', () => {
    const fit = fitView(VIEW, 500);
    // 200 units wide, 40 tall, at half a pixel per unit.
    expect(renderedSizePx([0, 0, 200, 40], fit)).toBe(100);
  });
});

describe('needsHelpTarget', () => {
  const fit = fitView(VIEW, 640);

  it('leaves a province alone', () => {
    // Utrecht, the smallest province, measured from the real data.
    expect(needsHelpTarget([0, 0, 179, 155], fit)).toBe(false);
  });

  it('helps an island', () => {
    // Vlieland is roughly this size once it is an item of its own.
    expect(needsHelpTarget([0, 0, 12, 4], fit)).toBe(true);
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
