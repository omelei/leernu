import { describe, expect, it } from 'vitest';
import {
  BADGES,
  COINS_PERFECT_ROUND,
  levelFor,
  levelProgress,
  newBadges,
  rewardForRound,
  xpForLevel,
  XP_COMBO_BONUS,
  XP_PER_CORRECT,
  type RewardSnapshot,
} from './rewards';

const snapshot = (over: Partial<RewardSnapshot> = {}): RewardSnapshot => ({
  setId: 'nl-provincies',
  perfectRound: false,
  completeRound: true,
  streakDays: 1,
  mastered: 0,
  setSize: 12,
  roundsFinished: 1,
  mode: 'wijs-aan',
  correct: 0,
  ...over,
});

describe('the badges the challenge modes earn', () => {
  it('gives bliksem-tien for ten right inside the minute, in that mode only', () => {
    expect(newBadges(snapshot({ mode: 'bliksemronde', correct: 10 }), new Set())).toContain(
      'bliksem-tien',
    );
    expect(newBadges(snapshot({ mode: 'bliksemronde', correct: 9 }), new Set())).not.toContain(
      'bliksem-tien',
    );
    // The same ten right in an untimed round is not the same achievement.
    expect(newBadges(snapshot({ mode: 'wijs-aan', correct: 40 }), new Set())).not.toContain(
      'bliksem-tien',
    );
  });

  it('allows two mistakes on the way to overleven-vijftien', () => {
    // Fifteen right on three lives: not a perfect round, and deliberately not.
    const survived = snapshot({ mode: 'overleven', correct: 15, perfectRound: false });
    expect(newBadges(survived, new Set())).toContain('overleven-vijftien');
  });
});

describe('levels', () => {
  it('starts everyone at one', () => {
    expect(levelFor(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
  });

  /**
   * The first level costs 150 and every one after it a hundred more than the
   * last, so the totals run 150, 400, 750. A perfect round of fifteen is 205 XP:
   * the first level lands at the end of a good round rather than halfway
   * through one, which is the whole reason the first step is not 100.
   */
  it('asks a whole round for the first level, then a hundred more each time', () => {
    expect(xpForLevel(2)).toBe(150);
    expect(xpForLevel(3)).toBe(400);
    expect(xpForLevel(4)).toBe(750);
  });

  it('levels up exactly on the threshold, not a point later', () => {
    expect(levelFor(149)).toBe(1);
    expect(levelFor(150)).toBe(2);
    expect(levelFor(399)).toBe(2);
    expect(levelFor(400)).toBe(3);
  });

  it('reports progress through the current level', () => {
    expect(levelProgress(150)).toBe(0);
    // Level two spans 150 to 400, so halfway is 275.
    expect(levelProgress(275)).toBeCloseTo(0.5, 6);
    expect(levelProgress(399)).toBeCloseTo(0.996, 3);
  });

  it('never goes backwards as xp rises', () => {
    let previous = 0;
    for (let xp = 0; xp < 5000; xp += 37) {
      const level = levelFor(xp);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe('rewardForRound', () => {
  it('pays per correct answer', () => {
    expect(rewardForRound({ correct: 8, answered: 12, comboAnswers: 0 }).xp).toBe(
      8 * XP_PER_CORRECT,
    );
  });

  it('pays a bonus for answers inside a run', () => {
    const reward = rewardForRound({ correct: 10, answered: 12, comboAnswers: 6 });
    expect(reward.xp).toBe(10 * XP_PER_CORRECT + 6 * XP_COMBO_BONUS);
  });

  it('adds coins for a perfect round', () => {
    const perfect = rewardForRound({ correct: 12, answered: 12, comboAnswers: 0 });
    const nearly = rewardForRound({ correct: 11, answered: 12, comboAnswers: 0 });

    expect(perfect.coins - nearly.coins).toBe(COINS_PERFECT_ROUND + 1);
  });

  it('pays nothing for a round with no answers', () => {
    expect(rewardForRound({ correct: 0, answered: 0, comboAnswers: 0 })).toEqual({
      xp: 0,
      coins: 0,
    });
  });
});

describe('badges', () => {
  it('gives the first one for finishing anything', () => {
    expect(newBadges(snapshot(), new Set())).toContain('eerste-ronde');
  });

  it('does not give the same badge twice', () => {
    expect(newBadges(snapshot(), new Set(['eerste-ronde']))).not.toContain('eerste-ronde');
  });

  /**
   * The rule that stops the badge teaching the wrong lesson. Without
   * `completeRound`, the surest way to a perfect score is to stop after one
   * right answer — which would make quitting while ahead the winning move.
   */
  it('refuses a perfect score from a round that was cut short', () => {
    const cutShort = snapshot({ perfectRound: true, completeRound: false });
    expect(newBadges(cutShort, new Set())).not.toContain('provincies-foutloos');

    const finished = snapshot({ perfectRound: true, completeRound: true });
    expect(newBadges(finished, new Set())).toContain('provincies-foutloos');
  });

  it('gives each set its own perfect-round badge', () => {
    const islands = snapshot({
      setId: 'nl-waddeneilanden',
      perfectRound: true,
      setSize: 5,
    });
    const earned = newBadges(islands, new Set());

    expect(earned).toContain('eilanden-foutloos');
    expect(earned).not.toContain('provincies-foutloos');
  });

  it('gives the week badge at seven days and not before', () => {
    expect(newBadges(snapshot({ streakDays: 6 }), new Set())).not.toContain('week-op-rij');
    expect(newBadges(snapshot({ streakDays: 7 }), new Set())).toContain('week-op-rij');
  });

  it('gives the mastery badge only when the whole set is in the last box', () => {
    expect(newBadges(snapshot({ mastered: 11, setSize: 12 }), new Set())).not.toContain('set-vast');
    expect(newBadges(snapshot({ mastered: 12, setSize: 12 }), new Set())).toContain('set-vast');
  });

  it('never awards mastery for an empty set', () => {
    expect(newBadges(snapshot({ mastered: 0, setSize: 0 }), new Set())).not.toContain('set-vast');
  });

  // Spec §12: every reward must be reachable by practising and by nothing else.
  it('has a criterion for every badge and no duplicates', () => {
    const ids = BADGES.map((badge) => badge.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const badge of BADGES) {
      expect(typeof badge.criterion, badge.id).toBe('function');
    }
  });
});
