import { describe, expect, it } from 'vitest';
import { emptyState, type ItemState } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { loadKlokSet } from '@/content/loadKlok';
import { NL_SET_IDS, setsInRound } from '@/features/practice/useRound';
import { MODULES, type Module } from '@/features/shell/modules';
import { pathFor, routeFor } from '@/features/shell/routes';
import { formsFor, offeredForms, teDrukOmAanTeWijzen } from './forms';
import { onderwerpenVan, startbareOnderdelen } from './onderdelen';

/**
 * "Oefen je fouten" beyond the tables (ADR-103): on every map of topography
 * and on the clock, once a child has five mistakes there, and never before.
 */

const fout = (ids: readonly string[]): Map<string, ItemState> =>
  new Map(
    ids.map((id) => [
      id,
      { ...emptyState(id), laatsteReview: '2026-09-01T00:00:00.000Z', foutCount: 1 },
    ]),
  );
const idsVan = (setId: string, aantal: number) =>
  (loadItemSets().find((set) => set.id === setId)?.items ?? []).slice(0, aantal).map((i) => i.id);
const module = (id: Module['id']) => MODULES.find((kandidaat) => kandidaat.id === id) as Module;

describe('topography', () => {
  const per = (regio: string, known: ReadonlyMap<string, ItemState>) =>
    onderwerpenVan('topo', known).filter((vak) => vak.regio === regio);

  it('offers a list of mistakes on the map they were made on, from five', () => {
    const known = fout([...idsVan('nl-provincies', 3), ...idsVan('nl-hoofdsteden', 2)]);
    const vak = per('nederland', known).find((kandidaat) => kandidaat.id === 'nl-fouten');

    expect(vak?.naam).toBe('onderwerp.fouten');
    expect(vak?.sets[0]?.items).toHaveLength(5);
    // After the mix, which is still what "the way the test asks" means.
    expect(
      per('nederland', known)
        .map((kandidaat) => kandidaat.id)
        .slice(-2),
    ).toEqual(['nl-mix', 'nl-fouten']);
    expect(per('europa', known).map((kandidaat) => kandidaat.id)).toEqual(['europa-landen']);
  });

  it('does not offer four mistakes as a subject', () => {
    const known = fout(idsVan('nl-provincies', 4));
    expect(per('nederland', known).map((vak) => vak.id)).not.toContain('nl-fouten');
  });

  it('keeps a werelddeel to its own map', () => {
    const known = fout(idsVan('europa-landen', 5));
    expect(per('europa', known).map((vak) => vak.id)).toEqual(['europa-landen', 'europa-fouten']);
    expect(per('wereld', known).map((vak) => vak.id)).toEqual(['wereld-landen']);
  });

  it('asks a list on the map it spans', () => {
    expect(setsInRound('nl-fouten')).toEqual(NL_SET_IDS);
    expect(setsInRound('wereld-fouten')).toEqual(['wereld-landen']);
  });

  it('does not explore a list of mistakes, and leads with choosing where the map is crowded', () => {
    const vormen = offeredForms(formsFor('topo'), false, 'nl-fouten').map((form) => form.id);
    expect(vormen).not.toContain('ontdekken');

    expect(teDrukOmAanTeWijzen('wereld-fouten', 5, false)).toBe(true);
    expect(teDrukOmAanTeWijzen('zuid-amerika-fouten', 5, false)).toBe(false);
    expect(teDrukOmAanTeWijzen('nl-fouten', 5, true)).toBe(false);
  });
});

describe('the clock', () => {
  const vijf = (loadKlokSet('klok-heel')?.items ?? []).slice(0, 5).map((tijd) => tijd.id);

  it('offers every face got wrong, whichever step it came from, from five', () => {
    const vakken = onderwerpenVan('klok', fout(vijf));
    const vak = vakken.find((kandidaat) => kandidaat.id === 'klok-fouten');

    expect(vak?.sets[0]?.items).toHaveLength(5);
    expect(vakken.length).toBeLessThanOrEqual(6);
    expect(onderwerpenVan('klok', fout(vijf.slice(0, 4))).map((v) => v.id)).not.toContain(
      'klok-fouten',
    );
  });
});

describe('the addresses and the history', () => {
  it('gives each list an address', () => {
    expect(routeFor('/topografie/fouten')).toMatchObject({ setId: 'nl-fouten' });
    expect(routeFor('/topografie/europa-fouten')).toMatchObject({ setId: 'europa-fouten' });
    expect(routeFor('/klokkijken/fouten')).toMatchObject({ setId: 'klok-fouten' });
    expect(pathFor({ name: 'module', module: module('klok'), setId: 'klok-fouten' })).toBe(
      '/klokkijken/fouten',
    );
    expect(pathFor({ name: 'module', module: module('topo'), setId: 'nl-fouten' })).toBe(
      '/topografie/fouten',
    );
  });

  it('still opens each module\'s own mix at "mix"', () => {
    expect(routeFor('/topografie/mix')).toMatchObject({ setId: 'nl-mix' });
    expect(routeFor('/klokkijken/mix')).toMatchObject({ setId: 'klok-mix' });
  });

  it('places a round of mistakes in the history under its own name', () => {
    const ids = startbareOnderdelen().map((deel) => deel.setId);
    for (const id of ['nl-fouten', 'europa-fouten', 'wereld-fouten', 'klok-fouten']) {
      expect(ids).toContain(id);
    }
  });
});
