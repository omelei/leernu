import { describe, expect, it } from 'vitest';
import {
  KLOK_FORMS,
  MAX_FORMS,
  SUM_FORMS,
  TOPO_FORMS,
  formsFor,
  minutesFor,
  offeredForms,
  questionChoices,
  questionCount,
  startLabel,
  teDrukOmAanTeWijzen,
  toetsVormVan,
} from './forms';

describe('the oefentoets', () => {
  it('answers by typing, whatever the module', () => {
    // A test asks for the name, the sum or the time unaided (ADR-100).
    const vorm = (moduleId: string, forms: typeof TOPO_FORMS, setId: string) =>
      toetsVormVan(moduleId, offeredForms(forms, false, setId))?.id;

    expect(vorm('topo', TOPO_FORMS, 'nl-provincies')).toBe('hoe-heet-dit');
    expect(vorm('tafels', SUM_FORMS, 'tafel-7')).toBe('som-typen');
    expect(vorm('klok', KLOK_FORMS, 'klok-heel')).toBe('klok-typen');
  });
});

/**
 * The order of the ways of practising is the argument K2 is making, so it is
 * worth a test rather than a comment. Somebody rearranging this list is
 * changing what the screen says about how to learn, and should have to mean it.
 *
 * This replaces `round/modes.test.ts`, which asserted the opposite of the last
 * case below: that the clock and the lives were kept out of the list entirely.
 * They are in it now, at the end, and the reason is in `forms.ts` — a chip
 * started a round on the spot, so the two heaviest rounds in the product were
 * the only two a child never read a description of first.
 */
describe('the ways of practising', () => {
  it('runs from lightest to heaviest, with the pressure at the end', () => {
    expect(TOPO_FORMS.map((form) => form.id)).toEqual([
      'wijs-aan',
      'meerkeuze',
      'hoe-heet-dit',
      'ontdekken',
      'bliksemronde',
      'overleven',
    ]);

    // The tables are the other way round at the top — typing before choosing,
    // ADR-049 — and have no exploring, because a sum is not somewhere to walk.
    // The diploma is last: it is not a way of practising but the test at the
    // end of it, and it is the only thing in this product that can be failed.
    expect(SUM_FORMS.map((form) => form.id)).toEqual([
      'som-typen',
      'som-meerkeuze',
      'bliksemronde',
      'overleven',
      'tafeldiploma',
    ]);

    // And the clock is the map's order at the top rather than the tables':
    // the four times offered are the four mistakes children actually make
    // reading a face, so choosing between them is the exercise rather than a
    // way round it. "Welke klok" is second because it is the direction a child
    // who has learned to recognise twelve pictures has never been asked in.
    // No exploring — twelve faces is not somewhere to wander — and no diploma,
    // because no school hands one out for the clock.
    expect(KLOK_FORMS.map((form) => form.id)).toEqual([
      'klok-meerkeuze',
      'klok-welke-klok',
      'klok-typen',
      'bliksemronde',
      'overleven',
    ]);
  });

  it('gives every way a reason and a face', () => {
    for (const form of [...TOPO_FORMS, ...SUM_FORMS, ...KLOK_FORMS]) {
      expect(form.reason, form.id).toMatch(/^way\./);
      expect(typeof form.icon, form.id).toBe('function');
    }
  });

  it('gives no two ways in one module the same icon', () => {
    // Six cards a child recognises rather than six cards a child reads is the
    // whole argument for an icon here, and it collapses the moment two of them
    // are the same drawing.
    for (const forms of [TOPO_FORMS, SUM_FORMS, KLOK_FORMS]) {
      const icons = forms.map((form) => form.icon);
      expect(new Set(icons).size).toBe(icons.length);
    }
  });

  it('never offers more than six, whatever a module holds', () => {
    // A drawing rule, not a limit on the product: past six the grid stops being
    // one glance. A module with a seventh way has a question to answer here.
    expect(offeredForms(TOPO_FORMS, true, 'nl-provincies').length).toBeLessThanOrEqual(MAX_FORMS);
    expect(offeredForms(KLOK_FORMS, true, 'klok-half').length).toBeLessThanOrEqual(MAX_FORMS);
    expect(formsFor('topo')).toBe(TOPO_FORMS);
    expect(formsFor('tafels')).toBe(SUM_FORMS);
    expect(formsFor('klok')).toBe(KLOK_FORMS);
  });

  it('offers the clock module every one of its ways, on every step', () => {
    // Nothing here is set-dependent: there is no mix a way stops making sense
    // on, the way exploring does on the map, and no set a diploma belongs to.
    for (const setId of ['klok-heel', 'klok-half', 'klok-kwart', 'klok-vijf', 'klok-mix']) {
      expect(offeredForms(KLOK_FORMS, true, setId).length, setId).toBe(KLOK_FORMS.length);
    }
  });

  it('does not offer the clock while the clock is switched off', () => {
    // K10's switch is off by default, and a switch that only hid the clock
    // while still counting would be a worse lie than no switch.
    const off = offeredForms(TOPO_FORMS, false, 'nl-provincies').map((form) => form.id);
    expect(off).not.toContain('bliksemronde');
    // Nor the lives: overleven is a game form, not the learning core.
    expect(off).not.toContain('overleven');
    expect(off).toContain('ontdekken');

    expect(offeredForms(TOPO_FORMS, true, 'nl-provincies').map((form) => form.id)).toContain(
      'bliksemronde',
    );
  });

  it('offers a diploma on a table and on nothing else', () => {
    // There is no such thing as a diploma for "alle tafels door elkaar", and
    // offering one would mean inventing a certificate no school hands out.
    const opTafel = offeredForms(SUM_FORMS, false, 'tafel-7').map((form) => form.id);
    expect(opTafel).toContain('tafeldiploma');

    for (const setId of ['tafels-alle', 'rekenmix', 'plus-100', 'deel-7']) {
      expect(
        offeredForms(SUM_FORMS, false, setId).map((form) => form.id),
        setId,
      ).not.toContain('tafeldiploma');
    }
  });

  it('has no way of exploring a mix, which is where nobody meets a set for the first time', () => {
    // Exploring is one set's own map layer, and it is where a child meets a
    // set for the first time. A mix of everything is not where anyone meets
    // anything for the first time.
    expect(offeredForms(TOPO_FORMS, false, 'nl-provincies').map((form) => form.id)).toContain(
      'ontdekken',
    );
    expect(offeredForms(TOPO_FORMS, false, 'nl-mix').map((form) => form.id)).not.toContain(
      'ontdekken',
    );
  });
});

/** One way of practising by name, so a test never indexes into the order it is checking. */
function vorm(id: string) {
  const found = [...TOPO_FORMS, ...SUM_FORMS].find((candidate) => candidate.id === id);
  if (!found) throw new Error(`geen oefenvorm ${id}`);
  return found;
}

describe('what the start button says', () => {
  const point = vorm('wijs-aan');
  const explore = vorm('ontdekken');
  const lightning = vorm('bliksemronde');
  const survive = vorm('overleven');

  it('carries the measure of the round rather than a number in the copy', () => {
    expect(startLabel(point, 'Provincies', 12)).toContain('12 vragen');
    expect(startLabel(lightning, 'Provincies', 12)).toContain('60 seconden');
    expect(startLabel(survive, 'Provincies', 12)).toContain('3 levens');
    // Exploring asks nothing, so it counts nothing.
    expect(startLabel(explore, 'Provincies', 12)).toBe('Provincies ontdekken');
  });

  it('never promises more questions than the set has', () => {
    // Twelve provinces is a whole round; eighty cities is sampled to fifteen.
    expect(questionCount(point, 12)).toBe(12);
    expect(questionCount(point, 80)).toBe(15);
    expect(questionCount(explore, 12)).toBeNull();
    expect(questionCount(survive, 12)).toBeNull();
  });
});

describe('roughly how long it takes', () => {
  const point = vorm('wijs-aan');
  const explore = vorm('ontdekken');
  const lightning = vorm('bliksemronde');
  const survive = vorm('overleven');

  it('says a whole number of minutes, and never nought', () => {
    expect(minutesFor(point, 12)).toBe(2);
    expect(minutesFor(point, 1)).toBe(1);
    expect(minutesFor(lightning, null)).toBe(1);
  });

  it('says nothing where saying would be guessing', () => {
    // Three lives is exactly as long as the child is good, and exploring has
    // no end at all. A figure there would be a number we made up.
    expect(minutesFor(survive, null)).toBeNull();
    expect(minutesFor(explore, null)).toBeNull();
  });
});

/**
 * How long a round may be made. Ten is what a round has always been and stays
 * the default; the rest exists because the sets stopped being ten (ADR-074).
 */
describe('how many questions', () => {
  const point = vorm('wijs-aan');
  const lightning = vorm('bliksemronde');
  const diploma = vorm('tafeldiploma');

  it('offers only the lengths the set can actually fill', () => {
    // A table of ten has one honest answer, so there is nothing to choose.
    expect(questionChoices(point, 10)).toEqual([]);
    expect(questionChoices(point, 45)).toEqual([10, 15, 25, 45]);
    expect(questionChoices(point, 605)).toEqual([10, 15, 25, 50, 100]);
    // Rekenen's own length is ten, which is already one of the four.
    expect(questionChoices(vorm('som-typen'), 605)).toEqual([10, 25, 50, 100]);
  });

  it('offers a small map whole, so topography has a choice at all', () => {
    // Twelve provinces used to fit only "10", and one chip is no row. The whole
    // set is the round's own length here, since fifteen does not fit in twelve.
    expect(questionChoices(point, 12)).toEqual([10, 12]);
    expect(questionCount(point, 12, null)).toBe(12);
    expect(questionCount(point, 12, 10)).toBe(10);
    // Eighty cities: the round's own fifteen is a chip, and so is all eighty.
    expect(questionChoices(point, 80)).toEqual([10, 15, 25, 50, 80]);
    // The world is not offered whole: a hundred and sixty-seven is an afternoon.
    expect(questionChoices(point, 167)).toEqual([10, 15, 25, 50, 100]);
  });

  it('offers nothing where a round has no number of questions', () => {
    // A minute is a minute and a diploma is the whole table.
    expect(questionChoices(lightning, 510)).toEqual([]);
    expect(questionChoices(diploma, 10)).toEqual([]);
  });

  it('asks for what was chosen, capped at the set', () => {
    expect(questionCount(point, 510, 100)).toBe(100);
    expect(questionCount(point, 510, null)).toBe(15);
    // A length that does not fit falls back rather than promising it.
    expect(questionCount(point, 12, 100)).toBe(12);
  });

  it('puts the chosen length on the start button', () => {
    expect(startLabel(point, 'Rekenmix', 510, 50)).toContain('50 vragen');
    expect(startLabel(point, 'Rekenmix', 510, null)).toContain('15 vragen');
  });
});

/**
 * Which way of practising leads, on a map too crowded to point at.
 *
 * The numbers behind the two thresholds are in `forms.ts`; this is the rule
 * they add up to, and the three cases that would each be a bug on their own.
 */
describe('a map too crowded to point at', () => {
  it('leaves the small maps alone, on any screen', () => {
    // Twelve provinces and twelve countries of South America: pointing is the
    // way in, and stays the way in on a phone.
    for (const klein of [false, true]) {
      expect(teDrukOmAanTeWijzen('nl-provincies', 12, klein)).toBe(false);
      expect(teDrukOmAanTeWijzen('zuid-amerika-landen', 12, klein)).toBe(false);
    }
  });

  it('demotes pointing on a werelddeel, but only on a phone', () => {
    expect(teDrukOmAanTeWijzen('europa-landen', 46, false)).toBe(false);
    expect(teDrukOmAanTeWijzen('europa-landen', 46, true)).toBe(true);
  });

  it('demotes pointing on the world map everywhere', () => {
    // Ninety of its hundred and sixty-seven countries are unreachable on a
    // laptop, so a screen wide enough does not make it a pointing exercise.
    expect(teDrukOmAanTeWijzen('wereld-landen', 167, false)).toBe(true);
  });

  it('leaves the cities alone: a marker is already a target', () => {
    // Eighty cities, and every one of them is drawn as a dot sized for a
    // finger. The rule is about hitting a coastline, not about how many
    // answers there are.
    expect(teDrukOmAanTeWijzen('nl-steden', 80, true)).toBe(false);
  });

  it('moves pointing to the end of the row rather than off it', () => {
    const krap = offeredForms(TOPO_FORMS, false, 'wereld-landen', true);
    const ids = krap.map((form) => form.id);

    expect(ids).toContain('wijs-aan');
    expect(ids[ids.length - 1]).toBe('wijs-aan');
    // And what leads is the one that needs no pointing at all: the map lights a
    // country up and the child chooses between four names.
    expect(ids[0]).toBe('meerkeuze');
    // Same forms, same number of them.
    expect([...ids].sort()).toEqual(
      offeredForms(TOPO_FORMS, false, 'wereld-landen', false)
        .map((form) => form.id)
        .sort(),
    );
  });
});
