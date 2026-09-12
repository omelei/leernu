/**
 * Everything the product calls itself, in one place.
 *
 * White-labelling later — a school publisher wanting its own name on it —
 * should be a change to this file and a palette, not a search through
 * components. So nothing anywhere else may write the product name as a string
 * literal, and no component may compose a sentence about the brand: the four
 * fixed lines below are data, and a component that needs one reads it here.
 *
 * The name is always lower case, including at the start of a sentence, and the
 * dot in the middle is the mark rather than punctuation — see Wordmark.tsx,
 * which draws it as the vat. This string is the name as *text*, for a document
 * title, a screen reader and anywhere the mark itself would be wrong.
 */
export const brand = {
  name: 'leer.nu',
  /** Used in the document title and any place that needs a short form. */
  shortName: 'leer.nu',

  /**
   * The four fixed lines, business plan v6 §5.11 and ADR-024. They are not
   * interchangeable and they are not a pool to pick from.
   *
   * The proof line names a child and a number because it is the only claim on
   * the page a parent can check against their own child. The conversion line
   * names the thing the parent is buying their way out of rather than the thing
   * we are selling.
   *
   * "Geleerd blijft geleerd" was the design's slogan and is gone.
   */
  slogan: 'Leren om te onthouden.',
  heading: 'Spelen. Leren. Onthouden.',
  proof: 'Sofie onthoudt 9 van de 12 provincies.',
  conversion: 'Nooit meer overhoren.',

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
 *
 * There is no flag for the reading mode. ADR-025 dropped it, and a switched-off
 * flag is code nobody runs and nobody tests — it buys the appearance of
 * readiness at the price of a lie in this file.
 */
export const features = {
  /** Accounts, classes and reporting. Deferred by ADR-014. */
  accounts: false,
  /** Leaderboards and divisions. Need a player population; see ADR-009. */
  competition: false,
} as const;
