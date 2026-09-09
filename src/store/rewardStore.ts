import {
  diplomaFor,
  levelFor,
  newStamps,
  nieuwePlekken,
  rewardForRound,
  tableOfDiploma,
  type Plek,
  type RewardSnapshot,
  type StampId,
} from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';
import { loadAccuracy } from './progress';

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
  /** The table this round earned a diploma for, or null. */
  readonly diploma: number | null;
  /**
   * The animals this round pushed over the line, in the order they arrive.
   *
   * Almost always empty. When it is not, it is the one thing on the result
   * screen a child cannot have seen coming — the collection hides what is
   * inside a parcel until it is opened (ADR-081), and this is the opening.
   */
  readonly dieren: readonly Plek[];
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
 * rather than by a second store. A row that is not a diploma is not one — which
 * is also what keeps a stamp id and a diploma id from ever having to agree.
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

  // The diploma, if this round was one and it was flawless. Reported even when
  // the child already had it: a child who sits the test again and passes again
  // has passed again, and a screen that said nothing would read as a failure.
  const diplomaId = diplomaFor(params.snapshot);
  if (diplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: diplomaId, behaaldOp });
  }

  return {
    xp: reward.xp,
    coins: reward.coins,
    totalXp,
    stamps: earned,
    diploma: diplomaId === null ? null : tableOfDiploma(diplomaId),
    dieren: await dierenVanDezeRonde(params.correct),
  };
}

/**
 * Which animals this round earned, worked out from the ladder either side of it.
 *
 * The ladder runs on correct answers over everything ever (ADR-070), and every
 * one of this round's answers is already written by the time a round finishes.
 * So the total afterwards is read from the store and the round's own correct
 * count is subtracted back off it to get the total before — which is exact
 * however many rounds were played today, and cannot drift from the number the
 * column on the right shows, because it is that number.
 */
async function dierenVanDezeRonde(correct: number): Promise<readonly Plek[]> {
  if (correct === 0) return [];

  const na = (await loadAccuracy()).correct;
  const voor = Math.max(0, na - correct);
  return nieuwePlekken(levelFor(voor), levelFor(na));
}
