import {
  currentStreak,
  emptyStreak,
  recordActivity,
  type HolidayPeriod,
  type StreakChange,
  type StreakState,
} from '@/game-core';
import kalender from '../../content/vakanties.json';
import { getDb, SINGLETON_KEY } from './db';

/**
 * The streak, on the device and nowhere else.
 *
 * The holiday calendar is bundled rather than fetched: it is a kilobyte and a
 * half, and a streak that breaks because a JSON file was slow to arrive would
 * be the worst possible failure of a feature whose whole purpose is not
 * punishing anyone.
 */

export const HOLIDAYS: readonly HolidayPeriod[] = kalender.vakanties;

export async function loadStreak(): Promise<StreakState> {
  const db = await getDb();
  const row = await db.get('streak', SINGLETON_KEY);
  if (!row) return emptyStreak();

  return {
    huidigeStreak: row.huidigeStreak,
    langsteStreak: row.langsteStreak,
    laatsteActieveDag: row.laatsteActieveDag,
    vriezers: row.vriezers,
    vriezerWeek: row.vriezerWeek,
  };
}

export async function saveStreak(state: StreakState): Promise<void> {
  const db = await getDb();
  await db.put('streak', { id: SINGLETON_KEY, ...state });
}

/** Applies a finished round and saves the result. Returns what changed. */
export async function recordRoundFinished(now = new Date()): Promise<StreakChange> {
  const state = await loadStreak();
  const change = recordActivity(state, now, HOLIDAYS);
  if (change.counted) await saveStreak(change.state);
  return change;
}

/** What the streak is worth today, without recording anything. */
export async function readStreak(now = new Date()): Promise<number> {
  return currentStreak(await loadStreak(), now, HOLIDAYS);
}
