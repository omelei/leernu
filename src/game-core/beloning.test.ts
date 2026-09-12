import { describe, expect, it } from 'vitest';
import {
  leesKopie,
  maakKopie,
  planMigratie,
  planTerugdraaien,
  type MigratieInvoer,
  type Profielstand,
} from './beloning';
import { uitLadder, type HeldenStand } from './helden';

const PROFIEL: Profielstand = { niveau: 7, xp: 1200, munten: 340, sticker: 'vos' };
const NU = new Date('2026-09-12T10:00:00Z');

/** A device's settings, as far as the move is concerned: two rows. */
interface Apparaat {
  helden: HeldenStand | null;
  kopie: string | null;
}

/** Reads, plans and writes the way heldenStore does. */
function draai(apparaat: Apparaat, correct: number, nu = NU): Apparaat {
  const invoer: MigratieInvoer = {
    helden: apparaat.helden,
    kopie: apparaat.kopie,
    correct,
    profiel: PROFIEL,
    nu,
  };
  const plan = planMigratie(invoer);
  return {
    kopie: plan.kopie ?? apparaat.kopie,
    helden: plan.helden ?? apparaat.helden,
  };
}

function terug(apparaat: Apparaat): Apparaat {
  return planTerugdraaien(apparaat.kopie).verwijderHelden
    ? { ...apparaat, helden: null }
    : apparaat;
}

describe('the move off the old ladder', () => {
  it('keeps a copy of the old rewards before it writes the heroes', () => {
    const plan = planMigratie({ helden: null, kopie: null, correct: 400, profiel: PROFIEL, nu: NU });

    expect(plan.kopie).not.toBeNull();
    expect(leesKopie(plan.kopie)).toEqual({
      versie: 1,
      gemaaktOp: '2026-09-12T10:00:00.000Z',
      correct: 400,
      niveau: 7,
      xp: 1200,
      munten: 340,
      sticker: 'vos',
    });
    expect(plan.helden).toEqual(uitLadder(400));
  });

  it('is idempotent: a second run writes nothing', () => {
    const eerst = draai({ helden: null, kopie: null }, 400);
    const plan = planMigratie({
      helden: eerst.helden,
      kopie: eerst.kopie,
      correct: 400,
      profiel: PROFIEL,
      nu: new Date('2026-09-13T10:00:00Z'),
    });

    expect(plan).toEqual({ kopie: null, helden: null });
    expect(draai(eerst, 400, new Date('2026-09-13T10:00:00Z'))).toEqual(eerst);
  });

  it('never overwrites a copy that is already there', () => {
    const eerst = draai({ helden: null, kopie: null }, 400);
    // The heroes' row lost — a half write, a browser that dropped it — and the
    // move runs again, a day later and with more answers.
    const opnieuw = draai({ helden: null, kopie: eerst.kopie }, 900, new Date('2026-09-13T10:00:00Z'));

    expect(opnieuw.kopie).toBe(eerst.kopie);
    expect(opnieuw.helden).toEqual(uitLadder(900));
  });

  it('is deterministic: the same answers give the same heroes', () => {
    for (const correct of [0, 24, 25, 400, 1375, 10975]) {
      const a = draai({ helden: null, kopie: null }, correct);
      const b = draai({ helden: null, kopie: null }, correct, new Date('2027-01-01T00:00:00Z'));
      expect(a.helden, `${correct}`).toEqual(b.helden);
    }
  });

  it('does not take an unreadable copy for a copy', () => {
    expect(leesKopie('{')).toBeNull();
    expect(leesKopie(JSON.stringify({ versie: 2 }))).toBeNull();
    const plan = planMigratie({ helden: null, kopie: '{', correct: 10, profiel: PROFIEL, nu: NU });
    expect(leesKopie(plan.kopie)).not.toBeNull();
  });

  it('copies a new child too, with nought answers and no hero worn', () => {
    const kopie = maakKopie(0, { niveau: 1, xp: 0, munten: 0, sticker: null }, NU);
    expect(leesKopie(kopie)?.sticker).toBeNull();
  });
});

describe('the way back', () => {
  it('removes the heroes only where this device holds a copy', () => {
    expect(planTerugdraaien(null).verwijderHelden).toBe(false);
    expect(planTerugdraaien('{').verwijderHelden).toBe(false);

    const gedaan = draai({ helden: null, kopie: null }, 400);
    expect(planTerugdraaien(gedaan.kopie).verwijderHelden).toBe(true);
  });

  it('can be undone and redone: the same heroes, and the first copy kept', () => {
    const gedaan = draai({ helden: null, kopie: null }, 400);
    const teruggedraaid = terug(gedaan);

    expect(teruggedraaid.helden).toBeNull();
    expect(teruggedraaid.kopie).toBe(gedaan.kopie);

    const weer = draai(teruggedraaid, 400, new Date('2026-10-01T10:00:00Z'));
    expect(weer.helden).toEqual(gedaan.helden);
    expect(weer.kopie).toBe(gedaan.kopie);
  });
});
