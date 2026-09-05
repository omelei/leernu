import type { Item } from './types';

/**
 * Matching a typed answer.
 *
 * Spec section 4.1 accepts a Levenshtein distance of one, and that is what this
 * does (ADR-006). It has a known cost, recorded here so nobody rediscovers it in
 * a classroom: Dutch has real toponym pairs one edit apart — Ede and Epe, Hoorn
 * and Doorn — and a child who types the wrong one of a pair will be told they
 * were right.
 *
 * `findNearMisses` exists to make the size of that problem measurable rather than
 * theoretical: the content validator runs it over every region set and prints
 * the colliding pairs. If the list stays short, an exception table is a small
 * change; if it grows, ADR-006 is worth reopening with evidence.
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
 * Levenshtein distance, abandoning early once it cannot come in under `max`.
 * Two rows rather than a full matrix: this runs on every keystroke of a typed
 * answer on hardware that is not fast.
 */
export function levenshtein(a: string, b: string, max = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current: number[] = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowBest = current[0] as number;

    for (let j = 1; j <= b.length; j++) {
      const substitution = (previous[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1);
      const insertion = (current[j - 1] as number) + 1;
      const deletion = (previous[j] as number) + 1;
      const best = Math.min(substitution, insertion, deletion);
      current[j] = best;
      if (best < rowBest) rowBest = best;
    }

    if (rowBest > max) return max + 1;

    const swap = previous;
    previous = current;
    current = swap;
  }

  return previous[b.length] as number;
}

export interface AnswerMatch {
  readonly correct: boolean;
  /** True when the answer matched without needing the typo tolerance. */
  readonly exact: boolean;
  /** Which spelling it matched, so feedback can show the accepted form. */
  readonly matched: string | null;
}

export function acceptedSpellings(item: Item): string[] {
  return [item.naam, ...item.aliassen];
}

export function matchAnswer(typed: string, item: Item): AnswerMatch {
  const candidate = normaliseAnswer(typed);
  if (candidate.length === 0) return { correct: false, exact: false, matched: null };

  const spellings = acceptedSpellings(item);

  for (const spelling of spellings) {
    if (normaliseAnswer(spelling) === candidate) {
      return { correct: true, exact: true, matched: spelling };
    }
  }

  for (const spelling of spellings) {
    if (levenshtein(candidate, normaliseAnswer(spelling), MAX_TYPO_DISTANCE) <= MAX_TYPO_DISTANCE) {
      return { correct: true, exact: false, matched: spelling };
    }
  }

  return { correct: false, exact: false, matched: null };
}

export interface NearMiss {
  readonly a: string;
  readonly b: string;
  readonly distance: number;
}

/**
 * Every pair of items in a set whose names are close enough that the typo
 * tolerance would accept one for the other. Used by `npm run validate:content`.
 */
export function findNearMisses(items: readonly Item[], max = MAX_TYPO_DISTANCE): NearMiss[] {
  const found: NearMiss[] = [];
  const normalised = items.map((item) => ({ id: item.id, naam: item.naam, key: normaliseAnswer(item.naam) }));

  for (let i = 0; i < normalised.length; i++) {
    for (let j = i + 1; j < normalised.length; j++) {
      const left = normalised[i];
      const right = normalised[j];
      if (!left || !right) continue;

      const distance = levenshtein(left.key, right.key, max);
      if (distance <= max) {
        found.push({ a: left.naam, b: right.naam, distance });
      }
    }
  }

  return found;
}
