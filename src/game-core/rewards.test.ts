import { describe, expect, it } from 'vitest';
import {
  STAMPS,
  COINS_PERFECT_ROUND,
  levelFor,
  levelProgress,
  newStamps,
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

describe('the stamps the challenge modes earn', () => {
  it('gives bliksem-tien for ten right inside the minute, in that mode only', () => {
    expect(newStamps(snapshot({ mode: 'bliksemronde', correct: 10 }), new Set())).toContain(
      'bliksem-tien',
    );
    expect(newStamps(snapshot({ mode: 'bliksemronde', correct: 9 }), new Set())).not.toContain(
      'bliksem-tien',
    );
    // The same ten right in an untimed round is not the same achievement.
    expect(newStamps(snapshot({ mode: 'wijs-aan', correct: 40 }), new Set())).not.toContain(
      'bliksem-tien',
    );
  });

  it('allows two mistakes on the way to overleven-vijftien', () => {
    // Fifteen right on three lives: not a perfect round, and deliberately not.
    const survived = snapshot({ mode: 'overleven', correct: 15, perfectRound: false });
    expect(newStamps(survived, new Set())).toContain('overleven-vijftien');
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

describe('stamps', () => {
  /**
   * ADR-040. "Op weg", for finishing a first round, used to be the first thing
   * a child earned, and it was earned by taking part. A reward for turning up
   * tells a child the turning up was the achievement.
   */
  it('gives nothing at all for merely finishing a round', () => {
    expect(newStamps(snapshot(), new Set())).toEqual([]);
  });

  it('does not give the same stamp twice', () => {
    const perfect = snapshot({ perfectRound: true });
    expect(newStamps(perfect, new Set())).toContain('provincies-foutloos');
    expect(newStamps(perfect, new Set(['provincies-foutloos']))).not.toContain(
      'provincies-foutloos',
    );
  });

  /**
   * The rule that stops the stamp teaching the wrong lesson. Without
   * `completeRound`, the surest way to a perfect score is to stop after one
   * right answer — which would make quitting while ahead the winning move.
   */
  it('refuses a perfect score from a round that was cut short', () => {
    const cutShort = snapshot({ perfectRound: true, completeRound: false });
    expect(newStamps(cutShort, new Set())).not.toContain('provincies-foutloos');

    const finished = snapshot({ perfectRound: true, completeRound: true });
    expect(newStamps(finished, new Set())).toContain('provincies-foutloos');
  });

  it('gives each set its own perfect-round stamp', () => {
    const islands = snapshot({
      setId: 'nl-waddeneilanden',
      perfectRound: true,
      setSize: 5,
    });
    const earned = newStamps(islands, new Set());

    expect(earned).toContain('eilanden-foutloos');
    expect(earned).not.toContain('provincies-foutloos');
  });

  it('gives one stamp for a flawless table, whichever table it was', () => {
    // One stamp for the twelve, not twelve nearly identical ones: the tables
    // are one skill met twelve times.
    const zeven = snapshot({ setId: 'tafel-7', perfectRound: true, completeRound: true });
    const twaalf = snapshot({ setId: 'tafel-12', perfectRound: true, completeRound: true });

    expect(newStamps(zeven, new Set())).toContain('tafel-foutloos');
    expect(newStamps(twaalf, new Set())).toContain('tafel-foutloos');

    // And it is not earned by stopping while ahead.
    const gestopt = snapshot({ setId: 'tafel-7', perfectRound: true, completeRound: false });
    expect(newStamps(gestopt, new Set())).not.toContain('tafel-foutloos');
  });

  it('gives the week stamp at seven days and not before', () => {
    expect(newStamps(snapshot({ streakDays: 6 }), new Set())).not.toContain('week-op-rij');
    expect(newStamps(snapshot({ streakDays: 7 }), new Set())).toContain('week-op-rij');
  });

  it('gives the retention stamp only when the whole set is in the last box', () => {
    expect(newStamps(snapshot({ mastered: 11, setSize: 12 }), new Set())).not.toContain(
      'set-onthouden',
    );
    expect(newStamps(snapshot({ mastered: 12, setSize: 12 }), new Set())).toContain(
      'set-onthouden',
    );
  });

  it('never awards mastery for an empty set', () => {
    expect(newStamps(snapshot({ mastered: 0, setSize: 0 }), new Set())).not.toContain(
      'set-onthouden',
    );
  });

  // Spec §12: every reward must be reachable by practising and by nothing else.
  it('has a criterion for every stamp and no duplicates', () => {
    const ids = STAMPS.map((stamp) => stamp.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const stamp of STAMPS) {
      expect(typeof stamp.criterion, stamp.id).toBe('function');
    }
  });
});
