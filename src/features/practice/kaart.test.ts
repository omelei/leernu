import { describe, expect, it } from 'vitest';
import type { Item } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import {
  kaartSets,
  kaartVoor,
  SETS,
  tekentEenKaart,
  WERELDDEEL_SET_IDS,
  type SetId,
} from './useRound';

/**
 * Which map a question is drawn on (ADR-091).
 *
 * A question about a country of the world is asked on the map of its
 * werelddeel, because a map of a hundred and sixty-seven countries is one a
 * child cannot point at and cannot read. Everything else is asked on the map of
 * the set it belongs to, exactly as it always was — and that "everything else"
 * is most of this file, because the failure worth catching is the one where a
 * rule written for the world quietly reaches the provinces.
 */

function itemVan(setId: SetId, naam: string): Item {
  const item = loadItemSets()
    .find((set) => set.id === setId)
    ?.items.find((candidate) => candidate.naam === naam);
  if (!item) throw new Error(`${naam} staat niet in ${setId}`);
  return item;
}

describe('the map a question is drawn on', () => {
  it('is the set’s own map, for every set but one', () => {
    const drenthe = itemVan('nl-provincies', 'Drenthe');
    expect(kaartVoor(drenthe, SETS['nl-provincies'])).toEqual({
      regio: 'nl',
      achtergrond: 'provincies',
      vormId: drenthe.geometrieRef,
    });

    const spanje = itemVan('europa-landen', 'Spanje');
    expect(kaartVoor(spanje, SETS['europa-landen']).regio).toBe('europa');
  });

  it('is the werelddeel, for a country of the world', () => {
    expect(kaartVoor(itemVan('wereld-landen', 'Brazilië'), SETS['wereld-landen'])).toEqual({
      regio: 'zuid-amerika',
      achtergrond: 'landen',
      vormId: 'za-land-brazilie',
    });

    // Not the world map, and not the world's own shape id: both would draw the
    // thing this decision exists to stop drawing.
    const kenia = kaartVoor(itemVan('wereld-landen', 'Kenia'), SETS['wereld-landen']);
    expect(kenia.regio).toBe('afrika');
    expect(kenia.vormId).not.toBe('wl-land-kenia');
  });

  it('falls back to the set’s own map when the relation is missing', () => {
    // Content the build could not resolve. It warns, and a test above fails —
    // but a child in front of it gets a question they can still answer.
    const los: Item = {
      id: 'wl-land-brazilie',
      type: 'land',
      naam: 'Brazilië',
      aliassen: [],
      regioSet: 'wereld',
      geometrieRef: 'wl-land-brazilie',
      niveau: 1,
      leerdoelen: [],
    };
    expect(kaartVoor(los, SETS['wereld-landen'])).toEqual({
      regio: 'wereld',
      achtergrond: 'landen',
      vormId: 'wl-land-brazilie',
    });
  });
});

describe('which sets name the shapes on those maps', () => {
  it('is the round’s own set, normally', () => {
    expect(kaartSets('nl-provincies')).toEqual(['nl-provincies']);
    // The Topomix draws one map with five layers, and all five name shapes.
    expect(kaartSets('nl-mix').length).toBe(5);
  });

  it('is the six werelddelen, for the world', () => {
    // Because the map on screen is theirs: without this a screen reader would
    // hear Natural Earth's spelling for every country except the one being
    // asked about.
    expect(kaartSets('wereld-landen')).toEqual(WERELDDEEL_SET_IDS);
  });
});

describe('whether a round draws one map', () => {
  it('is true for a single set and false for the two that change maps', () => {
    // What the result screen asks before it draws a review map: it can light up
    // the misses that are on the map it has, and no others.
    expect(tekentEenKaart('nl-provincies')).toBe(true);
    expect(tekentEenKaart('europa-landen')).toBe(true);
    expect(tekentEenKaart('nl-mix')).toBe(false);
    expect(tekentEenKaart('wereld-landen')).toBe(false);
  });
});
