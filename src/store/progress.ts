import type { ItemState, ModeId } from '@/game-core';
import { getDb, type AttemptRecord, type SessionRecord } from './db';

/**
 * Reading and writing what a child has learned.
 *
 * Everything here writes to the device and nowhere else. The shapes match the
 * future server tables (DATAMODEL part A), so adding accounts one day is an
 * upload rather than a migration — including `sessions.itemSet`, which nothing
 * validates yet but which the server will need to re-score against (ADR-003).
 */

export async function loadItemStates(): Promise<Map<string, ItemState>> {
  const db = await getDb();
  const rows = await db.getAll('itemStates');
  return new Map(rows.map((row) => [row.itemId, row]));
}

export async function saveItemState(state: ItemState): Promise<void> {
  const db = await getDb();
  await db.put('itemStates', state);
}

export async function startSession(mode: ModeId, itemIds: readonly string[]): Promise<string> {
  const db = await getDb();
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    mode,
    itemSet: [...itemIds],
    score: null,
    gestart: new Date().toISOString(),
    geeindigd: null,
  };
  await db.put('sessions', session);
  return session.id;
}

export async function finishSession(id: string, score: number): Promise<void> {
  const db = await getDb();
  const existing = await db.get('sessions', id);
  if (!existing) return;
  await db.put('sessions', { ...existing, score, geeindigd: new Date().toISOString() });
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
    itemId: params.itemId,
    mode: params.mode,
    correct: params.correct,
    responseMs: params.responseMs,
    gekozenAntwoord: params.chosen,
    tijdstip: new Date().toISOString(),
  });
  await saveItemState(params.nextState);
}
