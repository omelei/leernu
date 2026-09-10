import { describe, expect, it } from 'vitest';
import {
  AANTAL_HELDEN,
  goedTotKist,
  kistenVoor,
  openKist,
  openVerdiend,
  sterrenInKist,
  sterrenVoor,
  uitLadder,
  volgendeReeks,
  type HeldenStand,
} from './helden';
import { correctForLevel } from './rewards';

/**
 * Heroes, stars and chests (ADR-096). The draw is handed in, so every chest
 * here opens on a number the test chose: the chance is in the store, and what
 * is worth pinning is everything around it.
 */

/** The draw that picks the hero at this place. */
const op = (plek: number) => (plek + 0.5) / AANTAL_HELDEN;

describe('stars and chests', () => {
  it('makes a star of ten correct answers and a chest of five stars', () => {
    expect(sterrenVoor(9)).toBe(0);
    expect(sterrenVoor(10)).toBe(1);
    expect(kistenVoor(49)).toBe(0);
    expect(kistenVoor(50)).toBe(1);
    expect(kistenVoor(149)).toBe(2);
  });

  it('counts the stars towards the next chest, and what is still to go', () => {
    expect(sterrenInKist(0)).toBe(0);
    expect(sterrenInKist(30)).toBe(3);
    expect(sterrenInKist(50)).toBe(0);
    expect(goedTotKist(0)).toBe(50);
    expect(goedTotKist(49)).toBe(1);
    expect(goedTotKist(50)).toBe(50);
  });

  it('never counts backwards from a negative number', () => {
    expect(sterrenVoor(-5)).toBe(0);
    expect(kistenVoor(-5)).toBe(0);
  });
});

describe('from the old ladder', () => {
  it('starts a new child with the three the ladder always started with', () => {
    expect(uitLadder(0)).toEqual({
      helden: [
        { plek: 0, reeks: 'brons', dubbelen: 0 },
        { plek: 1, reeks: 'brons', dubbelen: 0 },
        { plek: 2, reeks: 'brons', dubbelen: 0 },
      ],
      kistenOpen: 0,
    });
  });

  it('keeps every animal a child held, in the highest reeks they held it in', () => {
    // Level fifteen holds seventeen animals: all twelve in bronze, and the
    // first five again in silver.
    const stand = uitLadder(correctForLevel(15));

    expect(stand.helden).toHaveLength(12);
    expect(stand.helden.slice(0, 5).every((held) => held.reeks === 'zilver')).toBe(true);
    expect(stand.helden.slice(5).every((held) => held.reeks === 'brons')).toBe(true);
  });

  it('counts the chests those answers paid for as opened, so none arrive as a pile', () => {
    const correct = correctForLevel(15);
    const stand = uitLadder(correct);

    expect(stand.kistenOpen).toBe(kistenVoor(correct));
    expect(openVerdiend(stand, correct, () => 0).uitkomsten).toEqual([]);
  });
});

describe('a chest', () => {
  const begin: HeldenStand = uitLadder(0);

  it('gives a hero not yet held, in bronze', () => {
    const { stand, uitkomst } = openKist(begin, op(7));

    expect(uitkomst).toEqual({ plek: 7, reeks: 'brons', dubbelen: 0, soort: 'nieuw' });
    expect(stand.helden).toHaveLength(4);
    expect(stand.kistenOpen).toBe(1);
  });

  it('counts a hero already held as a duplicate', () => {
    const { uitkomst } = openKist(begin, op(0));
    expect(uitkomst).toEqual({ plek: 0, reeks: 'brons', dubbelen: 1, soort: 'dubbel' });
  });

  it('moves a hero up a reeks on its third duplicate', () => {
    let stand = begin;
    const soorten: string[] = [];
    for (let keer = 0; keer < 3; keer++) {
      const geopend = openKist(stand, op(1));
      stand = geopend.stand;
      soorten.push(geopend.uitkomst.soort);
    }

    expect(soorten).toEqual(['dubbel', 'dubbel', 'hoger']);
    expect(stand.helden.find((held) => held.plek === 1)).toEqual({
      plek: 1,
      reeks: 'zilver',
      dubbelen: 0,
    });
  });

  it('says so when a hero is already at the top', () => {
    const stand: HeldenStand = {
      helden: [{ plek: 4, reeks: 'ultra', dubbelen: 0 }],
      kistenOpen: 0,
    };
    const { uitkomst } = openKist(stand, op(4));

    expect(uitkomst.soort).toBe('vol');
    expect(uitkomst.reeks).toBe('ultra');
  });

  it('reaches every one of the twelve, and nothing past them', () => {
    const plekken = new Set<number>();
    for (let plek = 0; plek < AANTAL_HELDEN; plek++) {
      plekken.add(openKist(begin, op(plek)).uitkomst.plek);
    }
    expect(plekken.size).toBe(AANTAL_HELDEN);

    // The edges of the draw land on the first and the last, never outside.
    expect(openKist(begin, 0).uitkomst.plek).toBe(0);
    expect(openKist(begin, 0.999_999).uitkomst.plek).toBe(AANTAL_HELDEN - 1);
    expect(openKist(begin, 1).uitkomst.plek).toBe(AANTAL_HELDEN - 1);
  });

  it('names the reeks above each one, and none above ultra', () => {
    expect(volgendeReeks('brons')).toBe('zilver');
    expect(volgendeReeks('platina')).toBe('ultra');
    expect(volgendeReeks('ultra')).toBeNull();
  });
});

describe('the chests a round paid for', () => {
  it('opens exactly the ones owed, in order, and remembers it did', () => {
    const trekken = [op(5), op(0)];
    const { stand, uitkomsten } = openVerdiend(uitLadder(0), 100, () => trekken.shift() ?? 0);

    expect(uitkomsten.map((uitkomst) => uitkomst.soort)).toEqual(['nieuw', 'dubbel']);
    expect(stand.kistenOpen).toBe(2);

    // Asked again with the same answers, there is nothing left to open.
    expect(openVerdiend(stand, 100, () => 0).uitkomsten).toEqual([]);
  });

  it('opens nothing before the first fifty', () => {
    expect(openVerdiend(uitLadder(0), 49, () => 0).uitkomsten).toEqual([]);
  });
});
