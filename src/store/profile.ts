import { getDb, SINGLETON_KEY, type ProfileRecord, type SettingRecord } from './db';

/**
 * The player's profile and device settings.
 *
 * There is exactly one profile per device and it is not an account: no e-mail,
 * no password, no server. A name is asked for so the app can greet the child by
 * it, and that is the entire reason it exists.
 */

export async function getProfile(): Promise<ProfileRecord | undefined> {
  const db = await getDb();
  return db.get('profile', SINGLETON_KEY);
}

export async function createProfile(naam: string): Promise<ProfileRecord> {
  const profile: ProfileRecord = {
    id: SINGLETON_KEY,
    naam: naam.trim(),
    avatarConfig: {},
    niveau: 1,
    xp: 0,
    munten: 0,
    aangemaaktOp: new Date().toISOString(),
  };

  const db = await getDb();
  await db.put('profile', profile);
  return profile;
}

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  const record: SettingRecord | undefined = await db.get('settings', key);
  return record?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.put('settings', { key, value });
}

export const SETTING_FONT = 'font';
export const FONT_DYSLEXIC = 'dyslexic';
export const FONT_DEFAULT = 'default';

/**
 * The font choice is applied to the document element rather than a React tree,
 * because it has to survive before the app paints. Anything slower shows the
 * child a flash of the font they explicitly turned off.
 */
export function applyFontSetting(font: string): void {
  if (font === FONT_DYSLEXIC) {
    document.documentElement.setAttribute('data-font', FONT_DYSLEXIC);
  } else {
    document.documentElement.removeAttribute('data-font');
  }
}
