import { useEffect, useState } from 'react';
import { currentStreak, dagenGeoefend } from '@/game-core';
import { loadPlayedRounds } from '@/store/progress';
import { HOLIDAYS, loadStreak } from '@/store/streakStore';

/** Everything the streak block and the streak page say, read once. */
export interface Reeks {
  /** The day this was read on, which every row and calendar is drawn from. */
  readonly vandaag: Date;
  /** Days in a row, as a round today would find them. */
  readonly dagen: number;
  /** The longest there has been, never less than today's. */
  readonly langste: number;
  readonly rustdagen: number;
  /** The days a round was finished on, YYYY-MM-DD. */
  readonly geoefend: ReadonlySet<string>;
  readonly rondes: number;
  readonly vragen: number;
}

/**
 * The streak and the days behind it (ADR-110).
 *
 * The number is `currentStreak` against today, as the pill in the app bar reads
 * it, so the column and the bar can never show two different counts. The days
 * come from the rounds (`dagenGeoefend`). Null until both are read: a block
 * that says nought and then twelve has told a child something that was not true.
 */
export function useReeks(): Reeks | null {
  const [vandaag] = useState(() => new Date());
  const [reeks, setReeks] = useState<Reeks | null>(null);

  useEffect(() => {
    void Promise.all([loadStreak(), loadPlayedRounds()]).then(([streak, rondes]) => {
      const dagen = currentStreak(streak, vandaag, HOLIDAYS);
      setReeks({
        vandaag,
        dagen,
        langste: Math.max(streak.langsteStreak, dagen),
        rustdagen: streak.rustdagen,
        geoefend: dagenGeoefend(rondes.map((ronde) => ronde.at)),
        rondes: rondes.length,
        vragen: rondes.reduce((samen, ronde) => samen + ronde.answered, 0),
      });
    });
  }, [vandaag]);

  return reeks;
}
