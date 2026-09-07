/**
 * Everything the product calls itself, in one place.
 *
 * The name is a working title and will change. White-labelling later — a school
 * publisher wanting its own name on it — should be a change to this file and a
 * palette, not a search through components. So nothing anywhere else may write
 * the product name as a string literal.
 */
export const brand = {
  name: 'Leernu',
  /** Used in the document title and any place that needs a short form. */
  shortName: 'Leernu',
  /** Shown under the name on the start screen. Kept factual, not a slogan. */
  tagline: 'Leer waar alles ligt',
  locale: 'nl-NL',
  /**
   * The floor, not the target — which is what the name promises and what this
   * value was contradicting at 48.
   *
   * Styleguide §D has three hit sizes: 44 is the ground WCAG 2.2 asks for and
   * the only one that is a rule, 56 is what PO and any finger actually get, and
   * 72 is the digibord. The target lives in CSS as --touch, because it changes
   * with the guise and the screen; this number does not change, which is why it
   * is the one worth stating in code. See ADR-032.
   */
  minTouchTargetPx: 44,
} as const;

/**
 * Feature flags for work that is built but deliberately not switched on. A flag
 * here is a promise that the code behind it is finished; anything unfinished
 * simply does not exist yet.
 */
export const features = {
  /** Accounts, classes and reporting. Deferred by ADR-014. */
  accounts: false,
  /** Leaderboards and divisions. Need a player population; see ADR-009. */
  competition: false,
} as const;
