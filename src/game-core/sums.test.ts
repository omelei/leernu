import { describe, expect, it } from 'vitest';
import { judgeSum, sumDistractors, sumText, type SumItem } from './sums';

const som = (table: number, by: number): SumItem => ({
  id: `tafel-${table}x${by}`,
  table,
  by,
  antwoord: table * by,
});

describe('reading a sum', () => {
  it('uses the multiplication sign a schoolbook uses', () => {
    // Not the letter x and not an asterisk. A child reads this beside the one
    // in their book, and the two lookalikes are exactly the detail that makes
    // a product feel like nobody was paying attention.
    expect(sumText(som(7, 8))).toBe('7 × 8');
  });
});

describe('judging an answer', () => {
  it('accepts the number', () => {
    expect(judgeSum('56', som(7, 8))).toBe(true);
  });

  it('forgives the keyboard, not the table', () => {
    // A stray space or a newline is the phone, not the child.
    expect(judgeSum('  56 ', som(7, 8))).toBe(true);
    expect(judgeSum('5 6', som(7, 8))).toBe(true);
    expect(judgeSum('54', som(7, 8))).toBe(false);
  });

  it('treats anything that is not a number as wrong, not as an error', () => {
    // The screen asked for a number. Throwing here would end the round.
    for (const typed of ['', '   ', 'zesenvijftig', '56a', '5.6', '5,6', '+56']) {
      expect(judgeSum(typed, som(7, 8)), typed).toBe(false);
    }
  });
});

describe('the wrong answers', () => {
  it('offers three of them, all different and none of them right', () => {
    for (let table = 1; table <= 12; table++) {
      for (let by = 1; by <= 10; by++) {
        const sum = som(table, by);
        const wrong = sumDistractors(sum);

        expect(wrong, sum.id).toHaveLength(3);
        expect(new Set(wrong).size, sum.id).toBe(3);
        expect(wrong, sum.id).not.toContain(sum.antwoord);
      }
    }
  });

  it('never offers zero or a negative, which no table produces', () => {
    for (let table = 1; table <= 12; table++) {
      for (let by = 1; by <= 10; by++) {
        for (const wrong of sumDistractors(som(table, by))) {
          expect(wrong, `${table} × ${by}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('leads with the row above and the row below', () => {
    // The mistake a child actually makes is one step along the table, not a
    // number from somewhere else entirely.
    const wrong = sumDistractors(som(7, 8));
    expect(wrong).toContain(49);
    expect(wrong).toContain(63);
  });
});
