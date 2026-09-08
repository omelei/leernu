import type { ProfileRecord } from './db';
import { createChild, getActiveChild } from './children';

/**
 * Who is practising, and the settings that belong to the device.
 *
 * A profile is not an account: no e-mail, no password, no sign-in. A name is
 * asked for so the app can greet the child by it, and that is the entire reason
 * it exists (ADR-008).
 *
 * There used to be exactly one per device. There are now as many as the family
 * has children (ADR-046) — `store/children.ts` holds that, and these two stay
 * as the front door for the screens that only ever want whoever is practising.
 *
 * The settings below are the device's, not a child's: which switches are on is
 * a property of the iPad in the kitchen, not of who is holding it.
 */

export async function getProfile(): Promise<ProfileRecord | undefined> {
  return getActiveChild();
}

export async function createProfile(naam: string): Promise<ProfileRecord> {
  return createChild(naam);
}

/** Re-exported so the screens that ask for a setting keep one import. */
export { getSetting, setSetting } from './settings';
