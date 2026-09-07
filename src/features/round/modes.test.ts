import { describe, expect, it } from 'vitest';
import { BUILT_WAYS, WAYS } from './modes';
import { CHALLENGE_MODES } from '@/features/practice/useRound';

/**
 * The order of the four ways is the argument K2 is making, so it is worth a
 * test rather than a comment. Somebody rearranging this list is changing what
 * the screen says about how to learn, and should have to mean it.
 */
describe('the ways of practising', () => {
  it('runs from lightest to heaviest, with multiple choice between', () => {
    // Pointing asks where; multiple choice narrows the field to four and is the
    // step up to typing rather than a way around it; typing asks for the name
    // unaided, which is what a test asks. Exploring asks nothing.
    expect(WAYS.map((way) => way.id)).toEqual([
      'wijs-aan',
      'meerkeuze',
      'hoe-heet-dit',
      'ontdekken',
    ]);
  });

  it('gives every way a reason, because the order is only legible with one', () => {
    for (const way of WAYS) {
      expect(way.reason, way.id).toMatch(/^way\./);
    }
  });

  it('offers only what exists', () => {
    // ADR-037. Multiple choice arrived with step 7b and its place in the order
    // did not have to move, which is what naming it early was for. All four
    // exist now, so the flag lets everything through — and it is still here,
    // because the next way drawn before it is built will need it.
    expect(BUILT_WAYS.map((way) => way.id)).toEqual(WAYS.map((way) => way.id));
  });

  it('keeps the challenge modes out of the list entirely', () => {
    // A clock and three lives are things you add to something already known.
    // Standing them beside the four would say they were a fifth way to learn.
    const ways = new Set(WAYS.map((way) => way.id));
    for (const mode of CHALLENGE_MODES) {
      expect(ways.has(mode), `${mode} is not a way of learning`).toBe(false);
    }
  });
});
