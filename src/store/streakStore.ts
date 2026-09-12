import {
  currentStreak,
  emptyRun,
  emptyStreak,
  recordActivity,
  recordAnswerRun,
  vakantieAan,
  zetVakantie,
  type FlawlessRun,
  type HolidayPeriod,
  type StreakChange,
  type StreakState,
} from '@/game-core';
import kalender from '../../content/vakanties.json';
import { getDb, type StreakRecord } from './db';
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
    ...(row.eigenVakanties ? { eigenVakanties: row.eigenVakanties } : {}),
  };
}

/**
 * Writes the day streak, keeping what else is on the row. The run of correct
 * answers lives there too (ADR-072), and a put of the streak alone used to
 * replace it with nothing.
 */
export async function saveStreak(state: StreakState): Promise<void> {
  const db = await getDb();
  const id = await activeChildId();
  const row = await db.get('streak', id);
  await db.put('streak', {
    ...row,
    id,
    huidigeStreak: state.huidigeStreak,
    langsteStreak: state.langsteStreak,
    laatsteActieveDag: state.laatsteActieveDag,
    rustdagen: state.rustdagen,
    rustdagWeek: state.rustdagWeek,
    ...(state.eigenVakanties ? { eigenVakanties: [...state.eigenVakanties] } : {}),
  });
}

/** Whether this child's holiday mode is on. */
export async function readVakantie(): Promise<boolean> {
  return vakantieAan(await loadStreak());
}

/** Switches this child's holiday mode, from today. Returns the new setting. */
export async function setVakantie(aan: boolean, now = new Date()): Promise<boolean> {
  const next = zetVakantie(await loadStreak(), aan, now);
  await saveStreak(next);
  return vakantieAan(next);
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
  const row: StreakRecord = (await db.get('streak', id)) ?? {
    id,
    huidigeStreak: 0,
    langsteStreak: 0,
    laatsteActieveDag: null,
    rustdagen: 0,
    rustdagWeek: null,
  };
  const run = recordAnswerRun({ nu: row.foutloosNu ?? 0, beste: row.foutloosBeste ?? 0 }, correct);

  await db.put('streak', { ...row, id, foutloosNu: run.nu, foutloosBeste: run.beste });
  return run;
}
