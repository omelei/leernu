/**
 * XP, levels, coins and badges.
 *
 * Spec §4.5 is unusually specific about what this may not be: no lootboxes, no
 * chance mechanics, no real money, nothing that can be bought rather than
 * earned. The audience is ten years old. Since ADR-096 one of those is revised
 * by the owner, knowingly and in one place: which hero is in a chest is chance.
 * Whether there is a chest, and what it costs, is not — see `helden.ts`.
 *
 * Everything in this file is still deterministic and explainable. A child who asks
 * "waarom kreeg ik dat?" gets a sentence, not a shrug — which also happens to be
 * the only way a teacher can defend the numbers to a parent.
 *
 * Coins are a separate currency from XP on purpose. XP measures how much work
 * you have done and only ever rises; coins are spent on an avatar and go down
 * again. Merging them would mean a child who buys a hat loses their level.
 */

export const XP_PER_CORRECT = 10;
/** Extra per answer once five in a row are right. Spec §4.1 asks for the combo. */
export const XP_COMBO_BONUS = 5;
export const COMBO_THRESHOLD = 5;
export const COINS_PER_CORRECT = 1;
export const COINS_PERFECT_ROUND = 5;

/**
 * The ladder runs on correct answers, not on XP (ADR-070).
 *
 * It ran on XP for one release, and the card that showed it had to translate
 * back — "nog 6 goede antwoorden" was a division by ten with a combo bonus
 * quietly making it wrong by one now and then. A level is a promise about work
 * a child can count themselves, so it is counted in the thing they count:
 * questions they got right, over everything they have ever practised.
 *
 * XP and coins are untouched and still earned on every round. They are for the
 * avatar shop that does not exist yet (spec §4.5), and merging them into this
 * would have meant a child who spends coins losing their level.
 *
 * **25, 50, 100, 200, and 200 from there on.** Doubling three times and then
 * settling, which is the shape a child can be told out loud: the first one is a
 * few days, the fourth is a few weeks, and none of them is ever out of reach.
 * Pure doubling would have put level 10 at nearly thirteen thousand answers —
 * three years at ten a day — and a rung nobody can reach is not a rung.
 */
export const LEVEL_STEPS: readonly number[] = [25, 50, 100, 200];
/** What every step past the fourth costs. */
export const LEVEL_STEP = 200;

/** What one step from `level` to the next costs. */
export function stepToLevel(level: number): number {
  return LEVEL_STEPS[level - 1] ?? LEVEL_STEP;
}

/** Correct answers needed in total to stand on `level`. */
export function correctForLevel(level: number): number {
  let total = 0;
  for (let at = 1; at < level; at++) total += stepToLevel(at);
  return total;
}

export function levelFor(correct: number): number {
  let level = 1;
  while (correctForLevel(level + 1) <= correct) level++;
  return level;
}

/** How much of the current level is done, 0 to 1. Drives a progress bar. */
export function levelProgress(correct: number): number {
  const level = levelFor(correct);
  const start = correctForLevel(level);
  const next = correctForLevel(level + 1);
  if (next === start) return 1;
  return (correct - start) / (next - start);
}

/**
 * How many more correct answers there are between here and the next level.
 *
 * The one number on the front door written in what a child actually does. It is
 * now a subtraction rather than a conversion, which is the whole reason the
 * ladder moved off XP: what the card says and what the ladder counts are the
 * same thing (ADR-070).
 */
export function correctToNextLevel(correct: number): number {
  return Math.max(1, correctForLevel(levelFor(correct) + 1) - correct);
}

export interface RoundReward {
  readonly xp: number;
  readonly coins: number;
}

/**
 * What one round is worth.
 *
 * `comboAnswers` is how many of the correct answers landed while five or more
 * were already right in a row. Counted rather than multiplied: a multiplier on
 * a whole round rewards a lucky start, while counting rewards the run itself.
 */
export function rewardForRound(params: {
  readonly correct: number;
  readonly answered: number;
  readonly comboAnswers: number;
}): RoundReward {
  const perfect = params.answered > 0 && params.correct === params.answered;

  return {
    xp: params.correct * XP_PER_CORRECT + params.comboAnswers * XP_COMBO_BONUS,
    coins: params.correct * COINS_PER_CORRECT + (perfect ? COINS_PERFECT_ROUND : 0),
  };
}

// ---------------------------------------------------------------------------

export type StampId =
  | 'provincies-foutloos'
  | 'hoofdsteden-foutloos'
  | 'eilanden-foutloos'
  | 'week-op-rij'
  | 'set-onthouden'
  | 'wateren-foutloos'
  | 'steden-foutloos'
  | 'tafel-foutloos'
  | 'bliksem-tien'
  | 'overleven-vijftien';

/** What the badge rules get to look at. Nothing else is in scope. */
export interface RewardSnapshot {
  readonly setId: string;
  /** Every answer in the round just finished was right. */
  readonly perfectRound: boolean;
  /** The round covered the whole set, not a session stopped early. */
  readonly completeRound: boolean;
  readonly streakDays: number;
  /** Items at box five in the set just practised, and how many there are. */
  readonly mastered: number;
  readonly setSize: number;
  readonly roundsFinished: number;
  /** Which mode was played. A timed round and a survival round earn their own. */
  readonly mode: string;
  /** Correct answers in the round. The endless modes have no "complete" to hit. */
  readonly correct: number;
}

export interface StampDefinition {
  readonly id: StampId;
  /** Stated in one sentence, because a stamp nobody can explain is a mystery. */
  readonly criterion: (snapshot: RewardSnapshot) => boolean;
}

/**
 * Every stamp is earned by practising and by nothing else. There is no path
 * here that money, luck or waiting could take.
 *
 * And none of them is earned by taking part. "Op weg", for finishing a first
 * round, was exactly that and is gone (ADR-040): a reward for turning up tells
 * a child the turning up was the achievement, which is the opposite of what
 * this product is for.
 */
export const STAMPS: readonly StampDefinition[] = [
  {
    // Perfect *and* complete: twelve of twelve, not eight of eight after
    // stopping early. Otherwise the surest route to a badge is to quit while
    // ahead, which is the opposite of what it should teach.
    id: 'provincies-foutloos',
    criterion: (s) => s.setId === 'nl-provincies' && s.perfectRound && s.completeRound,
  },
  {
    id: 'hoofdsteden-foutloos',
    criterion: (s) => s.setId === 'nl-hoofdsteden' && s.perfectRound && s.completeRound,
  },
  {
    id: 'eilanden-foutloos',
    criterion: (s) => s.setId === 'nl-waddeneilanden' && s.perfectRound && s.completeRound,
  },
  {
    id: 'wateren-foutloos',
    criterion: (s) => s.setId === 'nl-wateren' && s.perfectRound && s.completeRound,
  },
  {
    // Eighty cities are never one round, so "complete" cannot mean the set here.
    // A flawless round of fifteen out of eighty is the hardest thing the app
    // asks, and it should be worth something.
    id: 'steden-foutloos',
    criterion: (s) => s.setId === 'nl-steden' && s.perfectRound && s.completeRound,
  },
  {
    // A whole table, every sum right, in one round. One stamp for the twelve
    // rather than twelve stamps: a collection with a dozen near-identical
    // entries in it says the tables are twelve achievements, and they are one
    // skill met twelve times.
    id: 'tafel-foutloos',
    criterion: (s) => s.setId.startsWith('tafel-') && s.perfectRound && s.completeRound,
  },
  {
    // Ten right inside a minute. Reachable on any set, so a child who loves the
    // islands is not shut out of it by having picked a small set.
    id: 'bliksem-tien',
    criterion: (s) => s.mode === 'bliksemronde' && s.correct >= 10,
  },
  {
    // Fifteen right on three lives. Not "never wrong" — two mistakes are
    // allowed, because a badge you lose to one slip teaches caution, not
    // knowledge.
    id: 'overleven-vijftien',
    criterion: (s) => s.mode === 'overleven' && s.correct >= 15,
  },
  {
    id: 'week-op-rij',
    criterion: (s) => s.streakDays >= 7,
  },
  {
    // Every item in the set at box five — which is four correct answers in a
    // row each, and so takes weeks of coming back rather than one lucky round.
    // This is the stamp the others are shaped after.
    id: 'set-onthouden',
    criterion: (s) => s.setSize > 0 && s.mastered === s.setSize,
  },
];

/**
 * Stamps newly earned by this round: satisfied now and not already held.
 *
 * Returns only what is new, so the result screen can name a stamp without
 * checking a list of everything a child already had.
 */
export function newStamps(snapshot: RewardSnapshot, alreadyHeld: ReadonlySet<string>): StampId[] {
  return STAMPS.filter((stamp) => !alreadyHeld.has(stamp.id) && stamp.criterion(snapshot)).map(
    (stamp) => stamp.id,
  );
}

// ---------------------------------------------------------------------------

/**
 * The tafeldiploma: ten sums of one table, all of them right, in one attempt.
 *
 * Not in `STAMPS`, and the reason is the shape of that list rather than of this
 * reward. A stamp is one of ten named things with a criterion each; a diploma
 * is twelve of the same thing, one per table, and writing twelve near-identical
 * entries into a list whose own comment argues against exactly that would be a
 * poor way to keep it honest.
 *
 * It is stored beside the stamps, in the same object store and under an id of
 * the same shape, so nothing about the storage had to move to hold it.
 */
export function diplomaFor(snapshot: RewardSnapshot): string | null {
  if (snapshot.mode !== 'tafeldiploma') return null;
  if (!/^tafel-\d+$/.test(snapshot.setId)) return null;
  if (!snapshot.perfectRound || !snapshot.completeRound) return null;
  return `diploma-${snapshot.setId}`;
}

/** Which table a stored diploma is for, or null if the row is not one. */
export function tableOfDiploma(id: string): number | null {
  const match = /^diploma-tafel-(\d+)$/.exec(id);
  if (!match) return null;
  const tafel = Number(match[1]);
  return tafel >= 1 && tafel <= 12 ? tafel : null;
}
