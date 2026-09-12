import { describe, expect, it } from 'vitest';
import { isPremiumOnderwerp, isPremiumVorm, metPremium } from './premium';
import { eersteRegio, TOPO_REGIOS } from './regios';

/**
 * What will need an account, marked before there is one (ADR-110), and the
 * map each page opens on.
 */
describe('premium', () => {
  it('marks the bliksemronde and the two diplomas, and no way that teaches', () => {
    expect(isPremiumVorm('bliksemronde')).toBe(true);
    expect(isPremiumVorm('tafeldiploma')).toBe(true);
    expect(isPremiumVorm('vlag-diploma')).toBe(true);
    for (const vorm of ['wijs-aan', 'meerkeuze', 'hoe-heet-dit', 'som-typen', 'overleven']) {
      expect(isPremiumVorm(vorm as Parameters<typeof isPremiumVorm>[0]), vorm).toBe(false);
    }
  });

  it("marks every module's list of mistakes and nothing else", () => {
    for (const id of ['fouten', 'nl-fouten', 'wereld-fouten', 'klok-fouten']) {
      expect(isPremiumOnderwerp(id), id).toBe(true);
    }
    for (const id of ['tafels', 'nl-mix', 'provincies']) {
      expect(isPremiumOnderwerp(id), id).toBe(false);
    }
  });

  it('puts the word at the end of a name, so the name still leads', () => {
    expect(metPremium('Oefentoets', true)).toBe('Oefentoets. Premium');
    expect(metPremium('Meerkeuze', false)).toBe('Meerkeuze');
  });
});

describe('the map a page opens on', () => {
  it('is Nederland on topography and the world on flags', () => {
    expect(eersteRegio('topo', TOPO_REGIOS)).toBe('nederland');
    expect(eersteRegio('vlaggen', TOPO_REGIOS)).toBe('wereld');
    expect(eersteRegio('tafels', [])).toBeNull();
  });
});
