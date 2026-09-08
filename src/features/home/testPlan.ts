import { useCallback, useEffect, useState } from 'react';
import { BUILT_MODULES, type Module } from '@/features/shell/modules';
import { getSetting, setSetting } from '@/store/profile';

/**
 * When the test is, and what it is about.
 *
 * The date used to be the whole of it, and a date on its own plans nothing: a
 * child practising for Tuesday still had to find the right subject themselves,
 * and K1 would happily offer them the tables they did last night. The subject
 * is what turns the block into a plan — it decides what "Ga verder" continues
 * with, which is the one thing on the front door that acts on it.
 *
 * Only subjects that exist may be chosen. Offering a test for klokkijken would
 * be promising practice material for it, and ADR-037's rule is that this
 * product does not make a child a promise it has not kept yet.
 *
 * Both live in `settings`, which is a key and a value: it is a fact about the
 * device the family shares, needs no schema change, and is the store that is
 * for exactly this.
 */

const DATE_KEY = 'toetsdatum';
const SUBJECT_KEY = 'toetsvak';

export interface TestPlan {
  /** YYYY-MM-DD in local time, or null when no date has been set. */
  readonly date: string | null;
  readonly subject: Module['id'] | null;
  readonly setDate: (value: string) => void;
  readonly setSubject: (value: string) => void;
}

/** The modules a test may be set for: the ones a child can actually practise. */
export const TEST_SUBJECTS: readonly Module[] = BUILT_MODULES;

function asSubject(value: string | undefined): Module['id'] | null {
  return TEST_SUBJECTS.find((module) => module.id === value)?.id ?? null;
}

export function useTestPlan(): TestPlan {
  // Null until read, which is also what "no test set" looks like — and that is
  // the answer for every child who has not set one, which is most of them. K1
  // draws the block either way rather than waiting: see the note in TestDate.
  const [date, setDateState] = useState<string | null>(null);
  const [subject, setSubjectState] = useState<Module['id'] | null>(null);

  useEffect(() => {
    void Promise.all([getSetting(DATE_KEY), getSetting(SUBJECT_KEY)]).then(([when, what]) => {
      setDateState(when ?? null);
      // A subject saved before it was retired, or before that module existed,
      // reads back as nothing rather than as a module nobody can practise.
      setSubjectState(asSubject(what));
    });
  }, []);

  const setDate = useCallback((value: string) => {
    setDateState(value === '' ? null : value);
    void setSetting(DATE_KEY, value);
  }, []);

  const setSubject = useCallback((value: string) => {
    setSubjectState(asSubject(value));
    void setSetting(SUBJECT_KEY, asSubject(value) ?? '');
  }, []);

  return { date, subject, setDate, setSubject };
}

/**
 * How many days from today, negative once the test has been.
 *
 * Both ends are taken back to local midnight before they are subtracted, so a
 * test set for tomorrow reads as one day away at eleven at night as well as at
 * eight in the morning.
 */
export function daysUntil(date: string, now: Date): number {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
