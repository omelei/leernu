import { newBadges, rewardForRound, type BadgeId, type RewardSnapshot } from '@/game-core';
import { getDb, SINGLETON_KEY } from './db';

/**
 * XP, coins and badges, on the device.
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
  readonly badges: readonly BadgeId[];
}

export async function loadBadges(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAll('badges');
  return new Set(rows.map((row) => row.badgeId));
}

/**
 * Applies a finished round: adds what was earned, awards any badge the round
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

  const profile = await db.get('profile', SINGLETON_KEY);
  const totalXp = (profile?.xp ?? 0) + reward.xp;

  if (profile) {
    await db.put('profile', {
      ...profile,
      xp: totalXp,
      munten: profile.munten + reward.coins,
    });
  }

  const held = await loadBadges();
  const earned = newBadges(params.snapshot, held);
  const behaaldOp = new Date().toISOString();
  for (const badgeId of earned) {
    await db.put('badges', { badgeId, behaaldOp });
  }

  return { xp: reward.xp, coins: reward.coins, totalXp, badges: earned };
}
