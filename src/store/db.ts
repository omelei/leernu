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
export const DB_VERSION = 1;

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
  vriezers: number;
  /** ISO week in which the last freeze was earned, so one week gives one. */
  vriezerWeek: string | null;
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
    upgrade(db) {
      db.createObjectStore('profile', { keyPath: 'id' });
      db.createObjectStore('itemStates', { keyPath: 'itemId' });
      db.createObjectStore('sessions', { keyPath: 'id' });

      const attempts = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
      // Both reports we know we will want: what happened in one round, and how
      // one item is going over time.
      attempts.createIndex('by-session', 'sessionId');
      attempts.createIndex('by-item', 'itemId');

      db.createObjectStore('streak', { keyPath: 'id' });
      db.createObjectStore('badges', { keyPath: 'badgeId' });
      db.createObjectStore('stamps', { keyPath: 'regioSet' });
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });

  return dbPromise;
}

/** Test seam: forces the next getDb() to reopen. */
export function resetDbForTests(): void {
  dbPromise = null;
}
