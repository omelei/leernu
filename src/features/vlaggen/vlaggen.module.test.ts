import { describe, expect, it } from 'vitest';
import type { ItemState } from '@/game-core';
import {
  formsFor,
  offeredForms,
  questionChoices,
  toetsVormVan,
  VLAG_FORMS,
  type PracticeForm,
} from '@/features/module/forms';
import {
  onderdelen,
  onderwerpenVan,
  starters,
  startbareOnderdelen,
} from '@/features/module/onderdelen';
import { regiosVan, TOPO_REGIOS } from '@/features/module/regios';
import { MODULES, type Module } from '@/features/shell/modules';
import { pathFor, routeFor } from '@/features/shell/routes';
import { richtingVan, VLAG_ROUND_RULE } from './useVlagRound';
import { vlagSetNaam } from './vlagNamen';

/**
 * Flags as the fourth module of the family (ADR-102): the same page, the same
 * questions in the same order, and only what is decided for flags different.
 */

const vlaggen = MODULES.find((module) => module.id === 'vlaggen') as Module;
const per = (regio: string, known?: ReadonlyMap<string, ItemState>) =>
  onderwerpenVan('vlaggen', known)
    .filter((vak) => vak.regio === regio)
    .map((vak) => vak.naam);

describe('the page', () => {
  it('is built, and asks where in the row topography asks it in', () => {
    expect(vlaggen.built).toBe(true);
    expect(regiosVan('vlaggen')).toBe(TOPO_REGIOS);
  });

  it('offers three subjects per werelddeel, and the mix only for the world', () => {
    expect(per('europa')).toEqual([
      'onderwerp.vlaggen.bekend',
      'onderwerp.vlaggen.alle',
      'onderwerp.vlaggen.lijkt',
    ]);
    expect(per('wereld')).toEqual([
      'onderwerp.vlaggen.bekend',
      'onderwerp.vlaggen.alle',
      'onderwerp.vlaggen.lijkt',
      'onderwerp.vlaggen.mix',
    ]);
  });

  it('offers only the province flags under Nederland', () => {
    expect(per('nederland')).toEqual(['onderwerp.vlaggen.provincies']);
  });

  it('leaves a subject out rather than offer a round of two flags', () => {
    expect(per('oceanie')).toEqual(['onderwerp.vlaggen.alle', 'onderwerp.vlaggen.lijkt']);
  });

  it('opens on Nederland, where a Dutch child starts', () => {
    expect(onderwerpenVan('vlaggen')[0]?.sets[0]?.setId).toBe('vlag-nederland-provincies');
  });

  it('adds "Oefen je fouten" to a region once five of its flags were wrong', () => {
    const fout = (id: string): [string, ItemState] => [
      id,
      {
        itemId: id,
        box: 1,
        laatsteReview: '2026-09-01T00:00:00.000Z',
        volgendeReview: '2026-09-02T00:00:00.000Z',
        goedCount: 0,
        foutCount: 1,
      },
    ];
    const known = new Map(['vlag-be', 'vlag-de', 'vlag-fr', 'vlag-it', 'vlag-nl'].map(fout));

    expect(per('europa', known)).toContain('onderwerp.fouten');
    expect(per('afrika', known)).not.toContain('onderwerp.fouten');

    const vak = onderwerpenVan('vlaggen', known).find(
      (kandidaat) => kandidaat.regio === 'europa' && kandidaat.naam === 'onderwerp.fouten',
    );
    expect(vak?.sets[0]?.items).toHaveLength(5);

    // Four is a list rather than a subject (MIN_FOUTEN).
    const vier = new Map(['vlag-be', 'vlag-de', 'vlag-fr', 'vlag-it'].map(fout));
    expect(per('europa', vier)).not.toContain('onderwerp.fouten');
  });

  it('counts every flag once toward progress, and no set twice', () => {
    const ids = onderdelen()
      .filter((deel) => deel.moduleId === 'vlaggen')
      .flatMap((deel) => deel.items.map((item) => item.id));
    expect(ids).toHaveLength(208);
    expect(new Set(ids).size).toBe(208);
  });

  it('names a set by its subject and where it is', () => {
    expect(vlagSetNaam({ regio: 'europa', onderwerp: 'bekend' })).toBe(
      'Bekende vlaggen van Europa',
    );
    expect(vlagSetNaam({ regio: 'wereld', onderwerp: 'alle' })).toBe('Alle vlaggen van de wereld');
    expect(vlagSetNaam({ regio: 'nederland', onderwerp: 'provincies' })).toBe('Provincievlaggen');
  });

  it('offers two ways into flags among the five a new child starts with', () => {
    const lijst = starters();
    expect(lijst).toHaveLength(5);
    expect(lijst.filter((entry) => entry.deel.moduleId === 'vlaggen')).toHaveLength(2);
  });
});

describe('the ways of practising', () => {
  const tegels = (setId: string, klok = false) =>
    offeredForms(formsFor('vlaggen'), klok, setId)
      .filter((form) => !form.alleenToets)
      .map((form) => form.id);

  it('offers four ways as tiles and the oefentoets, and no typing, even with the clock on', () => {
    expect(tegels('vlag-europa-bekend', true)).toEqual([
      'vlag-zoeken',
      'vlag-meerkeuze',
      'ontdekken',
      'overleven',
    ]);
    const ids = formsFor('vlaggen').map((form) => form.id);
    expect(ids).not.toContain('hoe-heet-dit');
    expect(ids).not.toContain('bliksemronde');
  });

  it('has an oefentoets that asks both ways round', () => {
    const toets = toetsVormVan(
      'vlaggen',
      offeredForms(formsFor('vlaggen'), false, 'vlag-europa-bekend'),
    );
    expect(toets?.id).toBe('vlag-gemengd');
    expect(toets?.alleenToets).toBe(true);

    expect([0, 1, 2, 3].map((index) => richtingVan('vlag-gemengd', index))).toEqual([
      'zoeken',
      'meerkeuze',
      'zoeken',
      'meerkeuze',
    ]);
    expect(richtingVan('overleven', 1)).toBe('meerkeuze');
    expect(richtingVan('vlag-zoeken', 1)).toBe('zoeken');
    expect(richtingVan('vlag-meerkeuze', 0)).toBe('meerkeuze');
  });

  it('does not explore a mix or a list of mistakes', () => {
    expect(tegels('vlag-wereld-mix')).not.toContain('ontdekken');
    expect(tegels('vlag-europa-fouten')).not.toContain('ontdekken');
    expect(tegels('vlag-europa-alle')).toContain('ontdekken');
  });

  it('asks ten questions, or the whole set where it fits in a round', () => {
    const zoeken = VLAG_FORMS[0] as PracticeForm;
    expect(VLAG_ROUND_RULE['vlag-zoeken']).toEqual({ kind: 'fixed', aantal: 10 });
    expect(VLAG_ROUND_RULE.overleven).toEqual({ kind: 'levens', levens: 3 });
    expect(questionChoices(zoeken, 12)).toEqual([10, 12]);
    expect(questionChoices(zoeken, 196)).toEqual([10, 25, 50, 100]);
  });
});

describe('the addresses', () => {
  it('gives every set of flags an address that opens on it', () => {
    for (const deel of startbareOnderdelen().filter(
      (kandidaat) => kandidaat.moduleId === 'vlaggen',
    )) {
      const route = { name: 'module', module: vlaggen, setId: deel.setId } as const;
      expect(routeFor(pathFor(route)), deel.setId).toEqual(route);
    }
  });

  it('answers to where and what, and the provinces to one word', () => {
    expect(routeFor('/vlaggen/europa-bekend')).toMatchObject({ setId: 'vlag-europa-bekend' });
    expect(routeFor('/vlaggen/provincies')).toMatchObject({ setId: 'vlag-nederland-provincies' });
    expect(pathFor({ name: 'module', module: vlaggen, setId: 'vlag-nederland-provincies' })).toBe(
      '/vlaggen/provincies',
    );
  });

  it('opens the module on a set that does not exist, rather than an error', () => {
    expect(routeFor('/vlaggen/oceanie-bekend')).toEqual({
      name: 'module',
      module: vlaggen,
      setId: null,
    });
  });
});
