import { describe, expect, it } from 'vitest';
import {
  aanbod,
  AANTAL_HELDEN,
  DUBBELEN_PER_REEKS,
  goedInSter,
  goedTotKist,
  KEUZE_PER_KIST,
  KIST_VOLGORDE,
  kistenTeGoed,
  kistenVoor,
  kistProgress,
  openKist,
  sterrenInKist,
  sterrenVoor,
  uitLadder,
  volgendeReeks,
  vorigeReeks,
  watKistDoet,
  type HeldenStand,
} from './helden';
import { correctForLevel } from './rewards';
import type { Reeks } from './collection';

/**
 * Heroes, stars and chests (ADR-096, ADR-097).
 *
 * There is nothing to hand a draw into any more. A chest offers three and the
 * child chooses one, so what is worth pinning is what may be offered, what
 * choosing does, and the two properties the whole decision rests on: a chest
 * never hands over a hero the child already has while one is missing, and
 * twelve chests are always twelve heroes.
 */

/** Every hero, so a stand can be built at any point in the collection. */
function alles(reeks: Reeks): HeldenStand {
  return {
    helden: Array.from({ length: AANTAL_HELDEN }, (_, plek) => ({ plek, reeks, dubbelen: 0 })),
    kistenOpen: 0,
  };
}

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

  it('counts the answers towards the star being filled, which a round shows', () => {
    expect(goedInSter(0)).toBe(0);
    expect(goedInSter(7)).toBe(7);
    expect(goedInSter(10)).toBe(0);
    expect(goedInSter(23)).toBe(3);
  });

  it('fills the bar towards the chest rather than towards the level', () => {
    expect(kistProgress(0)).toBe(0);
    expect(kistProgress(25)).toBe(0.5);
    expect(kistProgress(50)).toBe(0);
  });

  it('never counts backwards from a negative number', () => {
    expect(sterrenVoor(-5)).toBe(0);
    expect(kistenVoor(-5)).toBe(0);
    expect(goedInSter(-5)).toBe(0);
  });
});

describe('the order a chest works through', () => {
  it('holds every one of the twelve exactly once', () => {
    expect([...KIST_VOLGORDE].sort((a, b) => a - b)).toEqual(
      Array.from({ length: AANTAL_HELDEN }, (_, plek) => plek),
    );
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
    expect(kistenTeGoed(stand, correct)).toBe(0);
  });
});

describe('what a chest offers', () => {
  const begin: HeldenStand = uitLadder(0);

  it('lays out three, and none of them a hero already held', () => {
    const drie = aanbod(begin);

    expect(drie).toHaveLength(KEUZE_PER_KIST);
    expect(drie.some((plek) => plek <= 2)).toBe(false);
    expect(new Set(drie).size).toBe(KEUZE_PER_KIST);
  });

  it('offers the missing ones in the fixed order, the same for every child', () => {
    expect(aanbod(begin)).toEqual(KIST_VOLGORDE.filter((plek) => plek > 2).slice(0, 3));
  });

  it('offers heroes that can still climb once all twelve are held', () => {
    const drie = aanbod(alles('goud'));

    expect(drie).toEqual(KIST_VOLGORDE.slice(0, KEUZE_PER_KIST));
  });

  it('offers nothing at all when every hero is at ultra', () => {
    expect(aanbod(alles('ultra'))).toEqual([]);
  });

  it('offers what is left when fewer than three can still climb', () => {
    const stand: HeldenStand = {
      helden: Array.from({ length: AANTAL_HELDEN }, (_, plek) => ({
        plek,
        reeks: plek === KIST_VOLGORDE[0] ? 'platina' : 'ultra',
        dubbelen: 0,
      })),
      kistenOpen: 0,
    };

    expect(aanbod(stand)).toEqual([KIST_VOLGORDE[0]]);
  });
});

describe('choosing from a chest', () => {
  const begin: HeldenStand = uitLadder(0);

  it('gives the hero the child picked, in bronze, and says which chest did it', () => {
    const keuze = aanbod(begin)[1] as number;
    const { stand, uitkomst } = openKist(begin, keuze);

    expect(uitkomst).toEqual({
      plek: keuze,
      reeks: 'brons',
      dubbelen: 0,
      soort: 'nieuw',
      kist: 1,
    });
    expect(stand.helden).toHaveLength(4);
    expect(stand.kistenOpen).toBe(1);
  });

  it('never hands over a duplicate while a hero is still missing', () => {
    let stand = begin;
    const soorten: string[] = [];

    // Nine chests is every hero the ladder did not hand out.
    for (let kist = 0; kist < AANTAL_HELDEN - 3; kist++) {
      const geopend = openKist(stand, aanbod(stand)[0] as number);
      stand = geopend.stand;
      soorten.push(geopend.uitkomst.soort);
    }

    expect(soorten.every((soort) => soort === 'nieuw')).toBe(true);
    expect(stand.helden).toHaveLength(AANTAL_HELDEN);
  });

  it('reaches all twelve in twelve chests however the child chooses', () => {
    // Always taking the last of the three is the most impatient strategy there
    // is, and it still ends with the whole collection.
    let stand: HeldenStand = { helden: [], kistenOpen: 0 };

    for (let kist = 0; kist < AANTAL_HELDEN; kist++) {
      const drie = aanbod(stand);
      stand = openKist(stand, drie[drie.length - 1] as number).stand;
    }

    expect(stand.helden.map((held) => held.plek).sort((a, b) => a - b)).toEqual(
      Array.from({ length: AANTAL_HELDEN }, (_, plek) => plek),
    );
    expect(stand.helden.every((held) => held.reeks === 'brons')).toBe(true);
  });

  it('counts a duplicate and moves a hero up on the third one', () => {
    let stand = alles('brons');
    const keuze = aanbod(stand)[0] as number;
    const soorten: string[] = [];

    for (let keer = 0; keer < DUBBELEN_PER_REEKS; keer++) {
      const geopend = openKist(stand, keuze);
      stand = geopend.stand;
      soorten.push(geopend.uitkomst.soort);
    }

    expect(soorten).toEqual(['dubbel', 'dubbel', 'hoger']);
    expect(stand.helden.find((held) => held.plek === keuze)).toEqual({
      plek: keuze,
      reeks: 'zilver',
      dubbelen: 0,
    });
  });

  it('never lands on a hero at ultra, so nothing is ever handed over twice over', () => {
    const stand: HeldenStand = {
      helden: Array.from({ length: AANTAL_HELDEN }, (_, plek) => ({
        plek,
        reeks: plek === 4 ? 'platina' : 'ultra',
        dubbelen: 0,
      })),
      kistenOpen: 0,
    };

    expect(aanbod(stand)).toEqual([4]);
    expect(openKist(stand, 7).uitkomst.plek).toBe(4);
    expect(openKist(stand, 7).uitkomst.soort).not.toBe('vol');
  });

  it('falls back to the first on offer when asked for something it did not offer', () => {
    const drie = aanbod(begin);
    expect(openKist(begin, 0).uitkomst.plek).toBe(drie[0]);
  });

  it('says what a card would do before the child presses it', () => {
    const stand = alles('brons');
    const keuze = aanbod(stand)[0] as number;

    expect(watKistDoet(stand, keuze).soort).toBe('dubbel');
    // And it changes nothing: the stand it was asked about still has no
    // duplicates on it.
    expect(stand.helden.every((held) => held.dubbelen === 0)).toBe(true);
  });

  it('names the reeks above and below each one', () => {
    expect(volgendeReeks('brons')).toBe('zilver');
    expect(volgendeReeks('platina')).toBe('ultra');
    expect(volgendeReeks('ultra')).toBeNull();
    expect(vorigeReeks('zilver')).toBe('brons');
    expect(vorigeReeks('brons')).toBeNull();
  });
});

describe('the chests a round paid for', () => {
  it('owes exactly the ones the answers bought and no more', () => {
    const stand = uitLadder(0);

    expect(kistenTeGoed(stand, 49)).toBe(0);
    expect(kistenTeGoed(stand, 50)).toBe(1);
    expect(kistenTeGoed(stand, 100)).toBe(2);
  });

  it('still owes a chest that was earned and never opened', () => {
    const stand = uitLadder(0);
    const na = openKist(stand, aanbod(stand)[0] as number).stand;

    expect(kistenTeGoed(na, 100)).toBe(1);
    expect(kistenTeGoed(na, 50)).toBe(0);
  });
});
