import { isNieuwRecord } from '@/game-core';
import { getDb, type RecordRecord } from './db';
import { activeChildId } from './children';

/**
 * The best times of the tijdrit, on this device and nowhere else.
 *
 * There is no server to send a time to and there will not be one for this: spec
 * §10 says nothing in this product ranks one child against another, and a
 * leaderboard is exactly that. What a record is here is the number this child
 * has to beat, which is the only comparison that makes a ten-year-old practise
 * the same twelve provinces a fourth time.
 *
 * Which child is asking is resolved here rather than by the caller, the same as
 * everywhere else in this folder: a screen asks for "the record" and gets the
 * one belonging to whoever is practising (ADR-046).
 */

export interface RecordUitslag {
  /** What stood before this round, or null for a track never ridden. */
  readonly vorige: number | null;
  /** What this round did. */
  readonly ms: number;
  /** Whether that beat it. */
  readonly nieuw: boolean;
}

export async function loadRecord(baan: string): Promise<number | null> {
  const db = await getDb();
  const row = await db.get('records', [await activeChildId(), baan]);
  return row?.ms ?? null;
}

/** Every track this child has ridden, by track. For the page that offers one. */
export async function loadRecords(): Promise<Map<string, number>> {
  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('records', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Map(rows.map((row) => [row.baan, row.ms]));
}

/**
 * Writes a time, and says what it meant.
 *
 * Only faster is written. A slower round is still a round — it counts for the
 * streak, it moves the same Leitner boxes, and the result screen still shows
 * what it took — but a record that went backwards would not be a record.
 */
export async function saveRecord(baan: string, ms: number): Promise<RecordUitslag> {
  const db = await getDb();
  const kindId = await activeChildId();
  const vorige = (await db.get('records', [kindId, baan]))?.ms ?? null;
  const nieuw = isNieuwRecord(ms, vorige);

  if (nieuw) {
    const row: RecordRecord = { kindId, baan, ms, behaaldOp: new Date().toISOString() };
    await db.put('records', row);
  }

  return { vorige, ms, nieuw };
}
