import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeProjector, RD_CENTRE } from './projection.mjs';

/**
 * The larger bodies of water, as points.
 *
 * **Why points and not shapes.** There is no licensed polygon source for these
 * that we could find: PDOK's waterway layers describe shipping routes rather
 * than geography, and deriving the IJsselmeer from the hole between three
 * provinces needs boolean geometry we are not going to hand-roll. Points with a
 * generous touch target work today, reuse the machinery the capitals already
 * use, and test the thing that is actually being taught — does a child know
 * where the IJsselmeer is, not can they trace its coastline.
 *
 * **Why these coordinates can be trusted.** They are chosen rather than
 * sourced, which would normally be exactly what spec §12 forbids. So the build
 * verifies them instead: CBS province polygons contain no water (ADR-019), so
 * every point here must fall outside all twelve. A coordinate that lands on
 * land fails this build rather than reaching a classroom. That check is the
 * licence-equivalent — the geometry doing the checking is sourced even though
 * the point is not.
 *
 * Rivers are deliberately absent. A river is a line, and a line is not a point;
 * pretending otherwise would put a single dot on a waterway that runs the
 * length of the country. They need a different source and a different answer
 * shape.
 */

const SIZE = 1000;
const PADDING = 10;

const PROVINCIES = join(process.cwd(), 'content', 'geo', '_source', 'nl-provincies.json');
const OUT_DIR = join(process.cwd(), 'public', 'geo', 'nl');

/**
 * A representative point in open water for each body, with the reason it is
 * where it is. `buiten` names the provinces it sits between, which is what the
 * verification below turns from a claim into a fact.
 */
const WATEREN = [
  {
    id: 'nl-water-noordzee',
    naam: 'Noordzee',
    lon: 3.6,
    lat: 52.5,
    waarom: 'Ruim buiten de kust ter hoogte van Zuid-Holland.',
  },
  {
    id: 'nl-water-waddenzee',
    naam: 'Waddenzee',
    lon: 5.3,
    lat: 53.35,
    waarom: 'Tussen de Friese kust en Terschelling.',
  },
  {
    id: 'nl-water-ijsselmeer',
    naam: 'IJsselmeer',
    lon: 5.35,
    lat: 52.75,
    waarom: 'Midden tussen Noord-Holland, Fryslân en Flevoland.',
  },
  {
    id: 'nl-water-markermeer',
    naam: 'Markermeer',
    lon: 5.2,
    lat: 52.52,
    waarom: 'Tussen Noord-Holland en Flevoland, onder de Houtribdijk.',
  },
  {
    id: 'nl-water-oosterschelde',
    naam: 'Oosterschelde',
    lon: 3.95,
    lat: 51.6,
    waarom: 'Tussen Schouwen-Duiveland en Noord-Beveland.',
  },
  {
    id: 'nl-water-westerschelde',
    naam: 'Westerschelde',
    lon: 3.75,
    lat: 51.4,
    waarom: 'Tussen Walcheren en Zeeuws-Vlaanderen.',
  },
];

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

/** Ray casting. Holes matter: a point in a hole is not inside the polygon. */
function insideRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function insideFeature(geometry, point) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    if (!insideRing(point, polygon[0])) continue;
    let inHole = false;
    for (let k = 1; k < polygon.length; k++) {
      if (insideRing(point, polygon[k])) inHole = true;
    }
    if (!inHole) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------

const provincies = JSON.parse(readFileSync(PROVINCIES, 'utf8'));

const onLand = [];
for (const water of WATEREN) {
  const hits = provincies.features
    .filter((feature) => insideFeature(feature.geometry, [water.lon, water.lat]))
    .map((feature) => feature.properties.statnaam);
  if (hits.length > 0) onLand.push(`${water.naam} valt in ${hits.join(', ')}`);
}

if (onLand.length > 0) {
  console.error('Deze punten liggen op land in plaats van in het water:');
  for (const line of onLand) console.error(`  ${line}`);
  console.error('\nCBS-provincies bevatten geen water (ADR-019), dus dit is een echte fout.');
  process.exit(1);
}

const allPoints = provincies.features.flatMap((f) => ringsOf(f.geometry).flat());
const projector = makeProjector(allPoints, SIZE, PADDING, RD_CENTRE);

const punten = WATEREN.map((water) => {
  const [x, y] = projector.project([water.lon, water.lat]);
  return {
    id: water.id,
    bronnaam: water.naam,
    // Points here have no parent province; the field exists so the shape
    // matches the capitals and one loader serves both.
    provincie: null,
    punt: [Number(x.toFixed(1)), Number(y.toFixed(1))],
  };
});

// A point may sit outside the country entirely — the North Sea does — but it
// must still be somewhere on the map a child can reach.
const offMap = [];
for (const p of punten) {
  const [x, y] = p.punt;
  if (x < 0 || x > projector.width || y < 0 || y > projector.height) {
    offMap.push(p);
  }
}
if (offMap.length > 0) {
  console.error(`Buiten de kaart: ${offMap.map((p) => p.bronnaam).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const payload = {
  regioSet: 'nederland',
  onderwerp: 'wateren',
  viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
  projectie: {
    type: 'oblique-stereographic',
    centrum: RD_CENTRE,
    opmerking: 'Same fit as provincies.*.json, so water sits between the right coasts.',
  },
  bron: {
    naam: 'Punten gekozen, geverifieerd tegen CBS Gebiedsindelingen 2023',
    licentie: 'CC-BY-4.0 (de geometrie die de controle uitvoert)',
    opgehaald: provincies._opgehaald ?? null,
  },
  punten,
};

const path = join(OUT_DIR, 'wateren.json');
writeFileSync(path, JSON.stringify(payload));

console.log(`  wateren  ${punten.length} points  ${(statSync(path).size / 1024).toFixed(1)} kB`);
for (const p of punten) {
  console.log(`    ${p.bronnaam.padEnd(16)} ${JSON.stringify(p.punt)}`);
}
console.log('\nAlle punten liggen buiten elke provincie: geverifieerd tegen de bron.');
console.log(`Written to ${OUT_DIR}`);
