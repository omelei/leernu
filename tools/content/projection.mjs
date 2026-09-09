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

// ---------------------------------------------------------------------------
// Beyond the Netherlands
//
// One projection cannot serve a country, a continent and a globe. The
// stereographic above is right for the Netherlands because RD is, and it stays
// right for a continent as long as it is re-centred; it is useless for a world
// map, where a whole hemisphere would run off to infinity.
//
// So there are two, both written out in closed form for the reason the file
// opens with: a projection that is subtly wrong makes a map that looks
// plausible and teaches a child something false, and that is the failure nobody
// catches in review. Every formula here can be checked against its definition
// on one line.

/**
 * The centre for a map of Europe: 52° N, 15° E.
 *
 * Roughly western Poland, which is the middle of the landmass rather than the
 * middle of the European Union — Iceland, Portugal and the Urals all have to
 * fit, and centring on Brussels would have put half the distortion budget in
 * the Atlantic.
 */
export const EUROPE_CENTRE = { lat: 52, lon: 15 };

/**
 * Miller cylindrical, for the world.
 *
 *   x = λ
 *   y = 1.25 · ln( tan( π/4 + 0.4·φ ) )
 *
 * Mercator with the latitude scaled to four fifths before the projection and
 * back up by five fourths after it, which is exactly what Miller published in
 * 1942 and the whole of what it is. Straight meridians, straight parallels, and
 * no direction is right except north — a compromise, and the compromise every
 * schoolroom wall map makes.
 *
 * Mercator itself is what a child already knows from a phone, and it is the one
 * we may not use: it draws Greenland the size of Africa, and this product
 * exists to teach where things are and how big they are. Equirectangular is
 * honest and unrecognisable — the poles smear into bands as wide as the
 * equator. Miller is between them and is a real projection rather than a
 * fudge.
 *
 * Latitudes are clamped just short of the poles, where the logarithm runs away.
 * Nothing in a set of countries reaches 89°.
 */
export function miller(lon, lat) {
  const phi = Math.max(-89.5, Math.min(89.5, lat)) * RAD;
  return [lon * RAD, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))];
}

/**
 * A projector for a region, given the projection it should use.
 *
 * The same shape `makeProjector` returns, so the geometry builds do not have to
 * know which projection they are standing on — only which one to ask for.
 */
export function makeProjectorWith(project, allLonLat, size = 1000, padding = 10) {
  const projected = allLonLat.map(([lon, lat]) => project(lon, lat));
  const fit = fitToViewBox(projected, size, padding);
  return {
    ...fit,
    project([lon, lat]) {
      return fit.toViewBox(project(lon, lat));
    },
  };
}
