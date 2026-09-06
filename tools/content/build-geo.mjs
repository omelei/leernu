import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeProjector, RD_CENTRE } from './projection.mjs';
import { ringArea, simplifyRings } from './simplify.mjs';

/**
 * Turns raw PDOK geometry into the three detail levels the renderer ships.
 *
 * Order matters and is not obvious: project first, then simplify. Simplifying
 * in degrees would make the north coarser than the south, because a degree of
 * longitude shrinks towards the pole. Everything downstream is in view-box
 * units, where a tolerance means one thing everywhere.
 *
 * Output is SVG path data rather than coordinate arrays. It is roughly half the
 * size, the renderer can hand it straight to a <path>, and hit testing comes
 * free from the browser's own isPointInFill.
 */

const SIZE = 1000;
const PADDING = 10;

/**
 * Tolerances in view-box units, so 1.0 is a thousandth of the map's width.
 * minArea drops rings too small to see; without it an overview map carries two
 * hundred specks of sandbank that every device still has to draw.
 */
const LEVELS = [
  { naam: 'overview', tolerance: 2.0, minArea: 6 },
  { naam: 'region', tolerance: 0.6, minArea: 1.5 },
  { naam: 'detail', tolerance: 0.15, minArea: 0.3 },
];

const SOURCE = join(process.cwd(), 'content', 'geo', '_source', 'nl-provincies.json');
const LABELS = join(process.cwd(), 'content', 'geo', '_source', 'nl-provincies-labelpunten.json');
const OUT_DIR = join(process.cwd(), 'public', 'geo', 'nl');

function slug(naam) {
  return naam
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Every ring of a Polygon or MultiPolygon, flattened. */
function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

function toPath(rings, decimals = 1) {
  const round = (n) => Number(n.toFixed(decimals));
  return rings
    .map((ring) => {
      const [start, ...rest] = ring;
      const head = `M${round(start[0])} ${round(start[1])}`;
      const tail = rest.slice(0, -1).map(([x, y]) => `L${round(x)} ${round(y)}`);
      return `${head}${tail.join('')}Z`;
    })
    .join('');
}

/**
 * Fallback label anchor: the centroid of the largest ring.
 *
 * Only used when CBS has no label point for a province. Centroids are wrong for
 * concave shapes — Zeeland is the obvious case, where the centroid lands in the
 * water — which is exactly why CBS publishes label points and we prefer them.
 */
function centroidOfLargestRing(rings) {
  let largest = null;
  let largestArea = 0;

  for (const ring of rings) {
    const area = Math.abs(ringArea(ring));
    if (area > largestArea) {
      largestArea = area;
      largest = ring;
    }
  }

  if (!largest) return null;

  let x = 0;
  let y = 0;
  for (const [px, py] of largest) {
    x += px;
    y += py;
  }
  return [Number((x / largest.length).toFixed(1)), Number((y / largest.length).toFixed(1))];
}

/**
 * Bounding box of a shape, in view-box units.
 *
 * The renderer needs it to answer one question: is this shape too small to hit?
 * Vlieland is about a thousandth of the map. Without a bounding box the only way
 * to find out is to render and measure, and by then the child has already missed.
 */
function boundingBox(rings) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const round = (n) => Number(n.toFixed(1));
  return [round(minX), round(minY), round(maxX), round(maxY)];
}

// ---------------------------------------------------------------------------

let source;
try {
  source = JSON.parse(readFileSync(SOURCE, 'utf8'));
} catch {
  console.error(`Source not found: ${SOURCE}`);
  console.error('Run: node tools/content/fetch-source.mjs');
  process.exit(1);
}

const features = source.features;
console.log(`Source: ${features.length} features, ${source._bron ?? 'unknown origin'}`);

/** CBS label points, keyed by statcode. Preferred over a computed centroid. */
const labelByCode = new Map();
try {
  const labels = JSON.parse(readFileSync(LABELS, 'utf8'));
  for (const feature of labels.features) {
    labelByCode.set(feature.properties.statcode, feature.geometry.coordinates);
  }
  console.log(`Labels: ${labelByCode.size} official label points`);
} catch {
  console.warn('No label points found; falling back to centroids.');
}

// One projector for the whole set, so every detail level lines up pixel for
// pixel. Fitting each level separately would make them drift apart on zoom.
const allPoints = features.flatMap((f) => ringsOf(f.geometry).flat());
const projector = makeProjector(allPoints, SIZE, PADDING, RD_CENTRE);

const projectedByFeature = features.map((feature) => {
  const code = feature.properties.statcode ?? null;
  const labelLonLat = code ? labelByCode.get(code) : undefined;

  return {
    naam: feature.properties.statnaam,
    code,
    label: labelLonLat ? projector.project(labelLonLat) : null,
    rings: ringsOf(feature.geometry).map((ring) => ring.map((c) => projector.project(c))),
  };
});

mkdirSync(OUT_DIR, { recursive: true });

for (const level of LEVELS) {
  const vormen = [];
  let ringsBefore = 0;
  let ringsAfter = 0;
  let pointsAfter = 0;

  for (const feature of projectedByFeature) {
    ringsBefore += feature.rings.length;
    const rings = simplifyRings(feature.rings, level.tolerance, level.minArea);
    if (rings.length === 0) {
      console.warn(`  ! ${feature.naam} disappeared entirely at ${level.naam}`);
      continue;
    }
    ringsAfter += rings.length;
    pointsAfter += rings.reduce((sum, r) => sum + r.length, 0);

    const punt = feature.label ?? centroidOfLargestRing(rings);

    vormen.push({
      id: `nl-prov-${slug(feature.naam)}`,
      bronnaam: feature.naam,
      code: feature.code,
      d: toPath(rings),
      punt: punt ? [Number(punt[0].toFixed(1)), Number(punt[1].toFixed(1))] : null,
      bbox: boundingBox(rings),
    });
  }

  const payload = {
    regioSet: 'nederland',
    onderwerp: 'provincies',
    detailniveau: level.naam,
    viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
    projectie: {
      type: 'oblique-stereographic',
      centrum: RD_CENTRE,
      opmerking: 'RD-shaped, not RD: no ellipsoid, no false origin, no metre scale.',
    },
    bron: {
      naam: source._bron ?? null,
      licentie: source._licentie ?? null,
      opgehaald: source._opgehaald ?? null,
    },
    vormen,
  };

  const path = join(OUT_DIR, `provincies.${level.naam}.json`);
  writeFileSync(path, JSON.stringify(payload));

  const kb = (statSync(path).size / 1024).toFixed(1);
  console.log(
    `  ${level.naam.padEnd(9)} ${String(vormen.length).padStart(2)} shapes  ` +
      `${String(ringsAfter).padStart(4)}/${ringsBefore} rings  ` +
      `${String(pointsAfter).padStart(5)} points  ${kb.padStart(7)} kB`,
  );
}

console.log(`\nWritten to ${OUT_DIR}`);
