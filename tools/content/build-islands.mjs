import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeProjector, RD_CENTRE } from './projection.mjs';
import { ringArea, simplifyRings } from './simplify.mjs';

/**
 * The five Wadden islands, projected into the same view box as the provinces.
 *
 * These are the smallest shapes the product has by a wide margin, and that is
 * the point of building them: a province is 125 pixels across on a school
 * laptop and needs no help, while Vlieland is a few. Everything about the touch
 * target written back in September was built for this set.
 *
 * Simplified far less than the provinces, for the same reason. A tolerance that
 * is invisible on Gelderland removes half of Schiermonnikoog.
 */

const SIZE = 1000;
const PADDING = 10;

/** Gentle: at this scale an island is barely wider than the tolerance itself. */
const TOLERANCE = 0.08;
const MIN_AREA = 0.02;

const PROVINCIES = join(process.cwd(), 'content', 'geo', '_source', 'nl-provincies.json');
const GEMEENTEN = join(process.cwd(), 'content', 'geo', '_source', 'nl-gemeenten.json');
const OUT_DIR = join(process.cwd(), 'public', 'geo', 'nl');

/** West to east, which is also how a Dutch child learns to recite them. */
const EILANDEN = [
  { id: 'nl-eiland-texel', gemeente: 'Texel' },
  { id: 'nl-eiland-vlieland', gemeente: 'Vlieland' },
  { id: 'nl-eiland-terschelling', gemeente: 'Terschelling' },
  { id: 'nl-eiland-ameland', gemeente: 'Ameland' },
  { id: 'nl-eiland-schiermonnikoog', gemeente: 'Schiermonnikoog' },
];

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

function toPath(rings, decimals = 2) {
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
  const round = (n) => Number(n.toFixed(2));
  return [round(minX), round(minY), round(maxX), round(maxY)];
}

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
  return [Number((x / largest.length).toFixed(2)), Number((y / largest.length).toFixed(2))];
}

// ---------------------------------------------------------------------------

const provincies = JSON.parse(readFileSync(PROVINCIES, 'utf8'));
const gemeenten = JSON.parse(readFileSync(GEMEENTEN, 'utf8'));

// The identical fit, rebuilt from the province geometry: an island projected
// against its own bounds would sit off the coast it belongs to.
const allPoints = provincies.features.flatMap((f) => ringsOf(f.geometry).flat());
const projector = makeProjector(allPoints, SIZE, PADDING, RD_CENTRE);

const byName = new Map(gemeenten.features.map((f) => [f.properties.statnaam, f]));

const vormen = [];
const missing = [];

for (const eiland of EILANDEN) {
  const feature = byName.get(eiland.gemeente);
  if (!feature) {
    missing.push(eiland.gemeente);
    continue;
  }

  const projected = ringsOf(feature.geometry).map((ring) =>
    ring.map((coordinate) => projector.project(coordinate)),
  );
  const rings = simplifyRings(projected, TOLERANCE, MIN_AREA);

  if (rings.length === 0) {
    missing.push(`${eiland.gemeente} (simplified away)`);
    continue;
  }

  const punt = centroidOfLargestRing(rings);
  vormen.push({
    id: eiland.id,
    bronnaam: feature.properties.statnaam,
    code: feature.properties.statcode ?? null,
    d: toPath(rings),
    punt,
    bbox: boundingBox(rings),
  });
}

if (missing.length > 0) {
  console.error(`Missing: ${missing.join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const payload = {
  regioSet: 'nederland',
  onderwerp: 'waddeneilanden',
  detailniveau: 'detail',
  viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
  projectie: {
    type: 'oblique-stereographic',
    centrum: RD_CENTRE,
    opmerking: 'Same fit as provincies.*.json, so islands sit on their own coast.',
  },
  bron: {
    naam: gemeenten._bron ?? null,
    licentie: gemeenten._licentie ?? null,
    opgehaald: gemeenten._opgehaald ?? null,
  },
  vormen,
};

const path = join(OUT_DIR, 'waddeneilanden.json');
writeFileSync(path, JSON.stringify(payload));

console.log(
  `  waddeneilanden  ${vormen.length} shapes  ${(statSync(path).size / 1024).toFixed(1)} kB`,
);
for (const vorm of vormen) {
  const [minX, minY, maxX, maxY] = vorm.bbox;
  console.log(
    `    ${vorm.bronnaam.padEnd(18)} ${(maxX - minX).toFixed(1)} x ${(maxY - minY).toFixed(1)} units`,
  );
}
console.log(`\nWritten to ${OUT_DIR}`);
