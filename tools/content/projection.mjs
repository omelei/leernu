/**
 * Oblique stereographic projection, and fitting the result into a view box.
 *
 * Written out rather than pulled from d3-geo (amending ADR-004) for one reason:
 * a subtly wrong projection produces a map that looks entirely plausible and is
 * wrong. That is the failure nobody catches in review and a child learns anyway.
 * Owning the thirty lines means the pipeline runs anywhere, including on a
 * machine that cannot install packages, so the output can be checked against
 * known coordinates before it ships.
 *
 * The Netherlands uses stereographic and not conic: RD (Amersfoort,
 * EPSG:28992) is an oblique stereographic projection centred on the Amersfoort
 * tower. We use the same centre. This is not RD — there is no ellipsoid, no
 * false origin and no metre scale — it is RD's shape, which is all a map for
 * children needs.
 */

/** Amersfoort, the RD origin: 52°09'22.178" N, 5°23'15.500" E. */
export const RD_CENTRE = { lat: 52.15616055, lon: 5.38763889 };

const RAD = Math.PI / 180;

/**
 * Spherical oblique stereographic. Returns unitless x east, y north, centred on
 * the projection origin. Scale is arbitrary; `fitToViewBox` normalises it.
 */
export function stereographic(lon, lat, centre = RD_CENTRE) {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  const phi0 = centre.lat * RAD;
  const lambda0 = centre.lon * RAD;

  const dLambda = lambda - lambda0;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const cosDLambda = Math.cos(dLambda);

  const k = 2 / (1 + sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDLambda);

  return [k * cosPhi * Math.sin(dLambda), k * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDLambda)];
}

/**
 * Builds a transform that maps projected coordinates into a view box whose
 * shape follows the region, flipping y for screen space.
 *
 * The long axis gets `size`; the short axis gets whatever it needs. Emitting a
 * square would waste a third of the width on the Netherlands, which is far
 * taller than it is wide — and that waste is not free. A square view box turns
 * a full-screen map into a small one with empty water either side, which is
 * precisely the failure this product is meant to beat.
 *
 * Uniform scale on both axes, deliberately: stretching a country to fill a box
 * is the same lie as a bad projection, just more obvious.
 */
export function fitToViewBox(projectedPoints, size = 1000, padding = 10) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of projectedPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = (size - padding * 2) / Math.max(spanX, spanY);

  return {
    scale,
    bounds: { minX, minY, maxX, maxY },
    width: spanX * scale + padding * 2,
    height: spanY * scale + padding * 2,
    /** Projected coordinate to view-box coordinate. y is flipped: north is up. */
    toViewBox([x, y]) {
      return [(x - minX) * scale + padding, (maxY - y) * scale + padding];
    },
  };
}

/** Projects a lon/lat pair straight into the view box. */
export function makeProjector(allLonLat, size = 1000, padding = 10, centre = RD_CENTRE) {
  const projected = allLonLat.map(([lon, lat]) => stereographic(lon, lat, centre));
  const fit = fitToViewBox(projected, size, padding);
  return {
    ...fit,
    project([lon, lat]) {
      return fit.toViewBox(stereographic(lon, lat, centre));
    },
  };
}
