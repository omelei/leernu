import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeProjector, RD_CENTRE } from './projection.mjs';

/**
 * Projects the twelve provincial capitals into the same view box as the
 * provinces, so a city dot and a province outline line up exactly.
 *
 * The projector is rebuilt from the province geometry rather than stored,
 * because it must be the identical fit: a city projected against its own
 * bounding box would sit a few pixels off the province it belongs to, and on a
 * map that reads as an error even when the coordinates are right.
 */

const SIZE = 1000;
const PADDING = 10;

const SOURCE = join(process.cwd(), 'content', 'geo', '_source', 'nl-provincies.json');
const GEMEENTEN = join(process.cwd(), 'content', 'geo', '_source', 'nl-gemeenten-labelpunten.json');
const OUT_DIR = join(process.cwd(), 'public', 'geo', 'nl');

/**
 * Capital per province, by the municipality CBS names it. Den Haag is
 * 's-Gravenhage in the register and Den Haag to a child; the content set holds
 * the name a child is taught, this map only has to find the coordinate.
 */
const HOOFDSTEDEN = [
  { id: 'nl-stad-groningen', gemeente: 'Groningen', provincie: 'nl-prov-groningen' },
  { id: 'nl-stad-leeuwarden', gemeente: 'Leeuwarden', provincie: 'nl-prov-fryslan' },
  { id: 'nl-stad-assen', gemeente: 'Assen', provincie: 'nl-prov-drenthe' },
  { id: 'nl-stad-zwolle', gemeente: 'Zwolle', provincie: 'nl-prov-overijssel' },
  { id: 'nl-stad-lelystad', gemeente: 'Lelystad', provincie: 'nl-prov-flevoland' },
  { id: 'nl-stad-arnhem', gemeente: 'Arnhem', provincie: 'nl-prov-gelderland' },
  { id: 'nl-stad-utrecht', gemeente: 'Utrecht', provincie: 'nl-prov-utrecht' },
  { id: 'nl-stad-haarlem', gemeente: 'Haarlem', provincie: 'nl-prov-noord-holland' },
  { id: 'nl-stad-den-haag', gemeente: "'s-Gravenhage", provincie: 'nl-prov-zuid-holland' },
  { id: 'nl-stad-middelburg', gemeente: 'Middelburg', provincie: 'nl-prov-zeeland' },
  { id: 'nl-stad-den-bosch', gemeente: "'s-Hertogenbosch", provincie: 'nl-prov-noord-brabant' },
  { id: 'nl-stad-maastricht', gemeente: 'Maastricht', provincie: 'nl-prov-limburg' },
];

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

const provincies = JSON.parse(readFileSync(SOURCE, 'utf8'));
const gemeenten = JSON.parse(readFileSync(GEMEENTEN, 'utf8'));

const allPoints = provincies.features.flatMap((f) => ringsOf(f.geometry).flat());
const projector = makeProjector(allPoints, SIZE, PADDING, RD_CENTRE);

const byName = new Map();
for (const feature of gemeenten.features) {
  byName.set(feature.properties.statnaam, feature.geometry.coordinates);
}

const punten = [];
const missing = [];

for (const stad of HOOFDSTEDEN) {
  const lonLat = byName.get(stad.gemeente);
  if (!lonLat) {
    missing.push(stad.gemeente);
    continue;
  }
  const [x, y] = projector.project(lonLat);
  punten.push({
    id: stad.id,
    bronnaam: stad.gemeente,
    provincie: stad.provincie,
    punt: [Number(x.toFixed(1)), Number(y.toFixed(1))],
  });
}

if (missing.length > 0) {
  console.error(`Not found in the municipality register: ${missing.join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const payload = {
  regioSet: 'nederland',
  onderwerp: 'hoofdsteden',
  viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
  projectie: {
    type: 'oblique-stereographic',
    centrum: RD_CENTRE,
    opmerking: 'Same fit as provincies.*.json, so points and outlines line up.',
  },
  bron: {
    naam: gemeenten._bron ?? null,
    licentie: gemeenten._licentie ?? null,
    opgehaald: gemeenten._opgehaald ?? null,
  },
  punten,
};

const path = join(OUT_DIR, 'hoofdsteden.json');
writeFileSync(path, JSON.stringify(payload));

console.log(
  `  hoofdsteden  ${punten.length} points  ${(statSync(path).size / 1024).toFixed(1)} kB`,
);
console.log(`\nWritten to ${OUT_DIR}`);
