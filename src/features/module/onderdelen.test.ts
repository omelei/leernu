import { describe, expect, it } from 'vitest';
import {
  meestGeoefend,
  onderwerpenVan,
  POPULAR_SHOWN,
  starters,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from './onderdelen';
import type { ModeId } from '@/game-core';

/**
 * The two things on the front door that are worked out rather than read.
 *
 * "Meest geoefend" is a count over this device's own history (ADR-082), and it
 * is the one block on the screen where getting the arithmetic wrong would put a
 * number in front of a child that is not true about them. So the arithmetic is
 * tested here rather than through the browser: which sets come first, how many
 * times each was played, and which way in a tile takes.
 */

const deel = (setId: string): Onderdeel => ({
  moduleId: setId.startsWith('nl-') ? 'topo' : 'tafels',
  setId,
  naam: null,
  literalNaam: setId,
  kortNaam: null,
  mix: false,
  items: [],
  roundSize: 10,
});

const ronde = (setId: string, mode: ModeId, at: string): Gespeeld => ({
  deel: deel(setId),
  ronde: { mode, setId, itemIds: [], correct: 1, answered: 1, at },
});

describe('what a child goes back to most', () => {
  it('counts rounds per set, most first', () => {
    const lijst = meestGeoefend([
      ronde('tafel-3', 'som-typen', '2026-09-09T12:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-09T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-08T11:00:00.000Z'),
      ronde('nl-provincies', 'meerkeuze', '2026-09-07T11:00:00.000Z'),
    ]);

    expect(lijst.map((entry) => [entry.deel.setId, entry.keer])).toEqual([
      ['nl-provincies', 3],
      ['tafel-3', 1],
    ]);
  });

  /**
   * One tile per set, not one per set and way. That is the difference between
   * this block and the favourites in the column on the right: a shortcut back
   * in is about the afternoon you had, a tile on the front door is about the
   * exercise. So the tile takes the way this child chose most.
   */
  it('gives a set one tile, in the way it was answered most', () => {
    const lijst = meestGeoefend([
      ronde('nl-provincies', 'meerkeuze', '2026-09-09T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-08T11:00:00.000Z'),
      ronde('nl-provincies', 'wijs-aan', '2026-09-07T11:00:00.000Z'),
    ]);

    expect(lijst).toHaveLength(1);
    expect(lijst[0]?.mode).toBe('wijs-aan');
  });

  it('holds four, however many were played', () => {
    const veel = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, at) =>
      ronde(id, 'som-typen', `2026-09-0${at + 1}T11:00:00.000Z`),
    );

    expect(meestGeoefend(veel)).toHaveLength(POPULAR_SHOWN);
  });

  /**
   * Nought rather than a guess. There is no server to ask what is popular with
   * anybody else, so a child with no rounds behind them gets the four to start
   * with and a count that says so.
   */
  it('falls back to a starting list that is real and unplayed', () => {
    expect(meestGeoefend([])).toEqual([]);

    const begin = starters();
    const bestaat = new Set(startbareOnderdelen().map((set) => set.setId));

    expect(begin).toHaveLength(POPULAR_SHOWN);
    for (const entry of begin) {
      expect(bestaat.has(entry.deel.setId), entry.deel.setId).toBe(true);
      expect(entry.keer).toBe(0);
    }
  });
});

/**
 * Topography's subjects, after the region row took the place-name off them
 * (ADR-083) and then got two more regions to point at (ADR-086). Six is still
 * the ceiling a section may hold, and one word is the whole point of the
 * change — but the six is per region now, because that is what the page draws.
 */
describe('what topography offers', () => {
  const per = (regio: string) => onderwerpenVan('topo').filter((vak) => vak.regio === regio);

  it('offers five subjects under Nederland, in one word each', () => {
    expect(per('nederland').map((vak) => vak.id)).toEqual([
      'provincies',
      'steden',
      'wateren',
      'eilanden',
      'nl-mix',
    ]);
  });

  it('offers the countries, and only the countries, further out', () => {
    // One subject each, and that is not a placeholder: a continent has one
    // thing on it a child is asked to find (ADR-086).
    expect(per('europa').map((vak) => vak.id)).toEqual(['europa-landen']);
    expect(per('wereld').map((vak) => vak.id)).toEqual(['wereld-landen']);
  });

  it('never puts more than six cards in front of a child at once', () => {
    // The ceiling is per region, because a region is what step 1 draws.
    for (const regio of ['nederland', 'europa', 'wereld']) {
      expect(per(regio).length, regio).toBeLessThanOrEqual(6);
    }
    // And every subject belongs to a region, so none can go missing from the
    // page by having no row to sit under.
    expect(onderwerpenVan('topo').filter((vak) => vak.regio === null)).toEqual([]);
  });

  it('puts the two city sets under one subject, with a chip each', () => {
    const steden = onderwerpenVan('topo').find((vak) => vak.id === 'steden');

    expect(steden?.sets.map((set) => set.setId)).toEqual(['nl-hoofdsteden', 'nl-steden']);
    // A chip needs a short label; without one it would fall back to the full
    // set name and the row would be two sentences wide.
    expect(steden?.sets.every((set) => set.kortNaam !== null)).toBe(true);
    expect(steden?.keuze).not.toBeNull();
  });
});
