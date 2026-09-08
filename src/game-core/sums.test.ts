import { describe, expect, it } from 'vitest';
import { judgeSum, sumDistractors, sumText, type SumItem, type SumOp } from './sums';

const som = (op: SumOp, links: number, rechts: number, antwoord: number): SumItem => ({
  id: `${op}-${links}-${rechts}`,
  op,
  links,
  rechts,
  antwoord,
});

const keer = (table: number, by: number) => som('keer', table, by, table * by);

describe('reading a sum', () => {
  it('uses the signs a schoolbook uses', () => {
    // Not the letter x, not an asterisk, not a hyphen, and not the obelus: a
    // child reads these beside the ones in their book, and the lookalikes are
    // exactly the detail that makes a product feel like nobody was paying
    // attention. Dutch primary school divides with a colon.
    expect(sumText(keer(7, 8))).toBe('7 × 8');
    expect(sumText(som('delen', 56, 7, 8))).toBe('56 : 7');
    expect(sumText(som('plus', 8, 7, 15))).toBe('8 + 7');
    expect(sumText(som('min', 15, 8, 7))).toBe('15 − 8');
  });
});

describe('judging an answer', () => {
  it('accepts the number', () => {
    expect(judgeSum('56', keer(7, 8))).toBe(true);
  });

  it('forgives the keyboard, not the table', () => {
    // A stray space or a newline is the phone, not the child.
    expect(judgeSum('  56 ', keer(7, 8))).toBe(true);
    expect(judgeSum('5 6', keer(7, 8))).toBe(true);
    expect(judgeSum('54', keer(7, 8))).toBe(false);
  });

  it('treats anything that is not a number as wrong, not as an error', () => {
    // The screen asked for a number. Throwing here would end the round.
    for (const typed of ['', '   ', 'zesenvijftig', '56a', '5.6', '5,6', '+56']) {
      expect(judgeSum(typed, keer(7, 8)), typed).toBe(false);
    }
  });
});

describe('the wrong answers', () => {
  it('offers three of them, all different and none of them right', () => {
    for (let table = 1; table <= 12; table++) {
      for (let by = 1; by <= 10; by++) {
        const sum = keer(table, by);
        const wrong = sumDistractors(sum);

        expect(wrong, sum.id).toHaveLength(3);
        expect(new Set(wrong).size, sum.id).toBe(3);
        expect(wrong, sum.id).not.toContain(sum.antwoord);
      }
    }
  });

  it('never offers zero or a negative, whatever the operation', () => {
    const sommen = [
      keer(1, 1),
      som('delen', 3, 3, 1),
      som('plus', 1, 1, 2),
      som('min', 10, 9, 1),
      som('min', 11, 9, 2),
    ];

    for (const sum of sommen) {
      for (const wrong of sumDistractors(sum)) {
        expect(wrong, `${sumText(sum)} → ${wrong}`).toBeGreaterThan(0);
      }
    }
  });

  it('leads with the row above and the row below, for a table', () => {
    // The mistake a child actually makes is one step along the table, not a
    // number from somewhere else entirely.
    const wrong = sumDistractors(keer(7, 8));
    expect(wrong).toContain(49);
    expect(wrong).toContain(63);
  });

  it('leads with a forgotten carry, for plus and minus', () => {
    // Ten out is the mistake of the whole operation. Nothing here is ten out
    // for a division: nobody divides and lands a decade away.
    expect(sumDistractors(som('plus', 34, 9, 43))).toContain(53);
    expect(sumDistractors(som('min', 84, 7, 77))).toContain(67);
    expect(sumDistractors(som('delen', 56, 7, 8))).toEqual([9, 7, 10]);
  });
});
