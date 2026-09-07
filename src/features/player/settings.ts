import { getSetting, setSetting } from '@/store/profile';

/**
 * The two switches on K10, and both of them do something.
 *
 * A switch that changes nothing is a promise the screen does not keep, and on a
 * settings page that is the whole content — so these are wired to the two
 * places they claim to affect rather than stored and admired.
 *
 * K10 had a third, for the reading mode. ADR-025 dropped it and it is not here
 * behind a flag either: a switched-off flag is code nobody runs.
 */

export interface Preferences {
  /**
   * On by default. For group 4 reading aloud is not an aid, it is the only way
   * to know what the question says (styleguide §C), so this starts on and a
   * child turns it off rather than having to find it.
   */
  readonly readAloud: boolean;
  /**
   * Off by default, and the reason is on the screen beside it: haste does not
   * help you remember. Off, the timed round is not offered at all — a switch
   * that only hid the clock while still counting would be a worse lie than no
   * switch.
   */
  readonly timer: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = { readAloud: true, timer: false };

const KEY = { readAloud: 'voorlezen', timer: 'timer' } as const;

/** Stored as strings because that is what the settings store holds. */
function read(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'aan';
}

export async function loadPreferences(): Promise<Preferences> {
  const [readAloud, timer] = await Promise.all([
    getSetting(KEY.readAloud),
    getSetting(KEY.timer),
  ]);

  return {
    readAloud: read(readAloud, DEFAULT_PREFERENCES.readAloud),
    timer: read(timer, DEFAULT_PREFERENCES.timer),
  };
}

export async function savePreference(name: keyof Preferences, on: boolean): Promise<void> {
  await setSetting(KEY[name], on ? 'aan' : 'uit');
}
