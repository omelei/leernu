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

/** One finished round, as K1's history and its favourites read it back. */
export interface PlayedRound {
  readonly mode: ModeId;
  /** The questions it asked, so a caller can work out which set they came from. */
  readonly itemIds: readonly string[];
  readonly correct: number;
  readonly answered: number;
  readonly at: string;
}

/**
 * Every finished round this child has played, newest first.
 *
 * Rounds nobody answered a question in are left out. They happened — a child
 * opened a round and closed it — but they are not practice, and a history that
 * counted them would report a mark for a round that was never played.
 *
 * The whole list rather than a page of it: this is one device's own rounds, it
 * is read once when the front door opens, and every caller wants a different
 * slice of it — the last three, or the most-played four. Cutting it here would
 * mean cutting it twice.
 */
export async function loadPlayedRounds(): Promise<PlayedRound[]> {
  const db = await getDb();
  const kindId = await activeChildId();

  const played: PlayedRound[] = [];

  for (const session of await db.getAll('sessions')) {
    // Rows written before ADR-046 carry no child at all, and they belong to
    // the first one — the same fallback activeChildId() makes.
    if ((session.kindId ?? SINGLETON_KEY) !== kindId) continue;
    if (session.geeindigd === null || session.score === null) continue;

    const itemIds: readonly string[] = Array.isArray(session.itemSet)
      ? (session.itemSet as string[])
      : [];
    const answered = session.beantwoord ?? itemIds.length;
    if (answered === 0) continue;

    played.push({
      mode: session.mode,
      itemIds,
      correct: session.score,
      answered,
      at: session.geeindigd,
    });
  }

  return played.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Every answer this child has ever given, as one fraction.
 *
 * Counted over attempts rather than over rounds, because that is where an
 * answer is actually recorded and it is the only version that stays true when
 * a round is stopped early.
 *
 * It is not a retention figure and must never be worded as one: this is what
 * has been answered correctly, over everything, ever. It goes up slowly, it
 * never resets, and that is the point — it is the one number on K1 that is
 * about the whole of the work rather than about today.
 */
export interface Accuracy {
  readonly correct: number;
  readonly answered: number;
}

export async function loadAccuracy(): Promise<Accuracy> {
  const db = await getDb();
  const kindId = await activeChildId();

  let correct = 0;
  let answered = 0;

  for (const attempt of await db.getAll('attempts')) {
    if ((attempt.kindId ?? SINGLETON_KEY) !== kindId) continue;
    answered++;
    if (attempt.correct) correct++;
  }

  return { correct, answered };
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
