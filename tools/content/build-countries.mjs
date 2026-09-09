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
 * **And the world's questions know which werelddeel they are on.** A question
 * about a country of the world is asked on the map of its werelddeel rather than
 * on the globe (ADR-091), so each item in the world set carries the region it was
 * drawn in and the shape that draws it there. It is written from what the six
 * werelddeel builds produced rather than from `CONTINENT` alone, because a
 * country also has to survive its werelddeel's window — which is why the world is
 * built last, and why that is asserted rather than assumed.
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
  // The other five werelddelen. Each is the same three fields as Europe: which
  // continent Natural Earth files a country under, where the page stops, and
  // where the projection is centred. Nothing else about the build changes,
  // which is what "a region is a row in a table" was supposed to mean
  // (ADR-086) and is now true rather than claimed.
  //
  // The windows are where a printed atlas stops, and each one is chosen to hold
  // the whole continent with as little empty ocean as the shape allows: an
  // atlas page that is half water is a map drawn half the size it could be.
  {
    id: 'afrika',
    setId: 'afrika-landen',
    setNaam: 'De landen van Afrika',
    prefix: 'af-land',
    bron: 'ne-landen-50m',
    hoortErbij: (p) => p.CONTINENT === 'Africa',
    venster: { west: -26, oost: 52, zuid: -36, noord: 38 },
    project: (lon, lat) => stereographic(lon, lat, { lat: 2, lon: 18 }),
    projectie: {
      type: 'oblique-stereographic',
      centrum: { lat: 2, lon: 18 },
      opmerking: 'Gecentreerd op de evenaar, waar Afrika zelf zijn midden heeft.',
    },
  },
  {
    id: 'azie',
    setId: 'azie-landen',
    setNaam: 'De landen van Azië',
    prefix: 'az-land',
    bron: 'ne-landen-50m',
    hoortErbij: (p) => p.CONTINENT === 'Asia',
    // Cyprus is on the Europe page as well; it is a member of both lists on
    // purpose, and the ids differ, so answering it in one does not answer it in
    // the other. Russia is absent: Natural Earth files it under Europe, which
    // is where the atlas prints it too.
    venster: { west: 25, oost: 150, zuid: -11, noord: 56 },
    project: (lon, lat) => stereographic(lon, lat, { lat: 30, lon: 85 }),
    projectie: {
      type: 'oblique-stereographic',
      centrum: { lat: 30, lon: 85 },
      opmerking: 'Gecentreerd boven de Himalaya, tussen de twee helften in.',
    },
  },
  {
    id: 'noord-amerika',
    setId: 'noord-amerika-landen',
    setNaam: 'De landen van Noord-Amerika',
    prefix: 'na-land',
    bron: 'ne-landen-50m',
    hoortErbij: (p) => p.CONTINENT === 'North America',
    venster: { west: -172, oost: -52, zuid: 6, noord: 72 },
    project: (lon, lat) => stereographic(lon, lat, { lat: 45, lon: -100 }),
    projectie: {
      type: 'oblique-stereographic',
      centrum: { lat: 45, lon: -100 },
      opmerking: 'Midden-Amerika en de Caraïben horen erbij; Groenland niet.',
    },
  },
  {
    id: 'zuid-amerika',
    setId: 'zuid-amerika-landen',
    setNaam: 'De landen van Zuid-Amerika',
    prefix: 'za-land',
    bron: 'ne-landen-50m',
    hoortErbij: (p) => p.CONTINENT === 'South America',
    venster: { west: -82, oost: -34, zuid: -56, noord: 13 },
    project: (lon, lat) => stereographic(lon, lat, { lat: -20, lon: -60 }),
    projectie: {
      type: 'oblique-stereographic',
      centrum: { lat: -20, lon: -60 },
      opmerking: 'Twaalf landen, en de enige kaart hier die op een telefoon past.',
    },
  },
  {
    id: 'oceanie',
    setId: 'oceanie-landen',
    setNaam: 'De landen van Oceanië',
    prefix: 'oc-land',
    bron: 'ne-landen-50m',
    hoortErbij: (p) => p.CONTINENT === 'Oceania',
    // Stops at the date line. Fiji straddles it and keeps its western islands,
    // which is what a page of an atlas shows of Fiji as well.
    venster: { west: 110, oost: 180, zuid: -48, noord: 0 },
    project: (lon, lat) => stereographic(lon, lat, { lat: -25, lon: 145 }),
    projectie: {
      type: 'oblique-stereographic',
      centrum: { lat: -25, lon: 145 },
      opmerking: 'Australië beslaat de kaart; de eilandstaten liggen eromheen.',
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
 * The world is built last, and that is a rule rather than an accident of the
 * order above.
 *
 * A question about a country of the world is asked on the map of its werelddeel
 * (ADR-091), so every item in the world set carries the werelddeel it belongs
 * to and the shape that answers it there. That relation is written from what
 * the six werelddeel builds actually produced — not from Natural Earth's
 * `CONTINENT` field alone — because membership is only half of it: a country
 * also has to survive its werelddeel's window, and a relation pointing at a
 * shape the clip removed would be a blank map in a classroom.
 */
if (REGIOS[REGIOS.length - 1]?.id !== 'wereld') {
  throw new Error('De wereld hoort als laatste gebouwd te worden: zie de opmerking hierboven.');
}

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

/**
 * Where each country was drawn as part of a werelddeel: the region id and the
 * shape that answers it there, by the name a child is shown.
 *
 * By name rather than by ISO code, because the name is what the two builds
 * already agree on — both take it from `NAME_NL` through the same corrections,
 * and the shape ids are that name slugged. The first werelddeel to claim a
 * country keeps it, which decides the one country that is in two: Cyprus is on
 * the Europe page of a Dutch atlas and Europe is built first, so that is the
 * map a question about Cyprus is asked on.
 */
const werelddeelVanLand = new Map();

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
   * The view box follows the countries, never the window.
   *
   * It followed the window's own outline for one release, on the argument that
   * a frame stopping at the last Russian vertex would leave the cut visible as
   * a gap. That was wrong twice over. Russia's cut edge *is* the eastmost thing
   * on the map, so it lands on the frame either way — and a window is a
   * rectangle in degrees, which through any of these projections is a curved
   * region whose bounding box is bigger than what is in it. Asia and North
   * America were drawn at about six tenths of the size they could have been,
   * which is six tenths of a touch target on a map where that is the whole
   * problem (ADR-087).
   */
  const frame = [];
  for (const land of landen) for (const ring of land.rings) frame.push(...ring);

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
  const zonderWerelddeel = [];

  const set = {
    id: regio.setId,
    naam: regio.setNaam,
    regioSet: regio.id,
    contentVersie: new Date().toISOString().slice(0, 10),
    _generated:
      'Geschreven door tools/content/build-countries.mjs. Handmatige wijzigingen gaan bij de volgende run verloren.',
    _geometrie: `geometrieRef verwijst naar een vorm-id in public/geo/${regio.id}/landen.*.json.`,
    items: projected
      .map((land) => {
        const id = `${regio.prefix}-${slug(land.naam)}`;
        // Where this country is drawn as part of a werelddeel, so a question
        // about it can be asked on that map instead of on the globe (ADR-091).
        // Only the world needs it: a werelddeel is already the map it is asked
        // on, and a relation saying so would repeat the set's own name.
        const op = regio.id === 'wereld' ? werelddeelVanLand.get(land.naam) : undefined;
        if (regio.id === 'wereld' && !op) zonderWerelddeel.push(land.naam);

        return {
          id,
          type: 'land',
          naam: land.naam,
          aliassen: land.aliassen,
          regioSet: regio.id,
          geometrieRef: id,
          niveau: land.niveau,
          // One pair of goals for every werelddeel and a separate pair for the
          // world. "Wijst de landen van een werelddeel aan" is one thing a child
          // learns, not seven — and seven near-identical goals is a curriculum
          // document nobody would read twice.
          leerdoelen:
            regio.id === 'wereld'
              ? ['ak-wereld-landen-aanwijzen', 'ak-wereld-landen-benoemen']
              : ['ak-werelddelen-landen-aanwijzen', 'ak-werelddelen-landen-benoemen'],
          ...(op ? { relaties: { werelddeel: op.regio, vormInWerelddeel: op.vorm } } : {}),
        };
      })
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl')),
  };

  // Remembered for the world, which is built last. Not overwritten: the first
  // werelddeel to claim a country keeps it, which is what puts Cyprus on the
  // Europe page rather than the Asia one. See `werelddeelVanLand`.
  if (regio.id !== 'wereld') {
    for (const land of projected) {
      const naam = land.naam;
      if (!werelddeelVanLand.has(naam)) {
        werelddeelVanLand.set(naam, { regio: regio.id, vorm: `${regio.prefix}-${slug(naam)}` });
      }
    }
  }

  // Loud rather than silent. A country of the world with no werelddeel behind
  // it still works — the round falls back to the world map — but it is a hole
  // in the thing ADR-091 promises, and it is a hole nobody would find by
  // playing, because it is one question in a hundred and sixty-seven.
  if (zonderWerelddeel.length > 0) {
    console.warn(`  ! no werelddeel for: ${zonderWerelddeel.join(', ')}`);
  }

  const setPath = join(ROOT, 'content', 'sets', `${regio.setId}.json`);
  writeFileSync(setPath, `${JSON.stringify(set, null, 2)}\n`);
  console.log(`  set        ${set.items.length} items -> ${setPath}`);
}

console.log('\nNow run: node tools/content/build-neighbours.mjs');
