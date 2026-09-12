import { describe, expect, it } from 'vitest';
import {
  formsFor,
  MAX_FORMS,
  offeredForms,
  questionChoices,
  questionCount,
  type PracticeForm,
} from '@/features/module/forms';
import { asVlagMode } from '@/features/module/onderdelen';
import { VLAG_ROUND_RULE } from './useVlagRound';

/**
 * The vlaggendiploma as a way of practising (ADR-104): where it is offered,
 * and that it is its own length.
 */

const tegels = (setId: string) =>
  offeredForms(formsFor('vlaggen'), false, setId)
    .filter((form) => !form.alleenToets)
    .map((form) => form.id);

const diploma = formsFor('vlaggen').find((form) => form.id === 'vlag-diploma') as PracticeForm;

describe('the vlaggendiploma', () => {
  it('is offered on the whole of a werelddeel and nowhere else', () => {
    expect(tegels('vlag-europa-alle')).toContain('vlag-diploma');
    expect(tegels('vlag-zuid-amerika-alle')).toContain('vlag-diploma');

    for (const setId of [
      'vlag-europa-bekend',
      'vlag-europa-lijkt',
      'vlag-europa-fouten',
      'vlag-wereld-alle',
      'vlag-wereld-mix',
      'vlag-nederland-provincies',
    ]) {
      expect(tegels(setId), setId).not.toContain('vlag-diploma');
    }
  });

  it('is the last of the tiles, and the page still holds six ways at most', () => {
    expect(tegels('vlag-europa-alle')).toEqual([
      'vlag-zoeken',
      'vlag-meerkeuze',
      'ontdekken',
      'overleven',
      'vlag-diploma',
    ]);
    expect(offeredForms(formsFor('vlaggen'), true, 'vlag-europa-alle').length).toBeLessThanOrEqual(
      MAX_FORMS,
    );
  });

  it('asks twenty, or every flag of a smaller werelddeel, and offers no other length', () => {
    expect(VLAG_ROUND_RULE['vlag-diploma']).toEqual({ kind: 'fixed', aantal: 20 });
    expect(questionChoices(diploma, 46)).toEqual([]);
    expect(questionCount(diploma, 46)).toBe(20);
    expect(questionCount(diploma, 46, 10)).toBe(20);
    expect(questionCount(diploma, 12)).toBe(12);
  });

  it('can be started again from the history', () => {
    expect(asVlagMode('vlag-diploma')).toBe('vlag-diploma');
  });
});
