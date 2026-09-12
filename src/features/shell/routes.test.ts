import { describe, expect, it } from 'vitest';
import { MODULE_SLUG, pathFor, routeFor } from './routes';
import { MODULES } from './modules';

/**
 * The addresses.
 *
 * Two things are being pinned. That every module in the plan has a path, so
 * adding the eighth cannot quietly leave it unreachable — and that a path a
 * child mistypes lands them somewhere they can carry on from rather than on an
 * error about their spelling.
 */
describe('the addresses', () => {
  it('opens the front door at the root', () => {
    expect(routeFor('/')).toEqual({ name: 'home' });
    expect(routeFor('')).toEqual({ name: 'home' });
  });

  it('gives every module in the plan a path of its own', () => {
    const slugs = MODULES.map((module) => MODULE_SLUG[module.id]);
    expect(new Set(slugs).size, 'two modules share a slug').toBe(slugs.length);

    for (const module of MODULES) {
      const route = routeFor(`/${MODULE_SLUG[module.id]}`);
      expect(route.name, module.id).toBe(module.built ? 'module' : 'soon');
    }
  });

  it('opens topography, which is the one that exists', () => {
    const route = routeFor('/topografie');
    expect(route).toMatchObject({ name: 'module' });
  });

  it('says "not yet" for a module the plan has and the product does not', () => {
    // Not a redirect to the home screen. The child asked a question by typing
    // an address, and showing them something else instead of answering is how
    // an app teaches you not to trust its addresses.
    //
    // This used to be klokkijken, which is now built — the assertion moving to
    // the next unbuilt module is the plan doing what ADR-051 says it does.
    const route = routeFor('/woordjes');
    expect(route).toMatchObject({ name: 'soon' });
  });

  it('sends a mistyped path to the front door rather than an error', () => {
    expect(routeFor('/topgrafie')).toEqual({ name: 'home' });
    expect(routeFor('/wat-dan-ook')).toEqual({ name: 'home' });
  });

  it('ignores the slashes people actually type', () => {
    expect(routeFor('/topografie/')).toMatchObject({ name: 'module' });
    expect(routeFor('topografie')).toMatchObject({ name: 'module' });
  });

  it('round-trips every route through its own path', () => {
    expect(routeFor(pathFor({ name: 'home' }))).toEqual({ name: 'home' });
    expect(routeFor(pathFor({ name: 'oefenen' }))).toEqual({ name: 'oefenen' });
    expect(routeFor(pathFor({ name: 'verzameling' }))).toEqual({ name: 'verzameling' });
    expect(routeFor(pathFor({ name: 'you' }))).toEqual({ name: 'you' });

    for (const module of MODULES) {
      const route = module.built
        ? ({ name: 'module', module, setId: null } as const)
        : ({ name: 'soon', module } as const);
      expect(routeFor(pathFor(route)), module.id).toMatchObject({ name: route.name });
    }
  });

  it('puts tafels under rekenen and klokkijken beside it', () => {
    // The distinction the owner drew: telling the time is not arithmetic, it is
    // reading an instrument. Business plan v6 already split them into two
    // modules with two accents, and the category is the word a parent types
    // without collapsing that back into one thing.
    //
    // What the word leads to is the tables themselves. A category holding one
    // built module *is* that module: a page with a single card on it saying
    // "Rekenen" is a redirect wearing a hat, and it charged a child a click.
    const rekenen = routeFor('/rekenen');
    expect(rekenen).toMatchObject({ name: 'module' });
    if (rekenen.name !== 'module') throw new Error('expected a module');
    expect(rekenen.module.id).toBe('tafels');

    // The module's own slug still works: it has been written down.
    expect(routeFor('/tafels')).toMatchObject({ name: 'module' });

    // And the clock keeps its own address, beside rekenen rather than under it.
    // Telling the time is not arithmetic, so it is not a set of /rekenen and
    // never was, and now that it is built that address opens the clock itself.
    const klok = routeFor('/klokkijken');
    expect(klok).toMatchObject({ name: 'module' });
    if (klok.name !== 'module') throw new Error('expected a module');
    expect(klok.module.id).toBe('klok');
  });

  it('lets the clock answer to the word a child says as well', () => {
    // The rail says "Klok" and nobody types "klokkijken" twice. Same shape as
    // /rekenen beside /tafels one level up: a word people use and a word the
    // product uses, both landing in the same place.
    const kort = routeFor('/klok');
    expect(kort).toMatchObject({ name: 'module' });
    if (kort.name !== 'module') throw new Error('expected a module');
    expect(kort.module.id).toBe('klok');

    // A set under the short word too, because that is what somebody writes on
    // a note. What `pathFor` writes back is still the module's own slug.
    expect(routeFor('/klok/halve-uren')).toMatchObject({ name: 'module', setId: 'klok-half' });
    expect(pathFor(routeFor('/klok/halve-uren'))).toMatch(/\/klokkijken\/halve-uren$/);
  });

  it('gives every step of the clock an address, and the mix the same word', () => {
    // "Mix" in all three modules rather than "klok-mix", "nl-mix" and
    // "rekenmix": those are ids, and an id is not what a parent writes down.
    for (const [pad, setId] of [
      ['/klokkijken/hele-uren', 'klok-heel'],
      ['/klokkijken/halve-uren', 'klok-half'],
      ['/klokkijken/kwartieren', 'klok-kwart'],
      ['/klokkijken/vijf-minuten', 'klok-vijf'],
      ['/klokkijken/mix', 'klok-mix'],
    ] as const) {
      expect(routeFor(pad), pad).toMatchObject({ name: 'module', setId });
      expect(pathFor(routeFor(pad)), pad).toMatch(new RegExp(`${pad}$`));
    }

    // And a step nobody offers opens the clock rather than an empty round.
    expect(routeFor('/klokkijken/seconden')).toMatchObject({ name: 'module', setId: null });
  });

  it('gives a set an address of its own, and the word a parent types', () => {
    // leer.nu/topografie/provincies is a place a child can be sent, which a
    // chooser is not. The map sets drop the source prefix from their ids —
    // nobody types the country twice — and the tables already name themselves.
    const provincies = routeFor('/topografie/provincies');
    expect(provincies).toMatchObject({ name: 'module', setId: 'nl-provincies' });

    const tafel = routeFor('/rekenen/tafel-7');
    expect(tafel).toMatchObject({ name: 'module', setId: 'tafel-7' });

    expect(pathFor(provincies)).toMatch(/\/topografie\/provincies$/);
    expect(pathFor(tafel)).toMatch(/\/rekenen\/tafel-7$/);
  });

  it('gives the new sums of rekenen an address each, and the mixes a word', () => {
    // Four kinds of sum and three mixes, all reachable by typing. The mix is
    // "mix" in both modules rather than "rekenmix" and "nl-mix": those are ids,
    // and an id is not what a parent writes on a note.
    for (const [pad, setId] of [
      ['/rekenen/deel-7', 'deel-7'],
      ['/rekenen/plus-20', 'plus-20'],
      ['/rekenen/min-1000', 'min-1000'],
      ['/rekenen/keer-100', 'keer-100'],
      ['/rekenen/alle-tafels', 'tafels-alle'],
      ['/rekenen/alle-deelsommen', 'deel-alle'],
      ['/rekenen/mix', 'rekenmix'],
      ['/rekenen/mix-makkelijk', 'rekenmix-1'],
      ['/rekenen/mix-gemiddeld', 'rekenmix-2'],
      ['/rekenen/mix-pittig', 'rekenmix-3'],
      ['/rekenen/fouten', 'fouten'],
      ['/topografie/mix', 'nl-mix'],
    ] as const) {
      expect(routeFor(pad), pad).toMatchObject({ name: 'module', setId });
      const route = routeFor(pad);
      expect(pathFor(route), pad).toMatch(new RegExp(`${pad}$`));
    }
  });

  it('opens the module when the set is one nobody has heard of', () => {
    // The child asked for topography by typing it. Answering with the front
    // door because the second word was wrong is the behaviour ADR-044 rejected
    // for modules, and it is no better one level down.
    expect(routeFor('/topografie/verzonnen')).toMatchObject({ name: 'module', setId: null });
    expect(routeFor('/rekenen/tafel-13')).toMatchObject({ name: 'module', setId: null });
    // And a range nobody offers. "Tot 50" is a plausible thing to type and
    // there is no such set, so it opens rekenen rather than an empty round.
    expect(routeFor('/rekenen/plus-50')).toMatchObject({ name: 'module', setId: null });
  });

  it('gives each of the four destinations an address, and nothing else a new one', () => {
    // Vandaag, Oefenen, Verzameling, Jij — the rail of the house style.
    expect(routeFor('/')).toEqual({ name: 'home' });
    expect(routeFor('/oefenen')).toEqual({ name: 'oefenen' });
    expect(routeFor('/verzameling')).toEqual({ name: 'verzameling' });
    expect(routeFor('/jij')).toEqual({ name: 'you' });
    expect(pathFor({ name: 'verzameling' })).toMatch(/\/verzameling$/);
  });

  it('still answers to the words the collection used to be called', () => {
    // "Jouw ontdekkingsreis" became "Jouw voortgang" became the Verzameling. An
    // address somebody wrote down keeps working; nothing links to it any more.
    expect(routeFor('/voortgang')).toEqual({ name: 'verzameling' });
    expect(routeFor('/ontdekkingsreis')).toEqual({ name: 'verzameling' });
  });

  it('opens Vandaag at the word of the page that is gone', () => {
    // "Onthouden" was a destination of its own (K9). The house style has no
    // such page — the dot on every card says what it said.
    expect(routeFor('/onthouden')).toEqual({ name: 'home' });
  });
});
