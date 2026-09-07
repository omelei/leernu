import { describe, expect, it } from 'vitest';
import { loadItemSets } from './loadSets';
import { loadNeighbourSets } from './loadNeighbours';

/**
 * The neighbour lists are generated (ADR-036), which is exactly why they are
 * checked: nobody reads a generated file, so a build that quietly produced an
 * empty list, or one full of ids from a set that no longer exists, would ship.
 *
 * These run inside `npm run validate:content` with the rest of the content
 * gate, because a wrong distractor is a content bug and not a code one — a
 * child asked to choose between Limburg and three Frisian villages is being
 * taught nothing, and it would never fail a type check.
 */

const sets = loadItemSets();
const buurSets = loadNeighbourSets();

/** Three wrong answers, so multiple choice can always ask a real question. */
const NODIG = 3;

describe('neighbour lists', () => {
  it('has a list for every set that has one, and none for a set that is gone', () => {
    const setIds = new Set(sets.map((set) => set.id));
    for (const buren of buurSets) {
      expect(setIds, `${buren.setId} has no set`).toContain(buren.setId);
    }
  });

  it('was built from the content version it ships beside', () => {
    // A set edited without rerunning the build is the failure this catches:
    // the ids would still resolve and the neighbours would be last week's.
    for (const buren of buurSets) {
      const set = sets.find((candidate) => candidate.id === buren.setId);
      expect(set?.contentVersie, buren.setId).toBe(buren.contentVersie);
    }
  });

  it('covers every item in its set', () => {
    for (const buren of buurSets) {
      const set = sets.find((candidate) => candidate.id === buren.setId);
      for (const item of set?.items ?? []) {
        expect(buren.buren[item.id], `${buren.setId}: ${item.id}`).toBeDefined();
      }
    }
  });

  it('offers enough neighbours for a multiple-choice question', () => {
    for (const buren of buurSets) {
      for (const [id, lijst] of Object.entries(buren.buren)) {
        expect(lijst.length, `${id} has ${lijst.length} neighbours`).toBeGreaterThanOrEqual(NODIG);
      }
    }
  });

  it('names only items from the same set, and never the item itself', () => {
    for (const buren of buurSets) {
      const set = sets.find((candidate) => candidate.id === buren.setId);
      const eigen = new Set((set?.items ?? []).map((item) => item.id));

      for (const [id, lijst] of Object.entries(buren.buren)) {
        expect(lijst, `${id} is its own neighbour`).not.toContain(id);
        expect(new Set(lijst).size, `${id} lists a neighbour twice`).toBe(lijst.length);
        for (const buur of lijst) {
          expect(eigen, `${id} points at ${buur}, which is not in ${buren.setId}`).toContain(buur);
        }
      }
    }
  });

  /**
   * A handful of facts about the Netherlands, pinned.
   *
   * The checks above would all pass on a list built from the wrong geometry, or
   * from an adjacency rule with its comparison inverted — every id would still
   * be well formed and every list still long enough. These say what the answer
   * has to be, and they are the only place in this file where being wrong is
   * visible without opening a map.
   */
  it('puts the provinces that actually touch first', () => {
    const provincies = buurSets.find((set) => set.setId === 'nl-provincies');
    const buren = (id: string) => provincies?.buren[`nl-prov-${id}`] ?? [];
    const first = (id: string, count: number) => new Set(buren(id).slice(0, count));

    // Groningen touches two provinces and nothing else.
    expect(first('groningen', 2)).toEqual(new Set(['nl-prov-drenthe', 'nl-prov-fryslan']));

    // Zeeland touches two as well, and Limburg is not one of them — it is the
    // far corner of the country, and it must never lead the list.
    expect(first('zeeland', 2)).toEqual(new Set(['nl-prov-noord-brabant', 'nl-prov-zuid-holland']));
    expect(buren('zeeland').indexOf('nl-prov-limburg')).toBeGreaterThan(1);

    // Gelderland borders more provinces than any other, so its list is all
    // border and no filler.
    expect(first('gelderland', 6)).toEqual(
      new Set([
        'nl-prov-utrecht',
        'nl-prov-overijssel',
        'nl-prov-noord-brabant',
        'nl-prov-limburg',
        'nl-prov-zuid-holland',
        'nl-prov-flevoland',
      ]),
    );
  });

  it('puts the nearest island next to each island', () => {
    const eilanden = buurSets.find((set) => set.setId === 'nl-waddeneilanden');

    // West to east: Texel, Vlieland, Terschelling, Ameland, Schiermonnikoog.
    expect(eilanden?.buren['nl-eiland-texel']?.[0]).toBe('nl-eiland-vlieland');
    expect(eilanden?.buren['nl-eiland-schiermonnikoog']?.[0]).toBe('nl-eiland-ameland');
  });
});
