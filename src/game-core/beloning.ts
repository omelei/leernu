import { uitLadder, type HeldenStand } from './helden';

/**
 * The move from the old ladder's rewards to the twelve heroes (house style v2,
 * phase 7), as a plan rather than as a write.
 *
 * The move itself is old: the first read of a child's heroes turns the sixty
 * animals the ladder had given into heroes (`uitLadder`, ADR-096). What this
 * adds is what a move of real children's data owes them:
 *
 * - **A copy first.** Before the heroes are written, what the old system had —
 *   the answers the ladder counted, the level, the XP, the coins, the hero worn
 *   — is kept aside under `beloning-v1-kopie:<kindId>`, once. A later run never
 *   overwrites it.
 * - **Idempotent.** A child who already has heroes gets nothing written at all;
 *   and `uitLadder` is deterministic, so two runs from the same answers give the
 *   same heroes.
 * - **A way back.** The move writes exactly one thing, the heroes' row, so going
 *   back is removing that row — only where this device holds a copy, which is
 *   the proof that the move ran here.
 *
 * Pure, so every one of those three can be tested without a database. The store
 * (`heldenStore.ts`) reads, asks this file, and writes in the order it says.
 */

/** What the old reward data was, kept aside before anything is written. */
export interface BeloningV1Kopie {
  readonly versie: 1;
  readonly gemaaktOp: string;
  /** The answers the ladder counted: the one number it was built from. */
  readonly correct: number;
  readonly niveau: number;
  readonly xp: number;
  readonly munten: number;
  /** The hero the child wore. */
  readonly sticker: string | null;
}

/** The profile fields of the old system, as the copy needs them. */
export interface Profielstand {
  readonly niveau: number;
  readonly xp: number;
  readonly munten: number;
  readonly sticker: string | null;
}

export interface MigratieInvoer {
  /** The heroes' row as read, or null for none (or one that could not be read). */
  readonly helden: HeldenStand | null;
  /** The copy as read, or null for none. */
  readonly kopie: string | null;
  readonly correct: number;
  readonly profiel: Profielstand;
  readonly nu: Date;
}

/** What to write, in this order: the copy, then the heroes. Null is "write nothing". */
export interface MigratiePlan {
  readonly kopie: string | null;
  readonly helden: HeldenStand | null;
}

export const KOPIE_VERSIE = 1;

export function maakKopie(correct: number, profiel: Profielstand, nu: Date): string {
  const rij: BeloningV1Kopie = {
    versie: KOPIE_VERSIE,
    gemaaktOp: nu.toISOString(),
    correct,
    niveau: profiel.niveau,
    xp: profiel.xp,
    munten: profiel.munten,
    sticker: profiel.sticker,
  };
  return JSON.stringify(rij);
}

/** The copy, read as if a stranger had written it: anything unreadable is no copy. */
export function leesKopie(raw: string | null | undefined): BeloningV1Kopie | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const rij = data as Record<string, unknown>;
    const getal = (waarde: unknown) => typeof waarde === 'number' && Number.isFinite(waarde);

    if (rij.versie !== KOPIE_VERSIE || typeof rij.gemaaktOp !== 'string') return null;
    if (!getal(rij.correct) || !getal(rij.niveau) || !getal(rij.xp) || !getal(rij.munten)) {
      return null;
    }
    if (rij.sticker !== null && typeof rij.sticker !== 'string') return null;

    return {
      versie: KOPIE_VERSIE,
      gemaaktOp: rij.gemaaktOp,
      correct: rij.correct as number,
      niveau: rij.niveau as number,
      xp: rij.xp as number,
      munten: rij.munten as number,
      sticker: rij.sticker as string | null,
    };
  } catch {
    return null;
  }
}

/**
 * What the move writes for one child: nothing where the heroes are already
 * there; otherwise the copy (unless a readable one exists) and then the heroes
 * the old ladder had given.
 */
export function planMigratie(invoer: MigratieInvoer): MigratiePlan {
  if (invoer.helden !== null) return { kopie: null, helden: null };

  const heeftKopie = leesKopie(invoer.kopie) !== null;
  return {
    kopie: heeftKopie ? null : maakKopie(invoer.correct, invoer.profiel, invoer.nu),
    helden: uitLadder(invoer.correct),
  };
}

/**
 * The way back: remove the heroes' row, where this device holds a copy. The
 * copy stays — it is the record of what was there — so running the move again
 * afterwards gives the same heroes and keeps the first copy.
 */
export function planTerugdraaien(kopie: string | null): { readonly verwijderHelden: boolean } {
  return { verwijderHelden: leesKopie(kopie) !== null };
}
