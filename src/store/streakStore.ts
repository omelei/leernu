import {
  currentStreak,
  emptyRun,
  emptyStreak,
  recordActivity,
  recordAnswerRun,
  type FlawlessRun,
  type HolidayPeriod,
  type StreakChange,
  type StreakState,
} from '@/game-core';
import kalender from '../../content/vakanties.json';
import { getDb } from './db';
import { activeChildId } from './children';

/**
 * The streak, on the device and nowhere else, and belonging to one child.
 *
 * Keyed by the child rather than by the device (ADR-046). A shared streak on a
 * family iPad meant the eldest kept the youngest's going, which is the one
 * thing a streak may never do: it is a record of turning up, and it has to be
 * true of whoever it is shown to.
 *
 * The holiday calendar is bundled rather than fetched: it is a kilobyte and a
 * half, and a streak that breaks because a JSON file was slow to arrive would
 * be the worst possible failure of a feature whose whole purpose is not
 * punishing anyone.
 */

export const HOLIDAYS: readonly HolidayPeriod[] = kalender.vakanties;

export async function loadStreak(): Promise<StreakState> {
  const db = await getDb();
  const row = await db.get('streak', await activeChildId());
  if (!row) return emptyStreak();

  return {
    huidigeStreak: row.huidigeStreak,
    langsteStreak: row.langsteStreak,
    laatsteActieveDag: row.laatsteActieveDag,
    rustdagen: row.rustdagen,
    rustdagWeek: row.rustdagWeek,
  };
}

export async function saveStreak(state: StreakState): Promise<void> {
  const db = await getDb();
  await db.put('streak', { id: await activeChildId(), ...state });
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

/**
 * The run of correct answers, which lives on the same row as the day streak.
 *
 * Read and written separately from `StreakState` because they change at
 * different moments: a day streak moves once when a round ends, a run moves on
 * every single answer. Sharing a read-modify-write between the two would mean
 * the last answer of a round racing the round's own save.
 */
export async function loadRun(): Promise<FlawlessRun> {
  const db = await getDb();
  const row = await db.get('streak', await activeChildId());
  if (!row) return emptyRun();
  return { nu: row.foutloosNu ?? 0, beste: row.foutloosBeste ?? 0 };
}

/** One answer, counted into the run. Returns the run as it now stands. */
export async function recordAnswerFlawless(correct: boolean): Promise<FlawlessRun> {
  const db = await getDb();
  const id = await activeChildId();
  const row = (await db.get('streak', id)) ?? { id, ...emptyStreak() };
  const run = recordAnswerRun({ nu: row.foutloosNu ?? 0, beste: row.foutloosBeste ?? 0 }, correct);

  await db.put('streak', { ...row, id, foutloosNu: run.nu, foutloosBeste: run.beste });
  return run;
}
