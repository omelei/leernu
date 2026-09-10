import {
  AANTAL_HELDEN,
  DUBBELEN_PER_REEKS,
  openVerdiend,
  REEKSEN,
  uitLadder,
  type Held,
  type HeldenStand,
  type KistUitkomst,
} from '@/game-core';
import { activeChildId } from './children';
import { loadAccuracy } from './progress';
import { getSetting, setSetting } from './settings';

/**
 * A child's heroes, on the device (ADR-096).
 *
 * One row per child in `settings`, holding the list as JSON — the shape the
 * tests already take (ADR-077). Twelve heroes and a count are not a table, and
 * a new object store would be a schema version for a list that fits in one
 * string.
 *
 * **The first read is the migration.** A child with no row yet gets the heroes
 * the old ladder had given them (`uitLadder`), written straight back. It runs
 * in an ordinary transaction on first read rather than in a version change, for
 * the reason `ensureProgressPerChild` gives: it can be tried again, and it cannot
 * make a child's work unreachable. It is deterministic, so two screens reading
 * at once write the same thing.
 *
 * **This is where the chance is.** `game-core` takes a draw between 0 and 1;
 * this file makes it, from the platform's cryptographic source, so no hero is
 * more likely than another and nothing about the draw can be steered.
 */

const sleutel = (kindId: string) => `helden:${kindId}`;

/**
 * What is in the row, made safe — parsed as if a stranger had written it: a
 * version from later, half a write, a browser that lost the tail. Anything
 * unreadable is treated as no row, which re-runs the migration rather than
 * taking the front door down with it.
 */
function parse(raw: string | undefined): HeldenStand | null {
  if (!raw) return null;

  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const rij = data as Record<string, unknown>;

    if (typeof rij.kistenOpen !== 'number' || rij.kistenOpen < 0) return null;
    if (!Array.isArray(rij.helden)) return null;

    const helden = rij.helden.flatMap((entry): Held[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const held = entry as Record<string, unknown>;
      const plek = held.plek;
      const reeks = REEKSEN.find((kandidaat) => kandidaat === held.reeks);
      const dubbelen = held.dubbelen;

      if (typeof plek !== 'number' || !Number.isInteger(plek)) return [];
      if (plek < 0 || plek >= AANTAL_HELDEN || reeks === undefined) return [];
      if (typeof dubbelen !== 'number' || dubbelen < 0 || dubbelen >= DUBBELEN_PER_REEKS) {
        return [];
      }
      return [{ plek, reeks, dubbelen }];
    });

    return { helden, kistenOpen: Math.floor(rij.kistenOpen) };
  } catch {
    return null;
  }
}

export async function loadHelden(): Promise<HeldenStand> {
  const kindId = await activeChildId();
  const bewaard = parse(await getSetting(sleutel(kindId)));
  if (bewaard) return bewaard;

  const stand = uitLadder((await loadAccuracy()).correct);
  await setSetting(sleutel(kindId), JSON.stringify(stand));
  return stand;
}

/**
 * Opens every chest this child's answers have paid for, and says what came out.
 *
 * Called once at the end of a round, after the round's answers are written, so
 * the count it reads includes them. Almost always it opens nothing.
 */
export async function openKisten(): Promise<readonly KistUitkomst[]> {
  const kindId = await activeChildId();
  const stand = await loadHelden();
  const { correct } = await loadAccuracy();

  const { stand: nieuw, uitkomsten } = openVerdiend(stand, correct, trek);
  if (uitkomsten.length > 0) await setSetting(sleutel(kindId), JSON.stringify(nieuw));
  return uitkomsten;
}

/** A number in [0, 1), from the platform's cryptographic source. */
function trek(): number {
  const waarde = new Uint32Array(1);
  crypto.getRandomValues(waarde);
  return (waarde[0] ?? 0) / 2 ** 32;
}
