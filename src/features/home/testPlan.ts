import { useCallback, useEffect, useState } from 'react';
import { dagenTussen, dayKey } from '@/game-core';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
import { getSetting, setSetting } from '@/store/profile';

/**
 * The tests that are coming, and what each one is about.
 *
 * There was one of them, and one is what a term is not: a child has a
 * topography test on Tuesday and a tables test the Friday after, and a block
 * that could hold a single date made them choose which of the two to plan for
 * (ADR-077). There are as many now as they want to type in.
 *
 * A date on its own plans nothing, so a test still carries its subject. That
 * is what turns the block into a plan rather than a calendar: the soonest test
 * decides what the front door offers to carry on with, and it is the one thing
 * on that screen which acts on what the child typed.
 *
 * Only subjects that exist may be chosen. Offering a test for woordjes would
 * be promising practice material for it, and ADR-037's rule is that this
 * product does not make a child a promise it has not kept yet. Klokkijken was
 * the example here until it was built, which is the list doing its job.
 *
 * They live in `settings`, which is a key and a value: a fact about the device
 * the family shares, needing no schema change. The list is JSON in one row
 * rather than a store of its own — three tests is not a table.
 */

/** The list, as JSON. */
const TESTS_KEY = 'toetsen';
/** What a single test used to be stored under, read once and then carried over. */
const LEGACY_DATE_KEY = 'toetsdatum';
const LEGACY_SUBJECT_KEY = 'toetsvak';

export interface Toets {
  readonly id: string;
  /** YYYY-MM-DD in local time. */
  readonly date: string;
  readonly subject: Module['id'] | null;
}

export interface TestPlan {
  /** The tests still to come, soonest first. */
  readonly toetsen: readonly Toets[];
  /** The soonest test's date, or null. What the block leads with. */
  readonly date: string | null;
  /** The soonest test's subject. What "verder" continues with. */
  readonly subject: Module['id'] | null;
  readonly add: (date: string, subject: string) => void;
  readonly remove: (id: string) => void;
}

/** The modules a test may be set for: the ones a child can actually practise. */
export const TEST_SUBJECTS: readonly Module[] = BUILT_MODULES;

function asSubject(value: string | undefined | null): Module['id'] | null {
  return TEST_SUBJECTS.find((module) => module.id === value)?.id ?? null;
}

/**
 * What is in the row, made safe.
 *
 * A settings value is a string this code wrote, and it is still parsed as if a
 * stranger had: a row from a later version, a half-written value, a browser
 * that lost the tail of it. A test list that throws would take the whole front
 * door with it, and the honest fallback is "no tests" rather than a crash.
 */
function parse(raw: string | undefined): Toets[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): Toets[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const row = entry as Record<string, unknown>;
      const date = typeof row.date === 'string' ? row.date : null;
      if (date === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
      const id = typeof row.id === 'string' ? row.id : date;
      return [{ id, date, subject: asSubject(row.subject as string) }];
    });
  } catch {
    return [];
  }
}

/** Soonest first, and never a test that has been. */
function komend(toetsen: readonly Toets[], vandaag: string): Toets[] {
  return [...toetsen]
    .filter((toets) => toets.date >= vandaag)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function useTestPlan(now = new Date()): TestPlan {
  const [toetsen, setToetsen] = useState<readonly Toets[]>([]);
  const vandaag = dayKey(now);

  useEffect(() => {
    void Promise.all([
      getSetting(TESTS_KEY),
      getSetting(LEGACY_DATE_KEY),
      getSetting(LEGACY_SUBJECT_KEY),
    ]).then(([raw, oudeDatum, oudVak]) => {
      const lijst = parse(raw);
      // The one test a device already had, carried over rather than dropped.
      // It is read every time rather than migrated once: a migration that runs
      // on a front door is a write nobody asked for on a screen that is
      // supposed to be instant.
      if (lijst.length === 0 && oudeDatum) {
        setToetsen([{ id: oudeDatum, date: oudeDatum, subject: asSubject(oudVak) }]);
        return;
      }
      setToetsen(lijst);
    });
  }, []);

  const write = useCallback((lijst: readonly Toets[]) => {
    setToetsen(lijst);
    void setSetting(TESTS_KEY, JSON.stringify(lijst));
  }, []);

  const add = useCallback(
    (date: string, subject: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const toets: Toets = { id: crypto.randomUUID(), date, subject: asSubject(subject) };
      // Written already pruned: a test that has been is not part of a plan, and
      // keeping it would mean the list growing for the whole of a school year.
      write([...komend(toetsen, vandaag), toets].sort((a, b) => a.date.localeCompare(b.date)));
    },
    [toetsen, vandaag, write],
  );

  const remove = useCallback(
    (id: string) => write(komend(toetsen, vandaag).filter((toets) => toets.id !== id)),
    [toetsen, vandaag, write],
  );

  const lijst = komend(toetsen, vandaag);
  const eerste = lijst[0] ?? null;

  return {
    toetsen: lijst,
    date: eerste?.date ?? null,
    subject: eerste?.subject ?? null,
    add,
    remove,
  };
}

/**
 * How many calendar days from today, negative once the test has been. Days in
 * Europe/Amsterdam (ADR-106), so a test set for tomorrow reads as one day away
 * at eleven at night as well as at eight in the morning.
 */
export function daysUntil(date: string, now: Date): number {
  return dagenTussen(dayKey(now), date);
}
