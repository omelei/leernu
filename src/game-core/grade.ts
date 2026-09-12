/**
 * A Dutch school mark, from what a round actually asked.
 *
 * The formula is the one every Dutch school uses for a test with no guess
 * correction: `1 + 9 × goed/gevraagd`, to one decimal. All right is a 10, none
 * right is a 1, and 5,5 is the pass — a child reads this number without being
 * taught how, which is the whole reason it is on the front door.
 *
 * Deliberately over what was **answered**, not over what the round set out to
 * ask. A round can be stopped early and what was answered is kept (ADR-052);
 * marking the questions a child never saw as wrong would turn stopping into a
 * punishment, and stopping is allowed here.
 *
 * This is not a retention figure and must never be used as one. What a child
 * remembers is `setRetentie` (ADR-107), the number the dot shows and the one
 * this product argues from; a mark is the result of one round.
 */

/** The lowest mark a Dutch report card carries, and what nothing right scores. */
export const GRADE_FLOOR = 1;
/** Everything right. */
export const GRADE_CEILING = 10;

/**
 * @param correct   how many were right
 * @param answered  how many were answered; 0 has no mark at all, and null says
 *                  so rather than dividing by it.
 */
export function grade(correct: number, answered: number): number | null {
  if (answered <= 0) return null;

  const share = Math.min(1, Math.max(0, correct / answered));
  const raw = GRADE_FLOOR + (GRADE_CEILING - GRADE_FLOOR) * share;

  // One decimal, rounded away from zero at the half — the same rounding a
  // teacher does by hand, and the reason 5,45 is not quietly a pass.
  return Math.round(raw * 10) / 10;
}

/** The mark as a child sees it written: one decimal, and a comma. */
export function formatGrade(value: number): string {
  return value.toLocaleString('nl-NL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
