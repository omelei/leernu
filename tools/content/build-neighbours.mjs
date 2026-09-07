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
const GEO = join(ROOT, 'public', 'geo', 'nl');
const PROVINCIE_BRON = join(ROOT, 'content', 'geo', '_source', 'nl-provincies.json');
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

const OPDRACHTEN = [
  { set: 'nl-provincies', regel: 'grens', geo: 'provincies.detail.json' },
  { set: 'nl-hoofdsteden', regel: 'afstand', geo: 'hoofdsteden.json' },
  { set: 'nl-steden', regel: 'afstand', geo: 'steden.json' },
  { set: 'nl-wateren', regel: 'afstand', geo: 'wateren.json' },
  { set: 'nl-waddeneilanden', regel: 'afstand', geo: 'waddeneilanden.json' },
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

/** Areas: ordered by how much boundary they share, most first. */
function byBorder() {
  const bron = readJson(PROVINCIE_BRON);
  const gebieden = bron.features.map((feature) => ({
    id: `nl-prov-${slug(feature.properties.statnaam)}`,
    punten: vertices(feature.geometry),
  }));

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
function byDistance(bestand) {
  const geo = readJson(join(GEO, bestand));
  const plekken = (geo.punten ?? geo.vormen).map((plek) => ({ id: plek.id, punt: plek.punt }));

  const ontbreekt = plekken.find((plek) => !plek.punt);
  if (ontbreekt) throw new Error(`${bestand}: ${ontbreekt.id} has no label point`);

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
function byBorderThenDistance(bestand) {
  const grenzen = byBorder();
  const afstanden = byDistance(bestand);

  return new Map(
    [...grenzen].map(([id, buren]) => [
      id,
      [...buren, ...afstanden.get(id).filter((ander) => !buren.includes(ander))],
    ]),
  );
}

function build(opdracht) {
  const set = readJson(join(SETS, `${opdracht.set}.json`));
  const perGeometrie =
    opdracht.regel === 'grens' ? byBorderThenDistance(opdracht.geo) : byDistance(opdracht.geo);

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
