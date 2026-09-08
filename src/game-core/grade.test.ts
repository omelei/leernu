import { describe, expect, it } from 'vitest';
import { formatGrade, grade } from './grade';

/**
 * The mark on K1, pinned to the formula a Dutch school actually uses.
 *
 * It is on the front door because a child reads it without being taught how.
 * That is also why it is worth a test: a mark that is wrong by a tenth is a
 * mark a child will argue with, and they will be right.
 */
describe('the mark', () => {
  it('runs from 1 to 10 over what was answered', () => {
    expect(grade(0, 10)).toBe(1);
    expect(grade(10, 10)).toBe(10);
    // 1 + 9 × 0,5, which is the pass and not a coincidence.
    expect(grade(5, 10)).toBe(5.5);
  });

  it('marks the questions that were answered, never the ones that were skipped', () => {
    // A round of fifteen, stopped after eight, all eight right. ADR-052 keeps
    // what was answered; counting the seven never seen as wrong would turn
    // stopping into a punishment.
    expect(grade(8, 8)).toBe(10);
  });

  it('has no mark for a round nobody played', () => {
    expect(grade(0, 0)).toBeNull();
  });

  it('never goes outside the scale, whatever it is handed', () => {
    expect(grade(12, 10)).toBe(10);
    expect(grade(-1, 10)).toBe(1);
  });

  it('writes the decimal the Dutch way', () => {
    expect(formatGrade(8.4)).toBe('8,4');
    // A whole mark still carries its decimal: "een 8" and "een 8,0" are the
    // same number and only one of them lines up in a column.
    expect(formatGrade(10)).toBe('10,0');
  });
});
