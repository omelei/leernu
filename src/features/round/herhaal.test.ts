import { describe, expect, it } from 'vitest';
import { herhaalKaartVorm, herhaalKlokVorm, herhaalSomVorm, herhaalVlagVorm } from './herhaal';

/** "Herhaal je fouten" asks in a way that has a length, as practice (ADR-110). */
describe('the way a repeat of the mistakes is asked', () => {
  it('keeps a way that has a length', () => {
    expect(herhaalKaartVorm('hoe-heet-dit')).toBe('hoe-heet-dit');
    expect(herhaalSomVorm('som-meerkeuze')).toBe('som-meerkeuze');
    expect(herhaalKlokVorm('klok-welke-klok')).toBe('klok-welke-klok');
    expect(herhaalVlagVorm('vlag-zoeken')).toBe('vlag-zoeken');
  });

  it('turns a minute, three lives or a diploma into practice', () => {
    expect(herhaalKaartVorm('bliksemronde')).toBe('meerkeuze');
    expect(herhaalKaartVorm('overleven')).toBe('meerkeuze');
    expect(herhaalSomVorm('tafeldiploma')).toBe('som-typen');
    expect(herhaalSomVorm('bliksemronde')).toBe('som-typen');
    expect(herhaalKlokVorm('overleven')).toBe('klok-meerkeuze');
    expect(herhaalVlagVorm('vlag-diploma')).toBe('vlag-meerkeuze');
    expect(herhaalVlagVorm('overleven')).toBe('vlag-meerkeuze');
  });
});
