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
  /** Reachable at 44px on the smallest supported device. */
  minTouchTargetPx: 48,
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
