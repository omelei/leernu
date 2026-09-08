import { getDb, SINGLETON_KEY, type ProfileRecord } from './db';
import { getSetting, setSetting } from './settings';

/**
 * Who is practising.
 *
 * ADR-046: a family shares a device far more often than it shares an account,
 * and until now the device shared one set of Leitner boxes. Three children on
 * one iPad were one learner as far as the scheduler was concerned — the
 * youngest kept meeting the eldest's provinces, and nobody's forecast meant
 * anything.
 *
 * A child here is still not an account. There is no password, no e-mail and no
 * way to sign in as one; it is a name on a device, which is what ADR-008
 * allows and all this needs. The parent account of ADR-050 sits above these
 * and syncs them; it does not replace them.
 */

/** Which child is practising, by id. */
const ACTIVE = 'actiefKind';
/** Set once the pre-family rows have been copied across. */
const COPIED = 'voortgangPerKind';

export async function listChildren(): Promise<ProfileRecord[]> {
  const db = await getDb();
  const rows = await db.getAll('profile');
  // Oldest first, which on a family device is very nearly always the order
  // they were added in and never surprises anyone.
  return rows.sort((a, b) => a.aangemaaktOp.localeCompare(b.aangemaaktOp));
}

/**
 * The child whose work is being read and written.
 *
 * Falls back to the first child rather than to nothing. A device that has been
 * practising since before there were children has one profile under the old
 * singleton key, and it is theirs.
 */
export async function activeChildId(): Promise<string> {
  const chosen = await getSetting(ACTIVE);
  if (chosen) return chosen;

  const children = await listChildren();
  return children[0]?.id ?? SINGLETON_KEY;
}

export async function getActiveChild(): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  return db.get('profile', await activeChildId());
}

export async function switchChild(id: string): Promise<void> {
  await setSetting(ACTIVE, id);
}

/**
 * A new child on this device.
 *
 * The first keeps the old singleton key so that everything already written
 * under it — a streak, a level, a set of boxes — belongs to them without being
 * moved. Everyone after that gets a uuid.
 */
export async function createChild(naam: string): Promise<ProfileRecord> {
  const existing = await listChildren();

  const child: ProfileRecord = {
    id: existing.length === 0 ? SINGLETON_KEY : crypto.randomUUID(),
    naam: naam.trim(),
    avatarConfig: {},
    niveau: 1,
    xp: 0,
    munten: 0,
    aangemaaktOp: new Date().toISOString(),
  };

  const db = await getDb();
  await db.put('profile', child);
  await switchChild(child.id);
  return child;
}

/**
 * Moves what a device learned before it knew about children onto the first of
 * them.
 *
 * Run on first read rather than inside the version-change transaction. A
 * migration that runs during an upgrade cannot be tested from a machine with no
 * toolchain and fails by making a child's work unreachable with no error; this
 * one runs in an ordinary transaction, is idempotent — every write is keyed —
 * and can simply be tried again on the next read.
 *
 * It copies rather than moves. The old stores are left exactly as they were, so
 * a version that goes wrong can still be rolled back to one that reads them.
 */
export async function ensureProgressPerChild(): Promise<void> {
  if ((await getSetting(COPIED)) === 'ja') return;

  const db = await getDb();
  const kindId = SINGLETON_KEY;

  const states = await db.getAll('itemStates');
  for (const state of states) await db.put('progress', { ...state, kindId });

  const badges = await db.getAll('badges');
  for (const badge of badges) await db.put('kindBadges', { ...badge, kindId });

  await setSetting(COPIED, 'ja');
}
