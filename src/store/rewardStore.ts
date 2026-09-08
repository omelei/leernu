import { newStamps, rewardForRound, type RewardSnapshot, type StampId } from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';

/**
 * XP, coins and travel stamps, on the device.
 *
 * The object store is still called `badges` and its key is still `badgeId`.
 * That is the one thing here that does not follow the rename: the storage holds
 * what children have already earned, and a schema rename to tidy up a word
 * would be a migration risking real rows for no gain a child can see. The code
 * around it says stamp, the screen says reisstempel, and this paragraph is why
 * the two do not match.
 *
 * Nothing here can be bought, won by chance, or granted by waiting. Spec §12 is
 * blunt about that and the audience is why: every one of these is reachable only
 * by practising, and the code is the place that promise is either kept or
 * quietly broken.
 */

export interface RoundOutcome {
  readonly xp: number;
  readonly coins: number;
  readonly totalXp: number;
  readonly stamps: readonly StampId[];
}

export async function loadStamps(): Promise<Set<string>> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('kindBadges', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Set(rows.map((row) => row.badgeId));
}

/**
 * Applies a finished round: adds what was earned, awards any stamp the round
 * newly satisfies, and reports both so the result screen can say so.
 */
export async function applyRoundRewards(params: {
  readonly correct: number;
  readonly answered: number;
  readonly comboAnswers: number;
  readonly snapshot: RewardSnapshot;
}): Promise<RoundOutcome> {
  const reward = rewardForRound(params);
  const db = await getDb();

  const kindId = await activeChildId();
  const profile = await db.get('profile', kindId);
  const totalXp = (profile?.xp ?? 0) + reward.xp;

  if (profile) {
    await db.put('profile', {
      ...profile,
      xp: totalXp,
      munten: profile.munten + reward.coins,
    });
  }

  const held = await loadStamps();
  const earned = newStamps(params.snapshot, held);
  const behaaldOp = new Date().toISOString();
  for (const badgeId of earned) {
    await db.put('kindBadges', { kindId, badgeId, behaaldOp });
  }

  return { xp: reward.xp, coins: reward.coins, totalXp, stamps: earned };
}
