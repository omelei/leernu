import { afleiderFase, vlagAfleiders, vlagOpties, type VlagItem, type Werelddeel } from './vlaggen';

function vlag(iso: string, werelddelen: Werelddeel[], groepen: string[] = []): VlagItem {
  return {
    id: `vlag-${iso.toLowerCase()}`,
    iso,
    naam: iso,
    aliassen: [],
    werelddelen,
    klasse: 'normaal',
    groepen,
    hoofdstad: '',
    beschrijving: '',
    weetje: '',
    beeld: '',
    verhouding: 1.5,
    licentie: 'publiek-domein',
    topo: [],
  };
}

const NL = vlag('NL', ['europa'], ['rwb']);
const LU = vlag('LU', ['europa'], ['rwb']);
const PY = vlag('PY', ['zuid-amerika'], ['rwb']);
const BE = vlag('BE', ['europa']);
const DE = vlag('DE', ['europa']);
const FR = vlag('FR', ['europa']);
const IT = vlag('IT', ['europa']);
const JP = vlag('JP', ['azie']);
const KE = vlag('KE', ['afrika']);
const BR = vlag('BR', ['zuid-amerika']);
const CA = vlag('CA', ['noord-amerika']);
const CY = vlag('CY', ['europa', 'azie']);
const DR = vlag('NL-DR', ['nederland']);
const GR = vlag('NL-GR', ['nederland']);
const FL = vlag('NL-FL', ['nederland']);
const ZE = vlag('NL-ZE', ['nederland']);

const ALLE = [NL, LU, PY, BE, DE, FR, IT, JP, KE, BR, CA, CY, DR, GR, FL, ZE];

/** A fixed sequence, so a failure is the same failure every run. */
function rngVan(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('afleiderFase', () => {
  it('is far away for questions one to three, the werelddeel for four to seven, look-alikes after', () => {
    expect([0, 1, 2].map(afleiderFase)).toEqual(['ver', 'ver', 'ver']);
    expect([3, 4, 5, 6].map(afleiderFase)).toEqual([
      'werelddeel',
      'werelddeel',
      'werelddeel',
      'werelddeel',
    ]);
    expect([7, 8, 20].map(afleiderFase)).toEqual(['groep', 'groep', 'groep']);
  });
});

describe('vlagAfleiders', () => {
  const fases = ['ver', 'werelddeel', 'groep'] as const;

  it('never offers the answer, never the same flag twice, and as many as asked', () => {
    for (const fase of fases) {
      for (let seed = 1; seed < 40; seed++) {
        const uit = vlagAfleiders({ antwoord: NL, pool: ALLE, fase, aantal: 5, rng: rngVan(seed) });
        expect(uit).toHaveLength(5);
        expect(uit.map((v) => v.id)).not.toContain(NL.id);
        expect(new Set(uit.map((v) => v.id)).size).toBe(5);
      }
    }
  });

  it('ignores a pool that holds the same flag twice', () => {
    const uit = vlagAfleiders({ antwoord: NL, pool: [BE, BE, BE, NL, DE], fase: 'ver', aantal: 3 });
    expect(uit.map((v) => v.iso).sort()).toEqual(['BE', 'DE']);
  });

  it('keeps provinces with provinces and countries with countries', () => {
    for (const fase of fases) {
      const provincie = vlagAfleiders({ antwoord: DR, pool: ALLE, fase, aantal: 3 });
      expect(provincie.every((v) => v.werelddelen.includes('nederland'))).toBe(true);

      const land = vlagAfleiders({ antwoord: NL, pool: ALLE, fase, aantal: 5 });
      expect(land.some((v) => v.werelddelen.includes('nederland'))).toBe(false);
    }
  });

  it('starts far away: other werelddelen, and nothing that looks alike', () => {
    for (let seed = 1; seed < 40; seed++) {
      const uit = vlagAfleiders({
        antwoord: NL,
        pool: ALLE,
        fase: 'ver',
        aantal: 3,
        rng: rngVan(seed),
      });
      expect(uit.every((v) => !v.werelddelen.includes('europa'))).toBe(true);
      expect(uit.map((v) => v.iso)).not.toContain('PY');
    }
  });

  it('then asks within the werelddeel', () => {
    for (let seed = 1; seed < 40; seed++) {
      const uit = vlagAfleiders({
        antwoord: NL,
        pool: ALLE,
        fase: 'werelddeel',
        aantal: 3,
        rng: rngVan(seed),
      });
      expect(uit.every((v) => v.werelddelen.includes('europa'))).toBe(true);
    }
  });

  it('and ends with the look-alikes first, wherever they are', () => {
    for (let seed = 1; seed < 40; seed++) {
      const uit = vlagAfleiders({
        antwoord: NL,
        pool: ALLE,
        fase: 'groep',
        aantal: 3,
        rng: rngVan(seed),
      });
      expect(
        uit
          .slice(0, 2)
          .map((v) => v.iso)
          .sort(),
      ).toEqual(['LU', 'PY']);
      // The third is from the same werelddeel, since the group has run out.
      expect(uit[2]?.werelddelen).toContain('europa');
    }
  });

  it('counts a flag in two werelddelen as belonging to both', () => {
    const uit = vlagAfleiders({ antwoord: JP, pool: ALLE, fase: 'werelddeel', aantal: 1 });
    expect(uit.map((v) => v.iso)).toEqual(['CY']);
  });

  it('fills from the rest of the pool when a phase runs out, and stops when the pool does', () => {
    const vol = vlagAfleiders({ antwoord: CA, pool: ALLE, fase: 'werelddeel', aantal: 3 });
    expect(vol).toHaveLength(3);

    const krap = vlagAfleiders({ antwoord: DR, pool: ALLE, fase: 'groep', aantal: 5 });
    expect(krap.map((v) => v.iso).sort()).toEqual(['NL-FL', 'NL-GR', 'NL-ZE']);
  });
});

describe('vlagOpties', () => {
  it('holds the answer exactly once, among its wrong answers', () => {
    for (let seed = 1; seed < 40; seed++) {
      const opties = vlagOpties({
        antwoord: NL,
        pool: ALLE,
        fase: 'groep',
        aantal: 3,
        rng: rngVan(seed),
      });
      expect(opties).toHaveLength(4);
      expect(opties.filter((v) => v.id === NL.id)).toHaveLength(1);
    }
  });

  it('does not always put the answer in the same place', () => {
    const plekken = new Set(
      Array.from({ length: 40 }, (_, seed) =>
        vlagOpties({
          antwoord: NL,
          pool: ALLE,
          fase: 'ver',
          aantal: 3,
          rng: rngVan(seed + 1),
        }).indexOf(NL),
      ),
    );
    expect(plekken.size).toBeGreaterThan(1);
  });
});
