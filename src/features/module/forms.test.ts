import { describe, expect, it } from 'vitest';
import {
  MAX_FORMS,
  SUM_FORMS,
  TOPO_FORMS,
  formsFor,
  minutesFor,
  offeredForms,
  questionCount,
  startLabel,
} from './forms';

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
  });

  it('gives every way a reason and a face', () => {
    for (const form of [...TOPO_FORMS, ...SUM_FORMS]) {
      expect(form.reason, form.id).toMatch(/^way\./);
      expect(typeof form.icon, form.id).toBe('function');
    }
  });

  it('gives no two ways in one module the same icon', () => {
    // Six cards a child recognises rather than six cards a child reads is the
    // whole argument for an icon here, and it collapses the moment two of them
    // are the same drawing.
    for (const forms of [TOPO_FORMS, SUM_FORMS]) {
      const icons = forms.map((form) => form.icon);
      expect(new Set(icons).size).toBe(icons.length);
    }
  });

  it('never offers more than six, whatever a module holds', () => {
    // A drawing rule, not a limit on the product: past six the grid stops being
    // one glance. A module with a seventh way has a question to answer here.
    expect(offeredForms(TOPO_FORMS, true, 'nl-provincies').length).toBeLessThanOrEqual(MAX_FORMS);
    expect(formsFor('topo')).toBe(TOPO_FORMS);
    expect(formsFor('tafels')).toBe(SUM_FORMS);
  });

  it('does not offer the clock while the clock is switched off', () => {
    // K10's switch is off by default, and a switch that only hid the clock
    // while still counting would be a worse lie than no switch.
    const off = offeredForms(TOPO_FORMS, false, 'nl-provincies').map((form) => form.id);
    expect(off).not.toContain('bliksemronde');
    expect(off).toContain('overleven');

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
