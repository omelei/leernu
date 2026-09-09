import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EUROPE_CENTRE, makeProjectorWith, miller, stereographic } from './projection.mjs';
import { ringArea, simplifyRings } from './simplify.mjs';

/**
 * The countries of Europe and of the world, from Natural Earth.
 *
 * The same pipeline `build-geo.mjs` runs for the provinces — project, simplify,
 * write three detail levels — with three things that only matter once a map is
 * bigger than one country.
 *
 * **Two projections.** RD's stereographic is right for the Netherlands and
 * useless for a globe. Europe gets the same projection re-centred on 52° N,
 * 15° E; the world gets Miller cylindrical. Both are written out in
 * `projection.mjs` in closed form, for the reason that file opens with.
 *
 * **A window, for Europe.** Russia reaches the Bering Strait. In a
 * stereographic centred on Poland, Chukotka is a hundred and sixty degrees from
 * the centre and projects to somewhere near infinity — so the map would either
 * be blank or be a map of the northern hemisphere. Every ring is therefore
 * clipped to a rectangle in degrees before it is projected: what a school atlas
 * does when it prints Europe and stops at the Urals, made explicit.
 *
 * **A written rule for what counts as a country.** Natural Earth's admin-0
 * layer holds sovereign states, dependencies, crown dependencies and disputed
 * territories side by side, and choosing between them is where a map for
 * children quietly becomes a political statement. The rule is the source's own:
 * a feature is a country here when it is its own sovereign — `ADMIN` equals
 * `SOVEREIGNT` — which keeps the Netherlands, France and Kosovo and drops
 * Jersey, the Faroes, Greenland and Puerto Rico. Antarctica and the two
 * territories Natural Earth marks `Indeterminate` are dropped by name and by
 * type; neither is a country a child is asked to find.
 *
 * The Dutch names come from the data (`NAME_NL`), never from us.
 *
 * Output: `public/geo/<regio>/landen.*.json` for the shapes, and
 * `content/sets/<regio>-landen.json` for the questions. Both are generated,
 * like `content/tafels`: a hand correction here is lost at the next run.
 */

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, 'content', 'geo', '_source');

const SIZE = 1000;
const PADDING = 10;

/**
 * The same three levels the provinces have, and the tolerances mean the same
 * thing: view-box units, so 1.0 is a thousandth of the map's width whatever the
 * map is of.
 *
 * `minArea` does more work here than it does at home. A world map at overview
 * carries every islet Natural Earth knows about, and two thousand specks nobody
 * can see still cost every device that draws them.
 */
const LEVELS = [
  { naam: 'overview', tolerance: 2.0, minArea: 6 },
  { naam: 'region', tolerance: 0.6, minArea: 1.5 },
  { naam: 'detail', tolerance: 0.15, minArea: 0.3 },
];

const REGIOS = [
  {
    id: 'europa',
    setId: 'europa-landen',
    setNaam: 'De landen van Europa',
    prefix: 'eu-land',
    bron: 'ne-landen-50m',
    /**
     * Natural Earth's own continent field, plus Cyprus.
     *
     * Cyprus is filed under Asia by the source and printed on the Europe page
     * of every Dutch atlas; it is in the European Union and children learn it
     * there. That is one named exception rather than a list of opinions, and it
     * is written here so anybody can disagree with it in one place.
     *
     * Turkey and the Caucasus states are not added back. They are as much
     * Europe as Cyprus by some measures and the line has to fall somewhere; it
     * falls where the source puts it, except for the one case where every Dutch
     * classroom would notice.
     */
    hoortErbij: (p) => p.CONTINENT === 'Europe' || p.NAME === 'Cyprus',
    /**
     * Where the page stops. West of Iceland, east of Moscow, south of Crete and
     * north of the North Cape — which cuts Svalbard and the Russian far east,
     * exactly as a printed map of Europe does.
     */
    venster: { west: -25, oost: 50, zuid: 34, noord: 72 },
    project: (lon, lat) => stereographic(lon, lat, EUROPE_CENTRE),
    projectie: {
      type: 'oblique-stereographic',
      centrum: EUROPE_CENTRE,
      opmerking: 'Hetzelfde soort projectie als de provincies, opnieuw gecentreerd.',
    },
  },
  {
    id: 'wereld',
    setId: 'wereld-landen',
    setNaam: 'De landen van de wereld',
    prefix: 'wl-land',
    bron: 'ne-landen-110m',
    hoortErbij: () => true,
    venster: null,
    project: miller,
    projectie: {
      type: 'miller-cylindrical',
      centrum: { lat: 0, lon: 0 },
      opmerking: 'Compromisprojectie: rechte meridianen, geen juiste oppervlakten.',
    },
  },
];

/**
 * Whether Natural Earth's own fields say this feature is a country.
 *
 * See the note at the top. `TYPE` alone does not do it: the Netherlands,
 * France, the United Kingdom, the United States and China are all typed
 * `Country` rather than `Sovereign country`, because each has dependencies and
 * Natural Earth keeps the sovereign entity as a separate row.
 */
function isCountry(p) {
  return (
    p.ADMIN === p.SOVEREIGNT &&
    p.TYPE !== 'Indeterminate' &&
    p.NAME !== 'Antarctica' &&
    // And it has an ISO 3166 code, which is the second half of the rule and
    // the half that keeps this map out of an argument. Northern Cyprus and
    // Somaliland pass every test above — they govern themselves and Natural
    // Earth types them as sovereign — and neither has a code, because the
    // standards body has not given them one. A product for ten-year-olds does
    // not settle that; it asks about the countries the world has agreed on.
    //
    // `ISO_A2_EH` and not `ISO_A2`: the plain field is -99 for France and
    // Norway, which is a quirk of how Natural Earth handles states with
    // dependencies, and the -EH variant is the one that fills those in. Kosovo
    // keeps its place on XK, the user-assigned code it is listed under.
    String(p.ISO_A2_EH ?? '-99') !== '-99'
  );
}

/**
 * The names the source has not caught up with.
 *
 * `NAME_NL` is what a Dutch child is shown and it comes from the data rather
 * than from us — which is the rule, and which is worth the two places it is
 * wrong. Natural Earth's Dutch column predates both changes below. Each
 * correction carries the date the name actually changed and keeps the old name
 * as an alias, so a child who writes what their older brother learned is not
 * told they are wrong.
 *
 * This list is for names that *changed*. It is not for names we would have
 * chosen differently.
 */
const NAAMCORRECTIES = new Map([
  // Renamed by the country itself in April 2018; the Dutch name followed.
  ['Swaziland', { naam: 'Eswatini', aliassen: ['Swaziland'] }],
  // Buitenlandse Zaken and the Taalunie moved to Belarus; every schoolbook
  // printed before that says Wit-Rusland, and plenty of children still do.
  ['Wit-Rusland', { naam: 'Belarus', aliassen: ['Wit-Rusland'] }],
  // Not a rename: the source uses the formal name and no child says it.
  ['Volksrepubliek China', { naam: 'China', aliassen: ['Volksrepubliek China'] }],
  [
    'Verenigde Staten van Amerika',
    { naam: 'Verenigde Staten', aliassen: ['Verenigde Staten van Amerika', 'Amerika', 'VS'] },
  ],
]);

/** The name a child sees, and the other names that also count as right. */
function naamVan(bronNaam) {
  return NAAMCORRECTIES.get(bronNaam) ?? { naam: bronNaam, aliassen: [] };
}

function slug(naam) {
  return naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

/**
 * Sutherland–Hodgman, against one edge of the window, in degrees.
 *
 * The textbook algorithm and nothing more: walk the ring, keep every vertex
 * inside the edge, and add the crossing point wherever the ring passes through
 * it. Convex clip region, so four passes clip a rectangle exactly.
 *
 * It can leave a ring walking along the edge where a shape leaves and comes
 * back — Norway does it three times — which is right: that is the coastline the
 * window cuts, and it is what a printed map shows at its own margin.
 */
function clipToEdge(ring, inside, intersect) {
  if (ring.length === 0) return ring;

  const out = [];
  let previous = ring[ring.length - 1];
  let previousIn = inside(previous);

  for (const current of ring) {
    const currentIn = inside(current);
    if (currentIn !== previousIn) out.push(intersect(previous, current));
    if (currentIn) out.push(current);
    previous = current;
    previousIn = currentIn;
  }
  return out;
}

function clipRing(ring, venster) {
  const { west, oost, zuid, noord } = venster;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  let out = ring;
  out = clipToEdge(
    out,
    (p) => p[0] >= west,
    (a, b) => lerp(a, b, (west - a[0]) / (b[0] - a[0])),
  );
  out = clipToEdge(
    out,
    (p) => p[0] <= oost,
    (a, b) => lerp(a, b, (oost - a[0]) / (b[0] - a[0])),
  );
  out = clipToEdge(
    out,
    (p) => p[1] >= zuid,
    (a, b) => lerp(a, b, (zuid - a[1]) / (b[1] - a[1])),
  );
  out = clipToEdge(
    out,
    (p) => p[1] <= noord,
    (a, b) => lerp(a, b, (noord - a[1]) / (b[1] - a[1])),
  );
  return out;
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

/** The centroid of the largest ring, which is where a label goes. */
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

/**
 * Which of three levels a country is, so a mix can be asked in order of what a
 * child is likely to have met.
 *
 * Natural Earth's own population rank, which runs 1 to 18 on a log scale. It is
 * a stand-in for "how often a ten-year-old has heard of it" and it is a decent
 * one — but it is a stand-in, and it is written here rather than guessed at per
 * country so that changing the rule is one line.
 */
function niveauVan(p) {
  const rank = Number(p.POP_RANK ?? 0);
  if (rank >= 15) return 1;
  if (rank >= 12) return 2;
  return 3;
}

// ---------------------------------------------------------------------------

for (const regio of REGIOS) {
  const sourcePath = join(SOURCE_DIR, `${regio.bron}.json`);
  let source;
  try {
    source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  } catch {
    console.error(`Source not found: ${sourcePath}`);
    console.error('Run: node tools/content/fetch-source.mjs');
    process.exit(1);
  }

  console.log(`\n${regio.id} — ${source._bron ?? 'unknown origin'}`);

  const landen = source.features
    .filter((feature) => isCountry(feature.properties) && regio.hoortErbij(feature.properties))
    .map((feature) => {
      const rings = ringsOf(feature.geometry);
      const geklipt = regio.venster
        ? rings.map((ring) => clipRing(ring, regio.venster)).filter((ring) => ring.length >= 4)
        : rings;
      return { properties: feature.properties, rings: geklipt };
    })
    .filter((land) => land.rings.length > 0);

  console.log(`  ${landen.length} countries after the sovereignty rule and the window`);

  /**
   * The view box follows the window where there is one, and the data where
   * there is not.
   *
   * Fitting Europe to its own countries would let Iceland and Cyprus decide the
   * frame, which is very nearly the same box — but Russia's clipped edge is a
   * straight line at 50° E, and a frame that stopped at the last Russian vertex
   * rather than at the window would leave the cut visible as a gap. The window's
   * own outline is sampled rather than cornered, because in a stereographic a
   * straight line in degrees is a curve on the page.
   */
  const frame = [];
  if (regio.venster) {
    const { west, oost, zuid, noord } = regio.venster;
    for (let lon = west; lon <= oost; lon += 1) frame.push([lon, zuid], [lon, noord]);
    for (let lat = zuid; lat <= noord; lat += 1) frame.push([west, lat], [oost, lat]);
  } else {
    for (const land of landen) for (const ring of land.rings) frame.push(...ring);
  }

  const projector = makeProjectorWith((lon, lat) => regio.project(lon, lat), frame, SIZE, PADDING);

  const projected = landen.map((land) => ({
    ...naamVan(land.properties.NAME_NL),
    bronnaam: land.properties.NAME,
    code: land.properties.ISO_A2_EH ?? land.properties.ISO_A2 ?? null,
    niveau: niveauVan(land.properties),
    rings: land.rings.map((ring) => ring.map((c) => projector.project(c))),
  }));

  const outDir = join(ROOT, 'public', 'geo', regio.id);
  mkdirSync(outDir, { recursive: true });

  for (const level of LEVELS) {
    const vormen = [];
    let ringsAfter = 0;
    let pointsAfter = 0;

    for (const land of projected) {
      const rings = simplifyRings(land.rings, level.tolerance, level.minArea);
      if (rings.length === 0) {
        // Kept rather than dropped: a country that is too small to draw at this
        // level still has to be answerable, and the level below it draws it.
        // What must never happen is a set item pointing at a shape that is not
        // in the file (`content.test.ts` checks exactly that), so the coarsest
        // ring survives even when it is a speck.
        const grofste = land.rings.reduce((best, ring) =>
          Math.abs(ringArea(ring)) > Math.abs(ringArea(best)) ? ring : best,
        );
        rings.push(grofste);
        console.warn(`  ! ${land.naam} kept its largest ring at ${level.naam}`);
      }
      ringsAfter += rings.length;
      pointsAfter += rings.reduce((sum, ring) => sum + ring.length, 0);

      const punt = centroidOfLargestRing(rings);

      vormen.push({
        id: `${regio.prefix}-${slug(land.naam)}`,
        bronnaam: land.bronnaam,
        code: land.code,
        d: toPath(rings),
        punt: punt ? [Number(punt[0].toFixed(1)), Number(punt[1].toFixed(1))] : null,
        bbox: boundingBox(rings),
      });
    }

    const payload = {
      regioSet: regio.id,
      onderwerp: 'landen',
      detailniveau: level.naam,
      viewBox: [0, 0, Number(projector.width.toFixed(1)), Number(projector.height.toFixed(1))],
      projectie: regio.projectie,
      bron: {
        naam: source._bron ?? null,
        licentie: source._licentie ?? null,
        opgehaald: source._opgehaald ?? null,
      },
      vormen,
    };

    const path = join(outDir, `landen.${level.naam}.json`);
    writeFileSync(path, JSON.stringify(payload));

    const kb = (statSync(path).size / 1024).toFixed(1);
    console.log(
      `  ${level.naam.padEnd(9)} ${String(vormen.length).padStart(3)} shapes  ` +
        `${String(ringsAfter).padStart(5)} rings  ` +
        `${String(pointsAfter).padStart(6)} points  ${kb.padStart(8)} kB`,
    );
  }

  // The questions, from the same features, in the same order the map draws
  // them. Generated for the same reason the tables are: forty-five countries is
  // a file nobody would keep correct by hand, and every field in it is either
  // in the source or is a rule written above.
  const set = {
    id: regio.setId,
    naam: regio.setNaam,
    regioSet: regio.id,
    contentVersie: new Date().toISOString().slice(0, 10),
    _generated:
      'Geschreven door tools/content/build-countries.mjs. Handmatige wijzigingen gaan bij de volgende run verloren.',
    _geometrie: `geometrieRef verwijst naar een vorm-id in public/geo/${regio.id}/landen.*.json.`,
    items: projected
      .map((land) => ({
        id: `${regio.prefix}-${slug(land.naam)}`,
        type: 'land',
        naam: land.naam,
        aliassen: land.aliassen,
        regioSet: regio.id,
        geometrieRef: `${regio.prefix}-${slug(land.naam)}`,
        niveau: land.niveau,
        leerdoelen: [`ak-${regio.id}-landen-aanwijzen`, `ak-${regio.id}-landen-benoemen`],
      }))
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl')),
  };

  const setPath = join(ROOT, 'content', 'sets', `${regio.setId}.json`);
  writeFileSync(setPath, `${JSON.stringify(set, null, 2)}\n`);
  console.log(`  set        ${set.items.length} items -> ${setPath}`);
}

console.log('\nNow run: node tools/content/build-neighbours.mjs');
