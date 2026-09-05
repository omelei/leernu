/**
 * Ramer-Douglas-Peucker simplification, plus the ring filtering that goes with
 * it.
 *
 * Simplification happens *after* projection, in view-box units, so a tolerance
 * means the same thing everywhere on the map. Simplifying in degrees would make
 * the north of the country coarser than the south, because a degree of longitude
 * is shorter at higher latitudes — invisible in a diff, visible on a coastline.
 */

function perpendicularDistance(point, lineStart, lineEnd) {
  const [px, py] = point;
  const [ax, ay] = lineStart;
  const [bx, by] = lineEnd;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);

  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + clamped * dx), py - (ay + clamped * dy));
}

/** Iterative rather than recursive: a detailed coastline overflows the stack. */
export function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return [...points];

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let maxDistance = 0;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const distance = perpendicularDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (maxDistance > tolerance && index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i] === 1);
}

/** Signed area, used both to size a ring and to tell a hole from an island. */
export function ringArea(points) {
  let total = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    total += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
  }
  return total / 2;
}

/**
 * Simplifies one closed ring, keeping it closed and keeping it a polygon.
 *
 * Returns null when the ring collapses. A ring that simplifies to two points is
 * not a smaller island, it is a line, and drawing it puts a hairline artefact on
 * the map that looks like a bug because it is one.
 */
export function simplifyRing(ring, tolerance) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring;

  if (open.length <= 3) return closed ? [...open, open[0]] : [...open];

  const simplified = douglasPeucker(open, tolerance);
  if (simplified.length < 3) return null;

  return [...simplified, simplified[0]];
}

/**
 * Simplifies a polygon or multipolygon and drops rings smaller than
 * `minArea` in square view-box units.
 *
 * The area filter is what keeps an overview map from carrying two hundred
 * specks of sandbank that nobody can see and every device has to draw.
 */
export function simplifyRings(rings, tolerance, minArea) {
  const out = [];

  for (const ring of rings) {
    const simplified = simplifyRing(ring, tolerance);
    if (!simplified) continue;
    if (Math.abs(ringArea(simplified)) < minArea) continue;
    out.push(simplified);
  }

  return out;
}
