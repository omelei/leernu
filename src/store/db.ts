import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ItemState, ModeId, Niveau } from '@/game-core';

/**
 * The local store (DATAMODEL.md, part A). This is the whole database: there is
 * no server, and nothing here is ever transmitted.
 *
 * Every record below deliberately carries the shape its future Postgres table
 * will have, so that adding accounts one day is an upload of rows rather than a
 * migration (ADR-015). Field names are camelCase here and snake_case there;
 * that single renaming is the only translation, and it lives in one place when
 * the time comes.
 */

/**
 * Never change this after the app has shipped. IndexedDB is keyed by database
 * name, so a rename does not migrate anything — it silently starts an empty
 * database and every child's progress becomes unreachable, with no error. It was
 * safe to change during phase 0 because nobody had data yet. A rebrand later
 * keeps this string and changes only `brand.name`.
 */
export const DB_NAME = 'leernu';
/**
 * 2 since ADR-031, which renamed the streak record's `vriezers` and
 * `vriezerWeek` to `rustdagen` and `rustdagWeek`. Reading a renamed field back
 * as `undefined` would quietly reset a child's saved rest days to zero, with
 * no error anywhere — the exact failure the streak exists to avoid — so the
 * rename ships with a migration rather than a hope that nobody had data.
 *
 * 3 since ADR-040, which retired the stamp awarded for taking part and renamed
 * the one that used the word this product no longer uses. Both are rows rather
 * than fields, so the migration rewrites values and leaves the schema alone.
 */
export const DB_VERSION = 3;

/** Both singleton stores use this key, so there is never a "which row" question. */
export const SINGLETON_KEY = 'me';

export interface ProfileRecord {
  id: string;
  /** What the child typed. Never leaves the device. */
  naam: string;
  avatarConfig: Record<string, string>;
  niveau: Niveau;
  xp: number;
  munten: number;
  aangemaaktOp: string;
}

export interface SessionRecord {
  id: string;
  mode: ModeId;
  /** The questions and their answer key. Unused in v1; see ADR-003. */
  itemSet: unknown;
  score: number | null;
  gestart: string;
  geeindigd: string | null;
}

export interface AttemptRecord {
  id?: number;
  sessionId: string;
  itemId: string;
  mode: ModeId;
  correct: boolean;
  responseMs: number;
  /** The item id chosen, or the normalised text typed. Never free text. */
  gekozenAntwoord: string | null;
  tijdstip: string;
}

export interface StreakRecord {
  id: string;
  huidigeStreak: number;
  langsteStreak: number;
  laatsteActieveDag: string | null;
  rustdagen: number;
  /** ISO week in which the last rest day was earned, so one week gives one. */
  rustdagWeek: string | null;
}

/**
 * The streak record as it was stored before ADR-031. It exists only so the
 * migration in `getDb` can read the old field names; nothing else may use it.
 */
interface LegacyStreakRecord {
  id: string;
  huidigeStreak: number;
  langsteStreak: number;
  laatsteActieveDag: string | null;
  vriezers?: number;
  vriezerWeek?: string | null;
}

export interface BadgeRecord {
  badgeId: string;
  behaaldOp: string;
}

export interface StampRecord {
  regioSet: string;
  behaaldOp: string;
}

export interface SettingRecord {
  key: string;
  value: string;
}

interface TopoDB extends DBSchema {
  profile: { key: string; value: ProfileRecord };
  itemStates: { key: string; value: ItemState };
  sessions: { key: string; value: SessionRecord };
  attempts: {
    key: number;
    value: AttemptRecord;
    indexes: { 'by-session': string; 'by-item': string };
  };
  streak: { key: string; value: StreakRecord };
  badges: { key: string; value: BadgeRecord };
  stamps: { key: string; value: StampRecord };
  settings: { key: string; value: SettingRecord };
}

let dbPromise: Promise<IDBPDatabase<TopoDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<TopoDB>> {
  dbPromise ??= openDB<TopoDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        db.createObjectStore('profile', { keyPath: 'id' });
        db.createObjectStore('itemStates', { keyPath: 'itemId' });
        db.createObjectStore('sessions', { keyPath: 'id' });

        const attempts = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
        // Both reports we know we will want: what happened in one round, and
        // how one item is going over time.
        attempts.createIndex('by-session', 'sessionId');
        attempts.createIndex('by-item', 'itemId');

        db.createObjectStore('streak', { keyPath: 'id' });
        db.createObjectStore('badges', { keyPath: 'badgeId' });
        db.createObjectStore('stamps', { keyPath: 'regioSet' });
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // ADR-031: rename the one streak row in place. The read is issued
      // synchronously and the write lands in the following microtask, which is
      // still inside this version-change transaction — so the two are atomic,
      // and a failed put aborts the upgrade instead of leaving half a rename.
      if (oldVersion >= 1 && oldVersion < 2) {
        const store = tx.objectStore('streak');
        void store.get(SINGLETON_KEY).then((row) => {
          if (!row) return;
          const legacy = row as unknown as LegacyStreakRecord;
          void store.put({
            id: legacy.id,
            huidigeStreak: legacy.huidigeStreak,
            langsteStreak: legacy.langsteStreak,
            laatsteActieveDag: legacy.laatsteActieveDag,
            rustdagen: legacy.vriezers ?? 0,
            rustdagWeek: legacy.vriezerWeek ?? null,
          });
        });
      }

      // ADR-040: "eerste-ronde" was earned by taking part and no longer exists;
      // "set-vast" is the same achievement under the word ADR-030 retired.
      //
      // The retired row is deleted rather than left to be ignored. A stamp the
      // app will never name again is not a reward a child still holds, and
      // leaving it would mean every later reader of this store has to know that.
      if (oldVersion >= 1 && oldVersion < 3) {
        const stamps = tx.objectStore('badges');
        void stamps.delete('eerste-ronde');
        void stamps.get('set-vast').then((row) => {
          if (!row) return;
          void stamps.delete('set-vast');
          void stamps.put({ badgeId: 'set-onthouden', behaaldOp: row.behaaldOp });
        });
      }
    },
  });

  return dbPromise;
}

/** Test seam: forces the next getDb() to reopen. */
export function resetDbForTests(): void {
  dbPromise = null;
}
