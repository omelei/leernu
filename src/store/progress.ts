import type { ItemState, ModeId } from '@/game-core';
import { getDb, SINGLETON_KEY, type AttemptRecord, type SessionRecord } from './db';
import { activeChildId, ensureProgressPerChild } from './children';

/**
 * Reading and writing what a child has learned.
 *
 * Everything here writes to the device and nowhere else. The shapes match the
 * future server tables (DATAMODEL part A), so adding accounts one day is an
 * upload rather than a migration — including `sessions.itemSet`, which nothing
 * validates yet but which the server will need to re-score against (ADR-003).
 *
 * Which child is answering is resolved here and not by the caller. Every screen
 * asks for "the boxes" and gets the ones belonging to whoever is practising,
 * which is the only version of this that cannot be got wrong by forgetting.
 */

export async function loadItemStates(): Promise<Map<string, ItemState>> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('progress', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Map(rows.map((row) => [row.itemId, row]));
}

export async function saveItemState(state: ItemState): Promise<void> {
  const db = await getDb();
  await db.put('progress', { ...state, kindId: await activeChildId() });
}

export async function startSession(mode: ModeId, itemIds: readonly string[]): Promise<string> {
  const db = await getDb();
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    kindId: await activeChildId(),
    mode,
    itemSet: [...itemIds],
    score: null,
    gestart: new Date().toISOString(),
    geeindigd: null,
  };
  await db.put('sessions', session);
  return session.id;
}

/**
 * @param score     how many were right
 * @param answered  how many were asked and answered, which is not the same as
 *                  how many the round set out to ask — a round can be stopped
 *                  early. Without it a mark cannot be worked out afterwards.
 */
export async function finishSession(id: string, score: number, answered: number): Promise<void> {
  const db = await getDb();
  const existing = await db.get('sessions', id);
  if (!existing) return;
  await db.put('sessions', {
    ...existing,
    score,
    beantwoord: answered,
    geeindigd: new Date().toISOString(),
  });
}

/** The last finished round over a set, as K1 reports it back. */
export interface LastRound {
  readonly correct: number;
  readonly answered: number;
  readonly at: string;
}

/**
 * What happened the last time this child practised these items.
 *
 * Matched on the questions rather than on a set id, because a session records
 * what it asked and not which set it came from. An overlap of one item is
 * enough: a round samples fifteen of eighty, and two rounds over the same set
 * rarely share more than a handful.
 *
 * Rounds that were opened and abandoned without an answer are skipped. "Je
 * scoorde vorige keer een 1,0" for a round nobody played is not a fact about
 * the child.
 */
export async function loadLastRound(itemIds: readonly string[]): Promise<LastRound | null> {
  const db = await getDb();
  const kindId = await activeChildId();
  const wanted = new Set(itemIds);

  let best: LastRound | null = null;

  for (const session of await db.getAll('sessions')) {
    // Rows written before ADR-046 carry no child at all, and they belong to
    // the first one — the same fallback activeChildId() makes.
    if ((session.kindId ?? SINGLETON_KEY) !== kindId) continue;
    if (session.geeindigd === null || session.score === null) continue;

    const asked: readonly string[] = Array.isArray(session.itemSet)
      ? (session.itemSet as string[])
      : [];
    if (!asked.some((id) => wanted.has(id))) continue;

    const answered = session.beantwoord ?? asked.length;
    if (answered === 0) continue;

    if (best === null || session.geeindigd > best.at) {
      best = { correct: session.score, answered, at: session.geeindigd };
    }
  }

  return best;
}

export async function recordAttempt(attempt: Omit<AttemptRecord, 'id'>): Promise<void> {
  const db = await getDb();
  await db.add('attempts', attempt as AttemptRecord);
}

/**
 * One answer, written as one unit: the attempt for the report, and the item's
 * new Leitner state for the next round. They are saved together because a
 * scheduler that disagrees with the history is worse than either alone.
 */
export async function saveAnswer(params: {
  readonly sessionId: string;
  readonly mode: ModeId;
  readonly itemId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly chosen: string | null;
  readonly nextState: ItemState;
}): Promise<void> {
  await recordAttempt({
    sessionId: params.sessionId,
    kindId: await activeChildId(),
    itemId: params.itemId,
    mode: params.mode,
    correct: params.correct,
    responseMs: params.responseMs,
    gekozenAntwoord: params.chosen,
    tijdstip: new Date().toISOString(),
  });
  await saveItemState(params.nextState);
}
