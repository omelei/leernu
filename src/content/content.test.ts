import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findNearMisses, judgeAnswer } from '@/game-core';
import { loadAllItems, loadItemSets } from './loadSets';
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

  it('resolves every capital to a projected point', () => {
    const points = new Set(loadPointsFromDisk('hoofdsteden').punten.map((punt) => punt.id));

    const dangling = itemsOfSet('nl-hoofdsteden')
      .filter((item) => !points.has(item.geometrieRef ?? ''))
      .map((item) => item.id);

    expect(dangling).toEqual([]);
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
    for (const id of ['nl-prov-utrecht', 'nl-stad-utrecht', 'nl-prov-groningen', 'nl-stad-groningen']) {
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
