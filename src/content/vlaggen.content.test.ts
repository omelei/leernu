import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  alleVlaggen,
  loadVlagSet,
  loadVlagSets,
  MIN_VLAGGEN,
  vlagGroepen,
  vlagLanden,
  vlagPool,
  vlagProvincies,
} from './loadVlaggen';

/**
 * The flags are generated (tools/content/build-vlaggen.mjs), and this is what
 * stands between the file and a classroom.
 *
 * Which countries are in it is not a judgement this test makes — it is written
 * down in content/vlaggen/AFBAKENING.md and was decided by the product owner.
 * What is checked here is that the file still says what that note says, so the
 * choice cannot be reversed by a regeneration nobody read.
 */

const landen = vlagLanden();
const provincies = vlagProvincies();
const alle = alleVlaggen();
const iso = (code: string) => landen.find((vlag) => vlag.iso === code);

describe('which countries', () => {
  it('holds 196: the 193 member states, Kosovo, Vaticaanstad and Taiwan', () => {
    expect(landen).toHaveLength(196);
    expect(iso('XK')?.naam).toBe('Kosovo');
    expect(iso('VA')?.naam).toBe('Vaticaanstad');
    expect(iso('TW')?.naam).toBe('Taiwan');
  });

  it('does not hold Palestina, nor any territory that is not a state', () => {
    for (const code of ['PS', 'AW', 'CW', 'SX', 'GL', 'HK', 'PR', 'EH', 'FO']) {
      expect(iso(code), code).toBeUndefined();
    }
  });

  it('holds the twelve provinces, each linked to the province topography knows', () => {
    expect(provincies).toHaveLength(12);
    for (const vlag of provincies) {
      expect(vlag.topo, vlag.iso).toHaveLength(1);
      expect(vlag.topo[0], vlag.iso).toMatch(/^nl-prov-/);
      expect(vlag.werelddelen).toEqual(['nederland']);
    }
  });

  it('gives every flag its own code and its own id', () => {
    expect(new Set(alle.map((vlag) => vlag.iso)).size).toBe(alle.length);
    expect(new Set(alle.map((vlag) => vlag.id)).size).toBe(alle.length);
  });
});

describe('what every flag carries', () => {
  it('has a werelddeel, and Cyprus has two', () => {
    for (const vlag of landen) expect(vlag.werelddelen.length, vlag.iso).toBeGreaterThan(0);
    expect(iso('CY')?.werelddelen).toEqual(expect.arrayContaining(['europa', 'azie']));
  });

  it('has a picture that is in the repository', () => {
    for (const vlag of alle) {
      expect(vlag.beeld, vlag.iso).toMatch(/^vlaggen\/[a-z-]+\.svg$/);
      expect(existsSync(join(process.cwd(), 'public', vlag.beeld)), vlag.beeld).toBe(true);
    }
  });

  it('knows its own shape, from Nepal to Qatar', () => {
    for (const vlag of alle) {
      expect(vlag.verhouding, vlag.iso).toBeGreaterThan(0.75);
      expect(vlag.verhouding, vlag.iso).toBeLessThan(2.7);
    }
    expect(iso('VA')?.verhouding).toBe(1);
    expect(iso('CH')?.verhouding).toBe(1);
    expect(iso('NP')?.verhouding).toBeLessThan(1);
  });

  it('has a capital, a description and one fact', () => {
    for (const vlag of alle) {
      expect(vlag.hoofdstad.trim(), vlag.iso).not.toBe('');
      expect(vlag.beschrijving.trim(), vlag.iso).not.toBe('');
      expect(vlag.weetje.trim(), vlag.iso).not.toBe('');
    }
  });

  it('never gives the answer away in what a screen reader hears', () => {
    // In "Vlag zoeken" the description is the name of each option, and the
    // country is the question. A description that said "Nederland" would
    // answer it.
    for (const vlag of alle) {
      for (const naam of [vlag.naam, ...vlag.aliassen]) {
        expect(vlag.beschrijving.toLocaleLowerCase('nl'), vlag.iso).not.toContain(
          naam.toLocaleLowerCase('nl'),
        );
      }
    }
  });

  it('does not count Kosovo or Vaticaanstad among the well-known flags', () => {
    expect(iso('XK')?.klasse).not.toBe('bekend');
    expect(iso('VA')?.klasse).not.toBe('bekend');
  });
});

describe('the flags that look alike', () => {
  it('has at least two flags in every group, and only flags that exist', () => {
    const ids = new Set(alle.map((vlag) => vlag.id));
    for (const groep of vlagGroepen()) {
      expect(groep.leden.length, groep.id).toBeGreaterThanOrEqual(2);
      for (const lid of groep.leden) expect(ids.has(lid), `${groep.id}: ${lid}`).toBe(true);
      expect(groep.reden.trim(), groep.id).not.toBe('');
    }
  });

  it('puts Tsjaad beside Roemenië and Nederland beside Luxemburg', () => {
    const samen = (a: string, b: string) =>
      vlagGroepen().some(
        (groep) =>
          groep.leden.includes(`vlag-${a.toLowerCase()}`) &&
          groep.leden.includes(`vlag-${b.toLowerCase()}`),
      );
    expect(samen('TD', 'RO')).toBe(true);
    expect(samen('NL', 'LU')).toBe(true);
    expect(samen('AU', 'NZ')).toBe(true);
  });
});

describe('the sets', () => {
  it('offers every flag of the world and every province in the mix', () => {
    expect(loadVlagSet('vlag-wereld-alle')?.items).toHaveLength(196);
    expect(loadVlagSet('vlag-wereld-mix')?.items).toHaveLength(208);
    expect(loadVlagSet('vlag-nederland-provincies')?.items).toHaveLength(12);
  });

  it('divides the world into the werelddelen topography uses', () => {
    const aantal = (regio: string) => loadVlagSet(`vlag-${regio}-alle`)?.items.length;
    expect(aantal('afrika')).toBe(54);
    expect(aantal('azie')).toBe(48);
    expect(aantal('europa')).toBe(46);
    expect(aantal('noord-amerika')).toBe(23);
    expect(aantal('zuid-amerika')).toBe(12);
    expect(aantal('oceanie')).toBe(14);
  });

  it('holds enough flags in every set to be a round', () => {
    for (const set of loadVlagSets()) {
      expect(set.items.length, set.id).toBeGreaterThanOrEqual(MIN_VLAGGEN);
    }
  });

  it('has no well-known flags of Oceanië, rather than a round of two', () => {
    expect(loadVlagSet('vlag-oceanie-bekend')).toBeUndefined();
    expect(loadVlagSet('vlag-wereld-bekend')?.items.length).toBeGreaterThanOrEqual(35);
  });

  it('lets three lives reach every flag of the werelddeel', () => {
    expect(vlagPool('vlag-europa-bekend')).toHaveLength(46);
    expect(vlagPool('vlag-nederland-provincies')).toHaveLength(12);
  });
});
