import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeProjector, RD_CENTRE } from './projection.mjs';

/**
 * The cities, ranked rather than chosen.
 *
 * Spec §3.1 asks for roughly eighty places in three layers. Which eighty is a
 * curriculum question, and answering it from memory would be the weakest thing
 * in this whole product — a list nobody could check and everybody would have an
 * opinion about. So it is derived: CBS population per municipality, largest
 * first, three layers of 25 / 30 / 25.
 *
 * **Two honest limits, stated rather than hidden.**
 *
 * A municipality is not a city. Amalgamations like Westland and Haarlemmermeer
 * rank high and are not places a child learns as cities — Hoofddorp is, and it
 * is a town inside Haarlemmermeer. Those are excluded by name below, which is an
 * editorial judgement and the one part of this file that is opinion.
 *
 * Population is also not the same thing as curriculum importance. Vaals matters
 * for where it is, not for how many live there. A ranked list is a defensible
 * starting point, not a finished leerlijn, and docs/CURRICULUM.md is where that
 * gets settled once the kerndoelen are mapped.
 *
 * The provincial capitals are left out: they are their own set already, and
 * teaching Groningen twice under two headings helps nobody.
 */

const SIZE = 1000;
const PADDING = 10;

/** Spec §3.1: 25 basis, 30 gevorderd, 25 expert. */
const LAGEN = [
  { niveau: 1, aantal: 25 },
  { niveau: 2, aantal: 30 },
  { niveau: 3, aantal: 25 },
];

/**
 * Municipalities that rank high and are not cities: mergers named after a
 * region rather than a town. A child learns Hoofddorp, not Haarlemmermeer.
 *
 * This list is **editorial**, and deliberately the only editorial thing in the
 * file — everything else is derived from a licensed source. CBS publishes
 * municipalities, and there is no licensed dataset that says which
 * municipalities are also places. Asking a child to point at "Utrechtse
 * Heuvelrug" would be asking them to point at a landscape that spec §3.1 lists
 * separately, so the judgement has to be made somewhere and is made here, in
 * the open, where it can be argued with.
 *
 * The rule applied: keep the name if a place is called that, drop it if only
 * the municipality is. Sittard-Geleen and Alphen aan den Rijn stay — they are
 * on the school atlas. Velsen goes; the town is IJmuiden.
 */
const GEEN_STAD = new Set([
  // Genoemd naar een landschap of een streek, niet naar een plaats. De
  // Utrechtse Heuvelrug staat in spec §3.1 zelfs als landschap, niet als stad.
  'Utrechtse Heuvelrug',
  'Oude IJsselstreek',
  'Teylingen',
  'Smallingerland',
  'Velsen',
  'Rheden',
  'Leidschendam-Voorburg',
  'Haarlemmermeer',
  'Westland',
  'Súdwest-Fryslân',
  'Noardeast-Fryslân',
  'Hollands Kroon',
  'Land van Cuijk',
  'Dijk en Waard',
  'Altena',
  'Berkelland',
  'Bronckhorst',
  'Peel en Maas',
  'De Fryske Marren',
  'Midden-Groningen',
  'Het Hogeland',
  'Eemsdelta',
  'Noordoostpolder',
  'Steenwijkerland',
  'Hoeksche Waard',
  'Goeree-Overflakkee',
  'Schouwen-Duiveland',
  'Zuidplas',
  'Krimpenerwaard',
  'Molenlanden',
  'Vijfheerenlanden',
  'Bodegraven-Reeuwijk',
  'Stichtse Vecht',
  'De Ronde Venen',
  'Meierijstad',
  'Maashorst',
  'Voorne aan Zee',
  'Nissewaard',
  'Lansingerland',
  'Pijnacker-Nootdorp',
  'Wijdemeren',
  'Gooise Meren',
  'Blaricum',
  'Waadhoeke',
  'Westerkwartier',
  'Westerveld',
  'Oldambt',
  'Twenterand',
  'Hof van Twente',
  'Dinkelland',
  'Tubbergen',
  'Berg en Dal',
  'West Betuwe',
  'Buren',
  'Neder-Betuwe',
  'Overbetuwe',
  'Lingewaard',
  'Montferland',
  'Bergen (L.)',
  'Bergen (NH.)',
  'Beekdaelen',
  'Eijsden-Margraten',
  'Gulpen-Wittem',
  'Vaals',
  'Horst aan de Maas',
  'Leudal',
  'Nederweert',
  'Maasgouw',
  'Echt-Susteren',
  'Beesel',
  'Drimmelen',
  'Moerdijk',
  'Halderberge',
  'Rucphen',
  'Zundert',
  'Baarle-Nassau',
  'Alphen-Chaam',
  'Gilze en Rijen',
  'Loon op Zand',
  'Heusden',
  'Waalwijk',
  'Sint-Michielsgestel',
  'Boekel',
  'Laarbeek',
  'Gemert-Bakel',
  'Someren',
  'Asten',
  'Deurne',
  'Cranendonck',
  'Heeze-Leende',
  'Bergeijk',
  'Bladel',
  'Reusel-De Mierden',
  'Eersel',
  'Oirschot',
  'Best',
  'Son en Breugel',
  'Nuenen, Gerwen en Nederwetten',
  'Geldrop-Mierlo',
  'Waterland',
  'Landsmeer',
  'Oostzaan',
  'Wormerland',
  'Beemster',
  'Edam-Volendam',
  'Koggenland',
  'Opmeer',
  'Medemblik',
  'Stede Broec',
  'Drechterland',
  'Texel',
  'Vlieland',
  'Terschelling',
  'Ameland',
  'Schiermonnikoog',
]);

/** Already covered by their own set. */
const HOOFDSTEDEN = new Set([
  'Groningen',
  'Leeuwarden',
  'Assen',
  'Zwolle',
  'Lelystad',
  'Arnhem',
  'Utrecht',
  'Haarlem',
  "'s-Gravenhage",
  'Middelburg',
  "'s-Hertogenbosch",
  'Maastricht',
]);

const SOURCE_DIR = join(process.cwd(), 'content', 'geo', '_source');
const OUT_DIR = join(process.cwd(), 'public', 'geo', 'nl');

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

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
    for (let k = 1; k < polygon.length; k++) if (insideRing(point, polygon[k])) inHole = true;
    if (!inHole) return true;
  }
  return false;
}

function slug(naam) {
  return naam
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------

const provincies = JSON.parse(readFileSync(join(SOURCE_DIR, 'nl-provincies.json'), 'utf8'));
const labelpunten = JSON.parse(readFileSync(join(SOURCE_DIR, 'nl-gemeenten-labelpunten.json'), 'utf8'));
const gemeenten = JSON.parse(readFileSync(join(SOURCE_DIR, 'nl-gemeenten.json'), 'utf8'));
const bevolking = JSON.parse(readFileSync(join(SOURCE_DIR, 'nl-bevolking.json'), 'utf8'));

const inwonersByCode = new Map();
for (const row of bevolking.value ?? []) {
  if (row.TotaleBevolking_1) inwonersByCode.set(row.RegioS.trim(), row.TotaleBevolking_1);
}
console.log(`Bevolking: ${inwonersByCode.size} gemeenten met een inwonertal`);

/**
 * CBS publishes two label points for Amsterdam: the municipality is not one
 * piece — Zuidoost is separated from the rest by Ouder-Amstel — so each part
 * gets its own. Keeping both would ask a child about Amsterdam twice, so we
 * keep the one inside the largest part of the municipality rather than
 * whichever happens to come first in the file.
 */
const grootsteRing = new Map();
for (const feature of gemeenten.features) {
  let biggest = null;
  let biggestSize = 0;
  for (const ring of ringsOf(feature.geometry)) {
    if (ring.length > biggestSize) {
      biggestSize = ring.length;
      biggest = ring;
    }
  }
  if (biggest) grootsteRing.set(feature.properties.statcode, biggest);
}

const gezien = new Set();
const uniekePunten = labelpunten.features.filter((feature) => {
  const code = feature.properties.statcode;
  if (!gezien.has(code)) {
    gezien.add(code);
    return true;
  }
  // A second point for a code we have already taken: keep it only if the one
  // we took is not in the main part and this one is.
  const ring = grootsteRing.get(code);
  return ring ? insideRing(feature.geometry.coordinates, ring) : false;
});

const kandidaten = uniekePunten
  .map((feature) => ({
    naam: feature.properties.statnaam,
    code: feature.properties.statcode,
    lonLat: feature.geometry.coordinates,
    inwoners: inwonersByCode.get(feature.properties.statcode) ?? 0,
  }))
  .filter((c) => c.inwoners > 0)
  .filter((c) => !HOOFDSTEDEN.has(c.naam))
  .filter((c) => !GEEN_STAD.has(c.naam))
  .sort((a, b) => b.inwoners - a.inwoners);

const gevraagd = LAGEN.reduce((sum, laag) => sum + laag.aantal, 0);
if (kandidaten.length < gevraagd) {
  console.error(`Maar ${kandidaten.length} kandidaten voor ${gevraagd} plaatsen.`);
  process.exit(1);
}

const allPoints = provincies.features.flatMap((f) => ringsOf(f.geometry).flat());
const projector = makeProjector(allPoints, SIZE, PADDING, RD_CENTRE);

const punten = [];
const zonderProvincie = [];
let index = 0;

for (const laag of LAGEN) {
  for (let n = 0; n < laag.aantal; n++) {
    const stad = kandidaten[index++];

    // The province the city sits in, computed rather than declared. It is also
    // the fact the item teaches: a city is learned together with where it is.
    const provincie = provincies.features.find((f) => insideFeature(f.geometry, stad.lonLat));
    if (!provincie) {
      zonderProvincie.push(stad.naam);
      continue;
    }

    const [x, y] = projector.project(stad.lonLat);
    punten.push({
      id: `nl-stad-${slug(stad.naam)}`,
      bronnaam: stad.naam,
      provincie: `nl-prov-${slug(provincie.properties.statnaam)}`,
      provincieNaam: provincie.properties.statnaam,
      inwoners: stad.inwoners,
      niveau: laag.niveau,
      punt: [Number(x.toFixed(1)), Number(y.toFixed(1))],
    });
  }
}

if (zonderProvincie.length > 0) {
  console.error(`Geen provincie gevonden voor: ${zonderProvincie.join(', ')}`);
  console.error('Het labelpunt valt buiten elke provincie, wat op een fout in de bron wijst.');
  process.exit(1);
}

const dubbel = punten.map((p) => p.id).filter((id, i, all) => all.indexOf(id) !== i);
if (dubbel.length > 0) {
  console.error(`Dubbele steden: ${[...new Set(dubbel)].join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const payload = {
  regioSet: 'nederland',
  onderwerp: 'steden',
  viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
  projectie: {
    type: 'oblique-stereographic',
    centrum: RD_CENTRE,
    opmerking: 'Same fit as provincies.*.json.',
  },
  bron: {
    naam: 'CBS Gebiedsindelingen 2023 en CBS StatLine 70072ned',
    licentie: 'CC-BY-4.0',
    opgehaald: labelpunten._opgehaald ?? null,
  },
  // Spelled out rather than stripped with a rest element: this is the file a
  // child downloads, so what it does *not* contain is worth being able to read.
  // Population and level decide the set and then stay behind in content/sets;
  // shipping them would be bytes on a school network for facts the map never
  // shows.
  punten: punten.map((stad) => ({
    id: stad.id,
    bronnaam: stad.bronnaam,
    provincie: stad.provincie,
    punt: stad.punt,
  })),
};

const path = join(OUT_DIR, 'steden.json');
writeFileSync(path, JSON.stringify(payload));

console.log(`\n  steden  ${punten.length} points  ${(statSync(path).size / 1024).toFixed(1)} kB`);
for (const laag of LAGEN) {
  const inLaag = punten.filter((p) => p.niveau === laag.niveau);
  console.log(
    `    niveau ${laag.niveau}: ${inLaag.length} steden, ${inLaag[0]?.bronnaam} tot ${inLaag.at(-1)?.bronnaam}`,
  );
}

// The content set is generated too: eighty items is not something to type, and
// the derived fact is one nobody can get wrong.
const items = punten.map((stad) => ({
  id: stad.id,
  type: 'stad',
  naam: stad.bronnaam,
  aliassen: [],
  regioSet: 'nederland',
  geometrieRef: stad.id,
  niveau: stad.niveau,
  leerdoelen: ['ak-nl-steden'],
  relaties: { ligtIn: stad.provincie },
  weetje: `${stad.bronnaam} ligt in de provincie ${stad.provincieNaam}.`,
}));

/**
 * `JSON.stringify(x, null, 2)` and Prettier agree on everything except short
 * arrays, which Prettier puts on one line. This file lives among four
 * hand-written sets that Prettier does format, so it has to match them — the
 * alternative is an ignore rule that makes the one generated set the odd one
 * out and hides real formatting drift.
 */
function prettyJson(value) {
  // Prettier leaves an object or array on one line if the source had it there
  // and it fits, so emitting the collapsed form is what keeps this file looking
  // like the four hand-written sets beside it. The width check is not optional:
  // put something over 100 columns on one line and Prettier expands it again,
  // and format:check fails on a file nobody edited.
  const fits = (offset, text, oneLine) =>
    offset - text.lastIndexOf('\n', offset) - 1 + oneLine.length <= 100;

  return JSON.stringify(value, null, 2)
    .replace(/\[\n\s*((?:"[^"\n]*",?\n\s*)+)\]/g, (whole, inner, offset, text) => {
      const oneLine = `[${inner.trim().split(/,\s*/).join(', ')}]`;
      return fits(offset, text, oneLine) ? oneLine : whole;
    })
    .replace(/\{\n\s*("[^"\n]*": "[^"\n]*")\n\s*\}/g, (whole, inner, offset, text) => {
      const oneLine = `{ ${inner} }`;
      return fits(offset, text, oneLine) ? oneLine : whole;
    });
}

const setPath = join(process.cwd(), 'content', 'sets', 'nl-steden.json');
writeFileSync(
  setPath,
  prettyJson({
    id: 'nl-steden',
    naam: 'Steden van Nederland',
    regioSet: 'nederland',
    contentVersie: new Date().toISOString().slice(0, 10),
    _herkomst:
      'Gegenereerd door tools/content/build-steden.mjs. De selectie is CBS-bevolking, grootste eerst, in drie lagen van 25/30/25, met de provinciehoofdsteden eruit en een handmatige uitsluitlijst van gemeenten die geen stad zijn. Het weetje is afgeleid uit de geometrie en kan dus niet fout zijn.',
    _redactie:
      'De selectie is een verdedigbaar beginpunt, geen afgeronde leerlijn: inwonertal is niet hetzelfde als curriculumbelang. Nakijken tegen een schoolmethode zodra docs/CURRICULUM.md bestaat.',
      items,
    },
    null,
    2,
  ) + '\n',
);

console.log(`\nContentset geschreven: ${setPath}`);
console.log(`Written to ${OUT_DIR}`);
