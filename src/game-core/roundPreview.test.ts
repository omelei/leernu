import { describe, expect, it } from 'vitest';
import { roundPreview } from './leitner';
import type { ItemState } from './types';

/**
 * K1 opens with a sentence that argues for spaced repetition by saying the
 * uncomfortable part out loud: "Vandaag oefen je 10 vragen. Zeven daarvan heb
 * je eerder gehad. Dat is de bedoeling."
 *
 * It is the one number on that screen a child could read as a mistake, so it
 * has to be exactly right — and it has to be right before the round is dealt,
 * which is why it counts the pools rather than composing a round and looking.
 */

const DAY = 86_400_000;
const now = new Date('2026-09-08T10:00:00Z');
const at = (days: number) => new Date(now.getTime() + days * DAY).toISOString();

const items = Array.from({ length: 20 }, (_, n) => ({ id: `i${n}` }));

function states(due: number, known: number): Map<string, ItemState> {
  const map = new Map<string, ItemState>();
  let n = 0;

  const row = (id: string, box: 2 | 4, next: number): ItemState => ({
    itemId: id,
    box,
    laatsteReview: at(-5),
    volgendeReview: at(next),
    goedCount: 1,
    foutCount: 0,
  });

  for (let i = 0; i < due; i++, n++) map.set(`i${n}`, row(`i${n}`, 2, -1));
  for (let i = 0; i < known; i++, n++) map.set(`i${n}`, row(`i${n}`, 4, 7));
  return map;
}

describe('the preview of the next round', () => {
  it('counts a round of due work as work seen before', () => {
    // Nothing unseen left, so the unseen share has nothing to draw from and
    // composeRound fills it from the other pools. All ten are repeats.
    const preview = roundPreview({ items, states: states(15, 5), size: 10, now });
    expect(preview).toEqual({ total: 10, seen: 10 });
  });

  it('is the K1 sentence when there is both due work and new material', () => {
    const preview = roundPreview({ items, states: states(15, 0), size: 10, now });
    expect(preview).toEqual({ total: 10, seen: 8 });
  });

  it('tells a child who has never practised that none of it is a repeat', () => {
    // A "seven of these you have had before" on a first round would be the
    // exact lie this sentence exists to avoid.
    expect(roundPreview({ items, states: new Map(), size: 10, now })).toEqual({
      total: 10,
      seen: 0,
    });
  });

  it('never promises more questions than the set has', () => {
    const preview = roundPreview({ items: items.slice(0, 6), states: new Map(), size: 10, now });
    expect(preview.total).toBe(6);
  });

  it('never counts more repeats than there are questions', () => {
    for (const due of [0, 1, 5, 12, 20]) {
      for (const known of [0, 3, 8]) {
        const preview = roundPreview({ items, states: states(due, known), size: 10, now });
        expect(preview.seen, `due ${due}, known ${known}`).toBeLessThanOrEqual(preview.total);
        expect(preview.seen, `due ${due}, known ${known}`).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
