import { useEffect, useState } from 'react';
import { getSetting, setSetting } from '@/store/profile';

/**
 * The one preference on Jij that is a preference: reading the questions aloud.
 *
 * S12 draws two switches. The second was "tijd meten in een ronde", and it is
 * gone: time and speed belong to the game forms with a clock, which are out of
 * scope, and a switch for a clock that no round has is a promise the screen
 * does not keep. The second switch on Jij is now the holiday mode of the
 * streak, which is not a preference but a fact about the child, and lives with
 * the streak (`streakStore.setVakantie`).
 */

export interface Preferences {
  /**
   * On by default. For group 4 reading aloud is not an aid, it is the only way
   * to know what the question says, so this starts on and a child turns it off
   * rather than having to find it.
   */
  readonly readAloud: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = { readAloud: true };

const KEY = { readAloud: 'voorlezen' } as const;

/** Stored as strings because that is what the settings store holds. */
function read(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'aan';
}

export async function loadPreferences(): Promise<Preferences> {
  return { readAloud: read(await getSetting(KEY.readAloud), DEFAULT_PREFERENCES.readAloud) };
}

export async function savePreference(name: keyof Preferences, on: boolean): Promise<void> {
  await setSetting(KEY[name], on ? 'aan' : 'uit');
}

/** The preferences as React state, for the screens that obey them. */
export function usePreferences(): Preferences {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    void loadPreferences().then(setPrefs);
  }, []);

  return prefs;
}
