import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootProfile } from './bootProfile';
import type { ProfileRecord } from '@/store/db';

/**
 * The clock, and the four ways the first read can end.
 *
 * The case worth having a test for is the one nothing else can reach: a read
 * that never settles. It cannot be provoked from a browser on purpose — it is a
 * blocked delete in another tab, or a store the browser will not open — and it
 * is the one that shipped a blank page to production. A promise that is never
 * resolved is exactly that failure, and it fits on one line.
 */

const SOFIE: ProfileRecord = {
  id: 'me',
  naam: 'Sofie',
  avatarConfig: { sticker: 'vos' },
  niveau: 1,
  xp: 0,
  munten: 0,
  aangemaaktOp: '2026-09-08T00:00:00.000Z',
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('the first read', () => {
  it('hands over the profile it found', async () => {
    expect(await bootProfile(() => Promise.resolve(SOFIE))).toEqual({
      status: 'ready',
      profile: SOFIE,
    });
  });

  // No profile is not a failure: it is a device nobody has typed their name on
  // yet, and the answer to it is ProfileGate rather than an apology.
  it('reports an empty store as ready with nobody in it', async () => {
    expect(await bootProfile(() => Promise.resolve(undefined))).toEqual({
      status: 'ready',
      profile: null,
    });
  });

  it('calls a rejected open blocked', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const denied = new Error('storage is blocked');

    expect(await bootProfile(() => Promise.reject(denied))).toEqual({
      status: 'no-storage',
      cause: 'blocked',
    });
    // The child is not shown the error; whoever is asked to look still gets it.
    expect(logged).toHaveBeenCalledWith(denied);
  });

  it('gives up on an open that never answers', async () => {
    vi.useFakeTimers();
    const forever = bootProfile(() => new Promise<never>(() => {}), 5000);

    await vi.advanceTimersByTimeAsync(5000);

    expect(await forever).toEqual({ status: 'no-storage', cause: 'silent' });
  });

  // The clock may not become part of the normal path. A read that answers in a
  // millisecond has to be handed on in a millisecond, or every child pays for
  // the one whose device is broken.
  it('does not wait for the clock when the store answers', async () => {
    vi.useFakeTimers();

    // Not one tick advanced: if this resolves, the race did not need the timer.
    expect(await bootProfile(() => Promise.resolve(SOFIE), 5000)).toEqual({
      status: 'ready',
      profile: SOFIE,
    });
  });

  // Late is not the same as in time. By now the screen says the device cannot
  // save anything and offers a button; the app arriving underneath a finger
  // already on its way down would be a worse failure than the one reported.
  it('ignores a read that lands after it has given up', async () => {
    vi.useFakeTimers();

    // The store answers at eight seconds. The clock ran out at five.
    const late = () =>
      new Promise<ProfileRecord>((resolve) => {
        setTimeout(() => resolve(SOFIE), 8000);
      });

    const boot = bootProfile(late, 5000);
    await vi.advanceTimersByTimeAsync(8000);

    expect(await boot).toEqual({ status: 'no-storage', cause: 'silent' });
  });
});
