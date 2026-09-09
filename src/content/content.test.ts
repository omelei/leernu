import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fitView,
  findNearMisses,
  helpTargetFor,
  helpTargets,
  judgeAnswer,
  needsHelpTarget,
} from '@/game-core';
import { loadAllItems, loadItemSets } from './loadSets';
import { geoUrl, pointUrl } from './loadGeo';
import { SET_IDS, SETS } from '@/features/practice/useRound';
import type { Detailniveau, GeoSet } from './loadGeo';

/**
 * The content gate. This is what `npm run validate:content` runs, and it is in
 * CI because a broken geometry reference must never reach a classroom — the
 * failure mode is a child looking at a blank map during a lesson, which is the
 * one bug that costs a school's trust outright.
 *
 * Geometry is read from disk rather than imported: it lives in public/ and is
 * fetched at runtime (see loadGeo.ts), so there is nothing for a bundler to
 * resolve. Reading from the project root is what the contrast test learned to
 * do, for the same reason.
 */

const NIVEAUS: Detailniveau[] = ['overview', 'region', 'detail'];

function loadGeoFromDisk(onderwerp: string, niveau: Detailniveau): GeoSet {
  const path = join(process.cwd(), 'public', 'geo', 'nl', `${onderwerp}.${niveau}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as GeoSet;
}

interface Leerdoelen {
  leerdoelen: { id: string }[];
}

const leerdoelen = JSON.parse(
  readFileSync(join(process.cwd(), 'content', 'leerdoelen.json'), 'utf8'),
) as Leerdoelen;

const sets = loadItemSets();
const items = loadAllItems();

describe('content sets', () => {
  it('has at least one set', () => {
    expect(sets.length).toBeGreaterThan(0);
  });

  it('has a unique id for every item, across all sets', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const set of sets) {
      for (const item of set.items) {
        const previous = seen.get(item.id);
        if (previous !== undefined) {
          duplicates.push(`${item.id} appears in ${previous} and ${set.id}`);
        }
        seen.set(item.id, set.id);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it('gives every item a name and a level', () => {
    const broken = items
      .filter((item) => item.naam.trim() === '' || ![1, 2, 3].includes(item.niveau))
      .map((item) => item.id);

    expect(broken).toEqual([]);
  });

  it('tags every item with a learning goal that exists', () => {
    const known = new Set(leerdoelen.leerdoelen.map((goal) => goal.id));
    const problems: string[] = [];

    for (const item of items) {
      if (item.leerdoelen.length === 0) problems.push(`${item.id}: no learning goal`);
      for (const goal of item.leerdoelen) {
        if (!known.has(goal)) problems.push(`${item.id}: unknown learning goal ${goal}`);
      }
    }

    expect(problems).toEqual([]);
  });

  it('keeps pre-projected points inside the 0-1000 view box', () => {
    const outside = items
      .filter((item) => {
        if (item.punt === undefined) return false;
        const [x, y] = item.punt;
        return x < 0 || x > 1000 || y < 0 || y > 1000;
      })
      .map((item) => item.id);

    expect(outside).toEqual([]);
  });
});

function itemsOfSet(setId: string) {
  return sets.find((set) => set.id === setId)?.items ?? [];
}

function loadPointsFromDisk(onderwerp: string): { punten: { id: string }[] } {
  const path = join(process.cwd(), 'public', 'geo', 'nl', `${onderwerp}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as { punten: { id: string }[] };
}

describe('geometry references', () => {
  // The promise from ARCHITECTURE section 8, made into a test: an item that
  // points at a shape which does not exist is a hole in a map, and a hole in a
  // map is only discovered by the child looking at it.
  it.each(NIVEAUS)('resolves every province geometrieRef at detail level %s', (niveau) => {
    const shapes = new Set(loadGeoFromDisk('provincies', niveau).vormen.map((vorm) => vorm.id));

    const dangling = itemsOfSet('nl-provincies')
      .filter((item) => item.geometrieRef !== undefined)
      .filter((item) => !shapes.has(item.geometrieRef as string))
      .map((item) => `${item.id} -> ${item.geometrieRef ?? ''}`);

    expect(dangling).toEqual([]);
  });

  // The other direction. A shape nobody can be asked about is dead weight in a
  // file every device downloads.
  it.each(NIVEAUS)('has an item for every shape at detail level %s', (niveau) => {
    const refs = new Set(itemsOfSet('nl-provincies').map((item) => item.geometrieRef));
    const orphans = loadGeoFromDisk('provincies', niveau)
      .vormen.filter((vorm) => !refs.has(vorm.id))
      .map((vorm) => vorm.id);

    expect(orphans).toEqual([]);
  });

  it('resolves every island to a shape', () => {
    const path = join(process.cwd(), 'public', 'geo', 'nl', 'waddeneilanden.detail.json');
    const geo = JSON.parse(readFileSync(path, 'utf8')) as GeoSet;
    const shapes = new Set(geo.vormen.map((vorm) => vorm.id));

    const dangling = itemsOfSet('nl-waddeneilanden')
      .filter((item) => !shapes.has(item.geometrieRef ?? ''))
      .map((item) => item.id);

    expect(dangling).toEqual([]);
  });

  /**
   * The islands are the smallest shapes in the product, and the reason the
   * touch-target arithmetic exists. This is the test that would have caught the
   * mistake real content found: judged on its longest side Ameland looks like a
   * comfortable target, and it is eleven pixels tall.
   */
  it('gives every island a target a finger can land on', () => {
    const path = join(process.cwd(), 'public', 'geo', 'nl', 'waddeneilanden.detail.json');
    const geo = JSON.parse(readFileSync(path, 'utf8')) as GeoSet;
    // A Chromebook, which is the smallest map in spec section 8.
    const fit = fitView(geo.viewBox[3], 700);

    for (const vorm of geo.vormen) {
      const help = helpTargetFor(vorm.bbox, fit, vorm.punt);
      const reachable = help !== null || !needsHelpTarget(vorm.bbox, fit);
      expect(reachable, vorm.bronnaam).toBe(true);
    }
  });

  it('resolves every capital to a projected point', () => {
    const points = new Set(loadPointsFromDisk('hoofdsteden').punten.map((punt) => punt.id));

    const dangling = itemsOfSet('nl-hoofdsteden')
      .filter((item) => !points.has(item.geometrieRef ?? ''))
      .map((item) => item.id);

    expect(dangling).toEqual([]);
  });

  it('resolves every body of water to a projected point', () => {
    const points = new Set(loadPointsFromDisk('wateren').punten.map((punt) => punt.id));

    const dangling = itemsOfSet('nl-wateren')
      .filter((item) => !points.has(item.geometrieRef ?? ''))
      .map((item) => item.id);

    expect(dangling).toEqual([]);
  });

  it('resolves every city to a projected point', () => {
    const points = new Set(loadPointsFromDisk('steden').punten.map((punt) => punt.id));

    const dangling = itemsOfSet('nl-steden')
      .filter((item) => !points.has(item.geometrieRef ?? ''))
      .map((item) => item.id);

    expect(dangling).toEqual([]);
  });

  /**
   * A city is taught together with the province it sits in — that is the fact
   * the weetje states and the relation the item carries. The builder computes it
   * from geometry rather than taking it on trust, so the thing worth checking
   * here is that the province it names is one we actually teach.
   */
  it('places every city in a province the app knows', () => {
    const provincies = new Set(itemsOfSet('nl-provincies').map((item) => item.id));

    const onbekend = itemsOfSet('nl-steden')
      .map((item) => item.relaties?.ligtIn)
      .filter((id) => id !== undefined && !provincies.has(id));

    expect(onbekend).toEqual([]);
  });

  /**
   * No city may share a name with a province or a capital. A child typing
   * "Groningen" must not be told they meant the other one, and ADR-017 only
   * holds if the catalogue it consults has no collisions of its own.
   */
  it('gives every city a name no other item already uses', () => {
    const elders = new Set(
      ['nl-provincies', 'nl-hoofdsteden', 'nl-waddeneilanden', 'nl-wateren'].flatMap((set) =>
        itemsOfSet(set).map((item) => item.naam),
      ),
    );

    const botsingen = itemsOfSet('nl-steden')
      .map((item) => item.naam)
      .filter((naam) => elders.has(naam));

    expect(botsingen).toEqual([]);
  });

  /**
   * The water points are chosen rather than sourced, so the build verifies them
   * against province geometry that is: CBS provinces contain no water, so a
   * water point must fall outside all twelve. This is the same guarantee, kept
   * where anyone reading the tests can see it.
   */
  it('keeps every body of water inside the map', () => {
    const geo = loadGeoFromDisk('provincies', 'region');
    const wateren = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'geo', 'nl', 'wateren.json'), 'utf8'),
    ) as { viewBox: number[]; punten: { id: string; punt: [number, number] }[] };

    expect(wateren.viewBox).toEqual(geo.viewBox);

    const outside = wateren.punten
      .filter(({ punt: [x, y] }) => x < 0 || x > geo.viewBox[2] || y < 0 || y > geo.viewBox[3])
      .map((punt) => punt.id);

    expect(outside).toEqual([]);
  });

  // Points and shapes are projected by the same fit, so a city dot lands inside
  // the province it belongs to. If these ever drift apart the map looks broken
  // in a way that is hard to attribute — the dots would simply be slightly off.
  it('projects capitals into the same view box as the provinces', () => {
    const shapes = loadGeoFromDisk('provincies', 'region');
    const points = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'geo', 'nl', 'hoofdsteden.json'), 'utf8'),
    ) as { viewBox: number[] };

    expect(points.viewBox).toEqual(shapes.viewBox);
  });

  it.each(NIVEAUS)('gives every shape a label point inside the view box at %s', (niveau) => {
    const geo = loadGeoFromDisk('provincies', niveau);

    const problems = geo.vormen
      .filter((vorm) => {
        if (!vorm.punt) return true;
        const [x, y] = vorm.punt;
        return x < 0 || x > 1000 || y < 0 || y > 1000;
      })
      .map((vorm) => vorm.id);

    expect(problems).toEqual([]);
  });

  it('records the source and licence of every geometry file', () => {
    for (const niveau of NIVEAUS) {
      const geo = loadGeoFromDisk('provincies', niveau);
      // Spec section 12: no map material whose licence is not recorded.
      expect(geo.bron.naam).toBeTruthy();
      expect(geo.bron.licentie).toBeTruthy();
      expect(geo.bron.opgehaald).toBeTruthy();
    }
  });
});

/**
 * The countries, which arrived with a hundred times as many items as anything
 * before them and a build that wrote them rather than a person (ADR-086).
 *
 * Everything here is the same question the provinces answer, asked of a file
 * nobody read line by line: does every question have a shape, is every shape a
 * question, and can a finger land on the small ones.
 */
describe('the countries of Europe and of the world', () => {
  const regios = [
    { regio: 'europa', set: 'europa-landen', minstens: 40 },
    { regio: 'wereld', set: 'wereld-landen', minstens: 150 },
  ] as const;

  function landenGeo(regio: string, niveau: Detailniveau): GeoSet {
    const path = join(process.cwd(), 'public', 'geo', regio, `landen.${niveau}.json`);
    return JSON.parse(readFileSync(path, 'utf8')) as GeoSet;
  }

  it.each(regios)('asks about enough of $regio to be worth the name', ({ set, minstens }) => {
    expect(itemsOfSet(set).length).toBeGreaterThanOrEqual(minstens);
  });

  it.each(regios)(
    'resolves every question in $regio to a shape, at every level',
    ({ regio, set }) => {
      for (const niveau of NIVEAUS) {
        const shapes = new Set(landenGeo(regio, niveau).vormen.map((vorm) => vorm.id));
        const dangling = itemsOfSet(set)
          .filter((item) => !shapes.has(item.geometrieRef ?? ''))
          .map((item) => item.id);

        // Every level, not only the one the round draws. A country simplified out
        // of existence at `overview` is a shape a child could be asked to point
        // at and could not see — which is what the build's "kept its largest
        // ring" fallback exists to prevent.
        expect(dangling, `${set} at ${niveau}`).toEqual([]);
      }
    },
  );

  it.each(regios)('draws nothing in $regio that is not a question', ({ regio, set }) => {
    const asked = new Set(itemsOfSet(set).map((item) => item.geometrieRef));
    const orphans = landenGeo(regio, 'region')
      .vormen.filter((vorm) => !asked.has(vorm.id))
      .map((vorm) => vorm.id);

    // The map is the answer layer here, the way the provinces are: a shape a
    // child can press that answers no question is a shape that can only ever
    // be wrong.
    expect(orphans).toEqual([]);
  });

  it.each(regios)('gives every country in $regio a target a finger can land on', ({ regio }) => {
    // A Chromebook, which is the smallest map in spec section 8.
    const geo = landenGeo(regio, 'region');
    const fit = fitView(geo.viewBox[3], 700);

    for (const vorm of geo.vormen) {
      const help = helpTargetFor(vorm.bbox, fit, vorm.punt);
      const reachable = help !== null || !needsHelpTarget(vorm.bbox, fit);
      expect(reachable, vorm.bronnaam).toBe(true);
    }
  });

  /**
   * And which of them actually get a ring, which is not the same question.
   *
   * A ring takes over as the target from the shape under it, so two that
   * overlap are two ways to hit the wrong country. `helpTargets` shrinks them
   * until none touch and drops what shrinking ruined — and both ends of that
   * are worth pinning, because neither shows up in a screenshot anybody reads.
   */
  it('rings the microstates of Europe on a laptop, and almost nothing on a world phone', () => {
    const ringen = (regio: string, px: number) => {
      const geo = landenGeo(regio, 'region');
      const fit = fitView(geo.viewBox[3], px);
      return helpTargets(geo.vormen, fit, (vorm) => vorm.punt);
    };

    // A laptop. Vaticaanstad is 0.2 view units across — a fifth of a pixel — and
    // it still has to be reachable, which is the whole reason a ring shrinks
    // rather than gives up when San Marino is close by.
    const europa = ringen('europa', 700);
    for (const id of ['eu-land-vaticaanstad', 'eu-land-san-marino', 'eu-land-monaco']) {
      expect([...europa.keys()], id).toContain(id);
    }

    // A phone, where the world is 190 pixels tall: every ring would reach its
    // neighbours, so shrinking leaves nothing a finger could use and the
    // coastlines are the targets again.
    expect(ringen('wereld', 190).size).toBeLessThan(5);
  });

  it('never lets two rings reach each other', () => {
    // The rule the whole thing exists for: a child aiming at one country must
    // not land inside another one's target.
    for (const [regio, px] of [
      ['europa', 700],
      ['europa', 190],
      ['wereld', 700],
      ['wereld', 190],
    ] as const) {
      const geo = landenGeo(regio, 'region');
      const ringen = [...helpTargets(geo.vormen, fitView(geo.viewBox[3], px), (v) => v.punt)];

      for (const [idA, a] of ringen) {
        for (const [idB, b] of ringen) {
          if (idA === idB) continue;
          const gap = Math.hypot(a.cx - b.cx, a.cy - b.cy);
          expect(gap, `${regio}@${px}: ${idA} and ${idB} overlap`).toBeGreaterThanOrEqual(
            a.r + b.r - 0.001,
          );
        }
      }
    }
  });

  it.each(regios)('lets every country in $regio win its own question', ({ set }) => {
    // The whole region, which is what a round passes: an answer must not be
    // right or wrong depending on which exercise a child is doing (ADR-017).
    const catalogue = itemsOfSet(set);
    const failures: string[] = [];

    for (const item of catalogue) {
      if (judgeAnswer(item.naam, item, catalogue).kind !== 'correct') {
        failures.push(`${item.naam} does not win its own question`);
      }
      for (const alias of item.aliassen) {
        if (judgeAnswer(alias, item, catalogue).kind !== 'correct') {
          failures.push(`alias ${alias} of ${item.naam} is rejected`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('keeps the names Natural Earth has not caught up with', () => {
    // The two corrections the build makes, and the old names it keeps as
    // aliases. A child writing what their older brother learned is not wrong.
    const wereld = itemsOfSet('wereld-landen');
    const eswatini = wereld.find((item) => item.naam === 'Eswatini');
    const belarus = wereld.find((item) => item.naam === 'Belarus');

    expect(eswatini?.aliassen).toContain('Swaziland');
    expect(belarus?.aliassen).toContain('Wit-Rusland');
  });
});

describe('typed answers against the real content', () => {
  // Everything in the region, which is what the app passes (ADR-017): an answer
  // must not be right or wrong depending on which exercise a child is doing.
  const catalogue = items.filter((item) => item.regioSet === 'nederland');
  const byId = (id: string) => catalogue.find((item) => item.id === id);

  it('lets every item win its own question, and every alias too', () => {
    const failures: string[] = [];

    for (const item of catalogue) {
      if (judgeAnswer(item.naam, item, catalogue).kind !== 'correct') {
        failures.push(`${item.naam} does not win its own question`);
      }
      for (const alias of item.aliassen) {
        if (judgeAnswer(alias, item, catalogue).kind !== 'correct') {
          failures.push(`alias ${alias} of ${item.naam} is rejected`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  /**
   * Utrecht and Groningen each exist twice — as a province and as its capital.
   * A wider catalogue is what makes "bijna" possible, and this is where it
   * could have backfired: an exact name shared by two items must still be
   * correct for whichever of them was asked.
   */
  it('handles the names that belong to two different items', () => {
    for (const id of [
      'nl-prov-utrecht',
      'nl-stad-utrecht',
      'nl-prov-groningen',
      'nl-stad-groningen',
    ]) {
      const item = byId(id);
      expect(item, id).toBeDefined();
      expect(judgeAnswer(item?.naam ?? '', item as never, catalogue).kind, id).toBe('correct');
    }
  });

  it('calls a real place from the other set a near miss, not a mistake', () => {
    const assen = byId('nl-stad-assen');
    const gelderland = byId('nl-prov-gelderland');
    expect(assen).toBeDefined();
    expect(gelderland).toBeDefined();

    // A child asked for a capital who writes a province name has named
    // something real. That is worth a different sentence from a cross.
    expect(judgeAnswer('Drenthe', assen as never, catalogue).kind).toBe('near-miss');
    expect(judgeAnswer('Limburg', gelderland as never, catalogue).kind).toBe('near-miss');
  });

  it('still forgives an ordinary typo', () => {
    const gelderland = byId('nl-prov-gelderland');
    // A swapped pair of letters, which plain Levenshtein would have refused.
    expect(judgeAnswer('Gelderlnad', gelderland as never, catalogue).kind).toBe('correct');
  });
});

describe('typo tolerance collisions', () => {
  /**
   * Under ADR-017 these pairs are safe — the collision guard refuses to accept
   * either one as a typo of the other. They are still worth printing, because
   * they are the items for which the typo tolerance is switched off entirely: a
   * child spelling one of them has to spell it exactly right.
   */
  it('reports name pairs that the collision guard is protecting', () => {
    for (const set of sets) {
      const misses = findNearMisses(set.items);
      if (misses.length > 0) {
        const pairs = misses.map((m) => `${m.a} / ${m.b}`).join(', ');
        console.warn(
          `[content] ${set.id}: ${misses.length} guarded pair(s), no typo tolerance — ${pairs}`,
        );
      }
    }

    expect(true).toBe(true);
  });
});

/**
 * Every set the app can start, against the files that are actually on disk.
 *
 * This is the test that was missing, and its absence cost a release. The
 * islands were written to `waddeneilanden.json` and asked for as
 * `waddeneilanden.detail.json`; the app 404'd and answered "de kaart kon niet
 * geladen worden", and nothing here noticed — because the tests above read the
 * files by the name the *builder* uses, and the app reads them by the name
 * `loadGeoSet` composes. Two spellings, never compared (ADR-069).
 *
 * So this compares them, from the app's side: for each set, the URL the round
 * will fetch, resolved to a path under public/. The e2e suite cannot stand in
 * for it — it would have to start a round of every set in every module to find
 * the same thing, and it started rounds of four sets out of five.
 */
describe('the map file every set actually asks for', () => {
  const onDisk = (url: string) => join(process.cwd(), 'public', url.replace(/^\/+/, ''));

  it('exists for every set a child can practise', () => {
    const missing: string[] = [];

    for (const setId of SET_IDS) {
      const shape = SETS[setId];

      // The background, which every round draws whatever it is asking about.
      // It belongs to the set now that there is more than one region, so it is
      // checked per set rather than once (ADR-086).
      const achtergrond = geoUrl(shape.achtergrond, 'region', shape.regio);
      if (!existsSync(onDisk(achtergrond))) missing.push(`${setId} → ${achtergrond}`);

      if (shape.answers === 'background') continue;
      const url =
        shape.answers === 'points'
          ? pointUrl(shape.bestand, shape.regio)
          : geoUrl(shape.bestand, shape.niveau, shape.regio);
      if (!existsSync(onDisk(url))) missing.push(`${setId} → ${url}`);
    }

    expect(missing, 'a round of these answers with a blank map').toEqual([]);
  });
});
