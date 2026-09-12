import {
  diplomaFor,
  newStamps,
  rewardForRound,
  sterrenInKist,
  sterrenVoor,
  tableOfDiploma,
  vlagDiplomaFor,
  werelddeelVanDiploma,
  type DiplomaWerelddeel,
  type RewardSnapshot,
  type StampId,
} from '@/game-core';
import { getDb } from './db';
import { activeChildId, ensureProgressPerChild } from './children';
import { kistenOpenstaand } from './heldenStore';
import { loadAccuracy } from './progress';

/**
 * XP, coins, travel stamps, stars and chests, on the device.
 *
 * The object store is still called `badges` and its key is still `badgeId`.
 * That is the one thing here that does not follow the rename: the storage holds
 * what children have already earned, and a schema rename to tidy up a word
 * would be a migration risking real rows for no gain a child can see.
 *
 * Nothing here can be bought, granted by waiting, or decided by chance, and
 * every one of these is reachable only by practising. ADR-096 made which hero
 * is in a chest a draw; ADR-097 takes it back out, so there is no random number
 * anywhere in this path — see `game-core/helden.ts`.
 */

export interface RoundOutcome {
  readonly xp: number;
  readonly coins: number;
  readonly totalXp: number;
  readonly stamps: readonly StampId[];
  /** The table this round earned a diploma for, or null. */
  readonly diploma: number | null;
  /** The werelddeel this round earned a vlaggendiploma for, or null (ADR-104). */
  readonly vlagDiploma: DiplomaWerelddeel | null;
  /**
   * The stars this round added, and how many of the next chest's five are there
   * now. Worked out from the count of correct answers either side of the round,
   * which cannot drift from the count the rest of the product shows.
   */
  readonly sterren: { readonly erbij: number; readonly inKist: number };
  /**
   * Chests this round paid for that nobody has chosen from yet. Almost always
   * none; one when the round crossed a fifty.
   *
   * A count rather than a list of what came out, because since ADR-097 nothing
   * comes out until the child picks one of three — and that happens on the
   * screen this number is handed to, not before it is drawn.
   */
  readonly kistenTeGoed: number;
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

/** The werelddelen this child has a vlaggendiploma for, from the same store. */
export async function loadVlagDiplomas(): Promise<Set<DiplomaWerelddeel>> {
  const held = await loadStamps();
  const delen = new Set<DiplomaWerelddeel>();
  for (const id of held) {
    const deel = werelddeelVanDiploma(id);
    if (deel !== null) delen.add(deel);
  }
  return delen;
}

/**
 * Applies a finished round: adds what was earned, awards any stamp the round
 * newly satisfies, and reports all of it — including any chest the round paid
 * for — so the result screen can say so and lay the chest out.
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
  // And the vlaggendiploma, beside it and in the same store (ADR-104).
  const vlagDiplomaId = vlagDiplomaFor(params.snapshot);
  if (vlagDiplomaId !== null) {
    await db.put('kindBadges', { kindId, badgeId: vlagDiplomaId, behaaldOp });
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
    vlagDiploma: vlagDiplomaId === null ? null : werelddeelVanDiploma(vlagDiplomaId),
    sterren: { erbij: sterrenVoor(na) - sterrenVoor(voor), inKist: sterrenInKist(na) },
    kistenTeGoed: await kistenOpenstaand(),
  };
}
