import type { ProfileRecord } from '@/store/db';
import { getProfile } from '@/store/profile';

/**
 * The first read, and what to do when it never comes back.
 *
 * Opening IndexedDB is normally instant, and the app is built on that: there is
 * no spinner, because one record out of a local store returns before a spinner
 * could finish its first turn. That is true of the fast path and says nothing
 * about the slow one, and `indexedDB.open` has a slow path that never ends —
 * a `deleteDatabase` blocked by another tab, site data switched off in Safari,
 * a database the browser refuses to open at all. The promise simply does not
 * settle. Observed on the live site: the open hung and the body stayed empty,
 * so the whole product was a white page with nothing to read and nothing to
 * press.
 *
 * So the read is raced against a clock. Five seconds is far outside anything
 * the working path does — a version upgrade over a few hundred rows is tens of
 * milliseconds — and well inside how long a parent will look at a blank screen
 * before deciding the thing is broken.
 *
 * A read that lands after the clock has run out is ignored on purpose. By then
 * the screen says the app cannot save anything here and offers a button; the
 * app appearing underneath a finger already on its way down is a worse failure
 * than the one being reported. `NoStorage` reloads instead, and a store that
 * has just answered answers the second time too.
 */
export const BOOT_TIMEOUT_MS = 5000;

/**
 * Why there is no profile. Not the same thing twice: `blocked` is an open that
 * said no, which is the browser refusing storage, and `silent` is an open that
 * said nothing at all. The child gets the same screen and one different line.
 */
export type NoStorageCause = 'blocked' | 'silent';

export type Boot =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileRecord | null }
  | { status: 'no-storage'; cause: NoStorageCause };

/** Boot once the read has ended, one way or the other. */
export type BootSettled = Exclude<Boot, { status: 'loading' }>;

export function bootProfile(
  read: () => Promise<ProfileRecord | undefined> = getProfile,
  timeoutMs: number = BOOT_TIMEOUT_MS,
): Promise<BootSettled> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clock = new Promise<BootSettled>((resolve) => {
    timer = setTimeout(() => resolve({ status: 'no-storage', cause: 'silent' }), timeoutMs);
  });

  const record = read().then(
    (profile): BootSettled => ({
      status: 'ready',
      profile: profile ?? null,
    }),
    // Every rejection here is the same fact from the child's side: nothing can
    // be saved on this device. The error itself is not shown — "NotAllowedError"
    // is not a sentence anyone can act on — but it is worth having in the
    // console of whoever is asked to look.
    (error: unknown): BootSettled => {
      console.error(error);
      return { status: 'no-storage', cause: 'blocked' };
    },
  );

  return Promise.race([record, clock]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
