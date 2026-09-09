import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Who lies next to whom, as data.
 *
 * ADR-036: multiple choice teaches through its wrong answers. An option that
 * borders the right one is the mistake a child actually makes; one from the
 * other side of the country makes the question easier rather than more
 * instructive. So neighbourhood is computed from the geodata here and shipped
 * as a list, and `game-core` stays a pure function over that list instead of
 * learning any geometry.
 *
 * Two rules, and which one applies is a property of the item, not of the set:
 *
 * - **Areas** share a boundary. Provinces are the only areas we have, and CBS
 *   publishes them from a topological source, so the boundary two provinces
 *   share is literally the same vertices in both features. Counting them is
 *   exact — no tolerance, no guessing — and the count doubles as the strength
 *   of the neighbourhood, which is what orders the list.
 * - **Points** have no boundary to share, so the mistake a child makes is
 *   about a place that is _near_. Distance between label points, nearest
 *   first, in the projected view box every built set already shares.
 *
 * ADR-036 filed the waters under areas. They are points (ADR-019 explains why
 * there is no licensed polygon source for them), so they are here under the
 * second rule; ADR-047 records the correction.
 *
 * Run after the geometry builds — it reads what they write. Output is
 * generated: it is built, not edited, and a hand correction is lost at the
 * next run.
 */

const ROOT = process.cwd();
const SETS = join(ROOT, 'content', 'sets');
const GEO = join(ROOT, 'public', 'geo');
const BRON = join(ROOT, 'content', 'geo', '_source');
const OUT_DIR = join(ROOT, 'content', 'buren');

/**
 * Six is more than any question needs — three distractors — so that a set can
 * ask about the same item twice in a round without offering the same three
 * wrong answers both times.
 */
const KEEP = 6;

/**
 * A shared boundary is two vertices or more. One shared vertex is a corner
 * where three areas meet, which is a touch and not a border.
 */
const MINIMUM_SHARED = 2;

/**
 * `bron` and `naamVeld` are what the border rule needs: the unsimplified source,
 * and the property the geometry build made its ids from. Countries can use the
 * same rule as provinces because Natural Earth is topological too — the
 * Netherlands and Belgium share sixty-one vertices in the file, exactly the way
 * two CBS provinces do, so counting them is again exact rather than a guess
 * with a tolerance on it (ADR-086).
 */
const OPDRACHTEN = [
  {
    set: 'nl-provincies',
    regel: 'grens',
    regio: 'nl',
    geo: 'provincies.detail.json',
    bron: 'nl-provincies.json',
    naamVeld: 'statnaam',
    prefix: 'nl-prov-',
  },
  { set: 'nl-hoofdsteden', regel: 'afstand', regio: 'nl', geo: 'hoofdsteden.json' },
  { set: 'nl-steden', regel: 'afstand', regio: 'nl', geo: 'steden.json' },
  { set: 'nl-wateren', regel: 'afstand', regio: 'nl', geo: 'wateren.json' },
  // `.detail.json`, which is what the islands are actually written to. It said
  // `waddeneilanden.json` here and had done since the rename ADR-069 records:
  // the file this script reads and the file the build writes were two spellings
  // that nothing compared, and this one only failed when somebody re-ran it.
  { set: 'nl-waddeneilanden', regel: 'afstand', regio: 'nl', geo: 'waddeneilanden.detail.json' },
  {
    set: 'europa-landen',
    regel: 'grens',
    regio: 'europa',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'eu-land-',
    // Only the countries the set holds. The source file is every country in
    // the world, and a European question offered Ecuador as a wrong answer
    // would be a question about nothing.
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'afrika-landen',
    regel: 'grens',
    regio: 'afrika',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'af-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'azie-landen',
    regel: 'grens',
    regio: 'azie',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'az-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'noord-amerika-landen',
    regel: 'grens',
    regio: 'noord-amerika',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'na-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'zuid-amerika-landen',
    regel: 'grens',
    regio: 'zuid-amerika',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'za-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'oceanie-landen',
    regel: 'grens',
    regio: 'oceanie',
    geo: 'landen.detail.json',
    bron: 'ne-landen-50m.json',
    naamVeld: 'NAME_NL',
    prefix: 'oc-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
  {
    set: 'wereld-landen',
    regel: 'grens',
    regio: 'wereld',
    geo: 'landen.detail.json',
    bron: 'ne-landen-110m.json',
    naamVeld: 'NAME_NL',
    prefix: 'wl-land-',
    binnen: (id, set) => set.items.some((item) => item.geometrieRef === id),
  },
];

/** The same slug the geometry build uses, so the ids line up by construction. */
function slug(naam) {
  return naam
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Every vertex of a feature as a string key.
 *
 * Seven decimals is roughly a centimetre, which is finer than any survey and
 * far coarser than the float noise that would otherwise make two writings of
 * the same coordinate look like two places.
 */
function vertices(geometry) {
  const found = new Set();
  const walk = (node) => {
    if (typeof node[0] === 'number') {
      found.add(`${node[0].toFixed(7)},${node[1].toFixed(7)}`);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry.coordinates);
  return found;
}

/**
 * Areas: ordered by how much boundary they share, most first.
 *
 * Read from the *source* rather than from what the build wrote. Simplification
 * moves vertices, and two shapes that shared a boundary before it may share
 * none after — which would turn an exact count into a tolerance, and a
 * tolerance into an argument about how close is close enough.
 */
function byBorder(opdracht, set) {
  const bron = readJson(join(BRON, opdracht.bron));
  const gebieden = bron.features
    .map((feature) => ({
      id: `${opdracht.prefix}${slug(feature.properties[opdracht.naamVeld])}`,
      punten: vertices(feature.geometry),
    }))
    .filter((gebied) => !opdracht.binnen || opdracht.binnen(gebied.id, set));

  const buren = new Map(gebieden.map((gebied) => [gebied.id, []]));

  for (let i = 0; i < gebieden.length; i++) {
    for (let k = i + 1; k < gebieden.length; k++) {
      let gedeeld = 0;
      for (const punt of gebieden[i].punten) {
        if (gebieden[k].punten.has(punt)) gedeeld++;
      }
      if (gedeeld < MINIMUM_SHARED) continue;

      buren.get(gebieden[i].id).push({ id: gebieden[k].id, sterkte: gedeeld });
      buren.get(gebieden[k].id).push({ id: gebieden[i].id, sterkte: gedeeld });
    }
  }

  // Descending by shared boundary, then by id: a tie must not depend on the
  // order the source happened to list its features in.
  return new Map(
    [...buren].map(([id, lijst]) => [
      id,
      lijst
        .sort((a, b) => b.sterkte - a.sterkte || a.id.localeCompare(b.id))
        .map((buur) => buur.id),
    ]),
  );
}

/** Points: ordered by distance between label points, nearest first. */
function byDistance(opdracht) {
  const geo = readJson(join(GEO, opdracht.regio, opdracht.geo));
  const plekken = (geo.punten ?? geo.vormen).map((plek) => ({ id: plek.id, punt: plek.punt }));

  const ontbreekt = plekken.find((plek) => !plek.punt);
  if (ontbreekt) throw new Error(`${opdracht.geo}: ${ontbreekt.id} has no label point`);

  return new Map(
    plekken.map((plek) => [
      plek.id,
      plekken
        .filter((ander) => ander.id !== plek.id)
        .map((ander) => ({
          id: ander.id,
          afstand: Math.hypot(ander.punt[0] - plek.punt[0], ander.punt[1] - plek.punt[1]),
        }))
        .sort((a, b) => a.afstand - b.afstand || a.id.localeCompare(b.id))
        .map((ander) => ander.id),
    ]),
  );
}

/**
 * Borders first, then the nearest of the rest.
 *
 * Zeeland and Limburg border two provinces each, and a multiple-choice question
 * needs three wrong answers — so a list of borders alone would leave two of the
 * twelve unaskable. The tail is the second ring, which is still a plausible
 * mistake and never the other end of the country. Order carries the difference:
 * everything that shares a boundary comes first.
 */
function byBorderThenDistance(opdracht, set) {
  const grenzen = byBorder(opdracht, set);
  const afstanden = byDistance(opdracht);

  // Every shape the map has, whether or not it borders anything. Iceland,
  // Malta and Cyprus share no boundary with anybody and still have to be
  // askable, so the distance list is the floor and the borders come first.
  return new Map(
    [...afstanden].map(([id, dichtbij]) => {
      const buren = grenzen.get(id) ?? [];
      return [id, [...buren, ...dichtbij.filter((ander) => !buren.includes(ander))]];
    }),
  );
}

function build(opdracht) {
  const set = readJson(join(SETS, `${opdracht.set}.json`));
  const perGeometrie =
    opdracht.regel === 'grens' ? byBorderThenDistance(opdracht, set) : byDistance(opdracht);

  // The list is keyed by item id, not by geometry id: `distractors.ts` names
  // answers, and the geometry reference is an implementation detail of the map.
  const naarItem = new Map(set.items.map((item) => [item.geometrieRef, item.id]));

  const buren = {};
  for (const item of set.items) {
    const lijst = perGeometrie.get(item.geometrieRef);
    if (!lijst) throw new Error(`${opdracht.set}: no geometry for ${item.id}`);

    buren[item.id] = lijst
      .map((geometrieRef) => naarItem.get(geometrieRef))
      .filter((id) => id !== undefined)
      .slice(0, KEEP);
  }

  return {
    _gegenereerd: 'tools/content/build-neighbours.mjs — gegenereerd, niet met de hand bewerken.',
    _regel:
      opdracht.regel === 'grens'
        ? 'Gebieden die een grens delen, de langste grens eerst, daarna de dichtstbijzijnde.'
        : 'De dichtstbijzijnde plekken, het dichtstbij eerst.',
    setId: set.id,
    contentVersie: set.contentVersie,
    regel: opdracht.regel,
    buren,
  };
}

mkdirSync(OUT_DIR, { recursive: true });

for (const opdracht of OPDRACHTEN) {
  const uitkomst = build(opdracht);
  const pad = join(OUT_DIR, `${opdracht.set}.json`);
  writeFileSync(pad, `${JSON.stringify(uitkomst, null, 2)}\n`);

  const aantallen = Object.values(uitkomst.buren).map((lijst) => lijst.length);
  const minimum = Math.min(...aantallen);
  console.log(`${opdracht.set}: ${aantallen.length} items, minstens ${minimum} buren`);
}
