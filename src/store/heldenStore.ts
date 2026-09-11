import {
  AANTAL_HELDEN,
  DUBBELEN_PER_REEKS,
  kistenTeGoed,
  openKist,
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
 * A child's heroes, on the device (ADR-096, ADR-097).
 *
 * One row per child in `settings`, holding the list as JSON — the shape the
 * tests already take (ADR-077). Twelve heroes and a count are not a table, and
 * a new object store would be a schema version for a list that fits in one
 * string.
 *
 * **The first read is the migration.** A child with no row yet gets the heroes
 * the old ladder had given them (`uitLadder`), written straight back. It runs
 * in an ordinary transaction on first read rather than in a version change, for
 * the reason `ensureProgressPerChild` gives: it can be tried again, and it
 * cannot make a child's work unreachable. It is deterministic, so two screens
 * reading at once write the same thing.
 *
 * **There is no random number here any more.** ADR-096 put the draw in this
 * file; ADR-097 takes it out. A chest lays out three heroes and the child turns
 * one over, so what this file does is read the row, apply the choice, and write
 * it back. `crypto.getRandomValues` is gone from the reward path entirely.
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
 * How many chests this child's answers have paid for and nobody has chosen
 * from yet.
 *
 * Almost always none. It is a subtraction rather than an event, so a chest
 * earned at the end of a round that was closed before it was opened is still
 * here the next time anybody looks.
 */
export async function kistenOpenstaand(): Promise<number> {
  const stand = await loadHelden();
  const { correct } = await loadAccuracy();
  return kistenTeGoed(stand, correct);
}

/**
 * Opens one owed chest on the hero the child chose, and says what it did.
 *
 * Null when nothing is owed, which is what a second press on the same card
 * looks like: the first one already spent the chest, and a chest that could be
 * spent twice would be the one thing here that is not paid for in answers.
 */
export async function kiesHeld(plek: number): Promise<KistUitkomst | null> {
  const kindId = await activeChildId();
  const stand = await loadHelden();
  const { correct } = await loadAccuracy();

  if (kistenTeGoed(stand, correct) <= 0) return null;

  const { stand: nieuw, uitkomst } = openKist(stand, plek);
  await setSetting(sleutel(kindId), JSON.stringify(nieuw));
  return uitkomst;
}
