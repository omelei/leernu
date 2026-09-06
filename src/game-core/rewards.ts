/**
 * XP, levels, coins and badges.
 *
 * Spec §4.5 is unusually specific about what this may not be, and the
 * constraints are the design: no lootboxes, no chance mechanics, no real money,
 * nothing that can be bought rather than earned. The audience is ten years old.
 *
 * Everything here is therefore deterministic and explainable. A child who asks
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
 * Each level costs 100 XP more than the last: 100, then 200, then 300.
 *
 * A curve rather than a constant, so early levels arrive fast and later ones
 * mean something — and simple enough that a child can be told the rule and work
 * out the next one themselves.
 */
export const XP_STEP = 100;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (XP_STEP * (level - 1) * level) / 2;
}

export function levelFor(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** How much of the current level is done, 0 to 1. Drives a progress bar. */
export function levelProgress(xp: number): number {
  const level = levelFor(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next === start) return 1;
  return (xp - start) / (next - start);
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

export type BadgeId =
  | 'eerste-ronde'
  | 'provincies-foutloos'
  | 'hoofdsteden-foutloos'
  | 'eilanden-foutloos'
  | 'week-op-rij'
  | 'set-vast';

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
}

export interface BadgeDefinition {
  readonly id: BadgeId;
  /** Stated in one sentence, because a badge nobody can explain is a mystery. */
  readonly criterion: (snapshot: RewardSnapshot) => boolean;
}

/**
 * Every badge is earned by practising and by nothing else. There is no path
 * here that money, luck or waiting could take.
 */
export const BADGES: readonly BadgeDefinition[] = [
  {
    id: 'eerste-ronde',
    criterion: (s) => s.roundsFinished >= 1,
  },
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
    id: 'week-op-rij',
    criterion: (s) => s.streakDays >= 7,
  },
  {
    // Mastery over a single good day: every item in the set at box five, which
    // takes weeks of coming back rather than one lucky round.
    id: 'set-vast',
    criterion: (s) => s.setSize > 0 && s.mastered === s.setSize,
  },
];

/**
 * Badges newly earned by this round: satisfied now and not already held.
 *
 * Returns only what is new, so the result screen can say "je hebt een badge"
 * without checking a list of everything a child already had.
 */
export function newBadges(snapshot: RewardSnapshot, alreadyHeld: ReadonlySet<string>): BadgeId[] {
  return BADGES.filter((badge) => !alreadyHeld.has(badge.id) && badge.criterion(snapshot)).map(
    (badge) => badge.id,
  );
}
