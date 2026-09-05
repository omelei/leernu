import type { Item } from './types';

/**
 * Judging a typed answer (ADR-017).
 *
 * The rule that shapes everything here: **a typo may never be accepted when it
 * is also the name of something else we teach.** Spec section 4.1 asked for a
 * flat tolerance of one edit, and that turned out to behave backwards — it
 * accepted Epe for Ede, teaching a false fact at the moment a child is most
 * receptive, while rejecting Utrehct for Utrecht, which is unmistakably a typo.
 *
 * The collision guard fixes the first problem and, in doing so, makes it safe to
 * fix the second: because nothing ambiguous can be accepted, the distance
 * function can afford to count an adjacent swap as one edit.
 *
 * A near-miss is scored as wrong, but shown as its own thing. That sentence —
 * "Je schreef Epe. Dat bestaat ook! Maar wij zochten Ede." — is the teachable
 * moment the old behaviour threw away by calling it correct.
 */

export const MAX_TYPO_DISTANCE = 1;

const LEADING_ARTICLES = ['de ', 'het ', "'t ", 'la ', 'le ', 'el '];

/**
 * Case, accents, punctuation and spacing are noise in a topography answer.
 * A child who writes "s hertogenbosch" knows where it is, which is the thing
 * being tested.
 */
export function normaliseAnswer(input: string): string {
  let out = input
    .normalize('NFD')
    // Strip combining marks, so é becomes e and ü becomes u. Written as escapes
    // rather than literal combining characters, which are invisible in a diff
    // and easy to destroy with an innocent editor setting.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[-_/]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const article of LEADING_ARTICLES) {
    if (out.startsWith(article)) {
      out = out.slice(article.length);
      break;
    }
  }

  return out;
}

/**
 * Damerau edit distance, optimal string alignment variant: an adjacent swap
 * costs one edit rather than two. Abandons early once the distance cannot come
 * in under `max`, because this runs on every keystroke on hardware that is slow.
 *
 * OSA rather than full Damerau: the difference only shows up when the same pair
 * is transposed twice in one word, which does not happen in a place name a child
 * is trying to spell.
 */
export function editDistance(a: string, b: string, max = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const width = b.length;
  let twoBack: number[] = new Array<number>(width + 1).fill(0);
  let previous: number[] = Array.from({ length: width + 1 }, (_, i) => i);
  let current: number[] = new Array<number>(width + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowBest = i;

    for (let j = 1; j <= width; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        (previous[j] as number) + 1, // deletion
        (current[j - 1] as number) + 1, // insertion
        (previous[j - 1] as number) + cost, // substitution
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, (twoBack[j - 2] as number) + 1); // transposition
      }

      current[j] = best;
      if (best < rowBest) rowBest = best;
    }

    if (rowBest > max) return max + 1;

    const recycled = twoBack;
    twoBack = previous;
    previous = current;
    current = recycled;
  }

  return previous[width] as number;
}

export function acceptedSpellings(item: Item): readonly string[] {
  return [item.naam, ...item.aliassen];
}

function distanceToItem(candidate: string, item: Item, max: number): number {
  let best = max + 1;
  for (const spelling of acceptedSpellings(item)) {
    const distance = editDistance(candidate, normaliseAnswer(spelling), max);
    if (distance < best) best = distance;
    if (best === 0) return 0;
  }
  return best;
}

function matchesExactly(candidate: string, item: Item): string | null {
  for (const spelling of acceptedSpellings(item)) {
    if (normaliseAnswer(spelling) === candidate) return spelling;
  }
  return null;
}

export type AnswerVerdict =
  /** Right. `exact` is false when the typo tolerance was needed. */
  | { readonly kind: 'correct'; readonly exact: boolean; readonly matched: string }
  /** Not right, but the child named something real. Scored wrong, shown gently. */
  | { readonly kind: 'near-miss'; readonly confusedWith: Item }
  | { readonly kind: 'wrong' };

/**
 * `catalogue` is the whole region set, deliberately, not the current round: an
 * answer must not be right or wrong depending on which questions came up.
 */
export function judgeAnswer(
  typed: string,
  target: Item,
  catalogue: readonly Item[],
): AnswerVerdict {
  const candidate = normaliseAnswer(typed);
  if (candidate.length === 0) return { kind: 'wrong' };

  const exact = matchesExactly(candidate, target);
  if (exact !== null) return { kind: 'correct', exact: true, matched: exact };

  const others = catalogue.filter((item) => item.id !== target.id);

  // Naming a different real place is an answer, not a typo. Checked before any
  // fuzzy matching, so it can never be forgiven as one.
  for (const other of others) {
    if (matchesExactly(candidate, other) !== null) {
      return { kind: 'near-miss', confusedWith: other };
    }
  }

  const distance = distanceToItem(candidate, target, MAX_TYPO_DISTANCE);
  if (distance > MAX_TYPO_DISTANCE) return { kind: 'wrong' };

  // Close to the target, but just as close to something else: refuse to guess.
  for (const other of others) {
    if (distanceToItem(candidate, other, MAX_TYPO_DISTANCE) <= MAX_TYPO_DISTANCE) {
      return { kind: 'near-miss', confusedWith: other };
    }
  }

  return { kind: 'correct', exact: false, matched: target.naam };
}

export interface NearMiss {
  readonly a: string;
  readonly b: string;
  readonly distance: number;
}

/**
 * Every pair in a set whose names are within the typo tolerance of each other.
 *
 * Under ADR-006 this was a warning list. Under ADR-017 it is the list of pairs
 * the guard is actively protecting — still worth printing, for a different
 * reason: these items will never accept a typo at all, because any typo of one
 * is ambiguous with the other.
 */
export function findNearMisses(items: readonly Item[], max = MAX_TYPO_DISTANCE): NearMiss[] {
  const found: NearMiss[] = [];
  const normalised = items.map((item) => ({ naam: item.naam, key: normaliseAnswer(item.naam) }));

  for (let i = 0; i < normalised.length; i++) {
    for (let j = i + 1; j < normalised.length; j++) {
      const left = normalised[i];
      const right = normalised[j];
      if (!left || !right) continue;

      const distance = editDistance(left.key, right.key, max);
      if (distance <= max) {
        found.push({ a: left.naam, b: right.naam, distance });
      }
    }
  }

  return found;
}
