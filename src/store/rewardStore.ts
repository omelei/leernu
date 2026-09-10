import {
  diplomaFor,
  newStamps,
  rewardForRound,
  sterrenInKist,
  sterrenVoor,
  tableOfDiploma,
  type KistUitkomst,
  type RewardSnapshot,
  type StampId,
} from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';
import { openKisten } from './heldenStore';
import { loadAccuracy } from './progress';

/**
 * XP, coins, travel stamps, stars and chests, on the device.
 *
 * The object store is still called `badges` and its key is still `badgeId`.
 * That is the one thing here that does not follow the rename: the storage holds
 * what children have already earned, and a schema rename to tidy up a word
 * would be a migration risking real rows for no gain a child can see.
 *
 * Nothing here can be bought or granted by waiting, and every one of these is
 * reachable only by practising. One thing is chance, since ADR-096 and on the
 * owner's decision: which hero is in a chest. Whether there is a chest, and what
 * it costs, is not — see `game-core/helden.ts` and `heldenStore.ts`.
 */

export interface RoundOutcome {
  readonly xp: number;
  readonly coins: number;
  readonly totalXp: number;
  readonly stamps: readonly StampId[];
  /** The table this round earned a diploma for, or null. */
  readonly diploma: number | null;
  /**
   * The stars this round added, and how many of the next chest's five are there
   * now. Worked out from the count of correct answers either side of the round,
   * which cannot drift from the count the rest of the product shows.
   */
  readonly sterren: { readonly erbij: number; readonly inKist: number };
  /**
   * The chests this round opened, in the order they opened. Almost always
   * none; one when the round crossed a fifty.
   */
  readonly kisten: readonly KistUitkomst[];
}

export async function loadStamps(): Promise<Set<string>> {
  await ensureProgressPerChild();

  const db = await getDb();
  const kindId = await activeChildId();
  const rows = await db.getAll('kindBadges', IDBKeyRange.bound([kindId], [kindId, []]));
  return new Set(rows.map((row) => row.badgeId));
}

/**
 * The tables this child has a diploma for.
 *
 * Read from the same store the stamps are in, filtered by the shape of the id
 * rather than by a second store.
 */
export async function loadDiplomas(): Promise<Set<number>> {
  const held = await loadStamps();
  const tafels = new Set<number>();
  for (const id of held) {
    const tafel = tableOfDiploma(id);
    if (tafel !== null) tafels.add(tafel);
  }
  return tafels;
}

/**
 * Applies a finished round: adds what was earned, awards any stamp the round
 * newly satisfies, opens any chest it paid for, and reports all of it so the
 * result screen can say so.
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

  // The diploma, if this round was one and it was flawless. Reported even when
  // the child already had it: a child who sits the test again and passes again
  // has passed again.
  const diplomaId = diplomaFor(params.snapshot);
  if (diplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: diplomaId, behaaldOp });
  }

  // Every one of this round's answers is already written by now, so the total
  // afterwards is read from the store and the round's own count subtracted
  // back off it for the total before.
  const na = (await loadAccuracy()).correct;
  const voor = Math.max(0, na - params.correct);

  return {
    xp: reward.xp,
    coins: reward.coins,
    totalXp,
    stamps: earned,
    diploma: diplomaId === null ? null : tableOfDiploma(diplomaId),
    sterren: { erbij: sterrenVoor(na) - sterrenVoor(voor), inKist: sterrenInKist(na) },
    kisten: params.correct > 0 ? await openKisten() : [],
  };
}
