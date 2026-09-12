import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nl } from '@/i18n/nl';

const ROOT = process.cwd();

/**
 * Two rules about words, checked rather than remembered.
 *
 * **Every visible string lives in nl.ts.** Not because a second language is
 * coming — it is not — but because copy that is scattered through components
 * cannot be read as a whole, and the register rules in §5.7 are about the whole:
 * one word for retention, one job for "score", nothing that praises the child
 * rather than the work. You cannot hold a tone of voice consistent across
 * twenty files if you can only see one at a time.
 *
 * **Some words are retired.** "Vast", "blijft zitten" and "beheersing" were
 * three words for one idea, two of them carrying school baggage a ten-year-old
 * hears before they hear the meaning — "blijft zitten" is being held back a
 * year. "Leuk", "spelenderwijs", "avontuur" and "plezier" are the vocabulary of
 * a product describing itself as fun, which is a claim the child gets to make
 * and not us.
 */

/** Files that legitimately hold letters that are not copy. */
const NOT_COPY: ReadonlyMap<string, string> = new Map([
  [
    'src/components/Wordmark.tsx',
    'the letters of the wordmark are a logo, drawn as text; the accessible name comes from brand.ts',
  ],
  [
    'src/design/Gallery.tsx',
    'a development-only page whose labels are query addresses for its own test, and which never ships',
  ],
]);

const LABELLED_ATTRIBUTES =
  /\b(aria-label|placeholder|title|alt|aria-valuetext|aria-description)="([^"]*[a-zA-Z]{2,}[^"]*)"/g;
/** Text sitting between two tags on one line, with no expression around it. */
const JSX_TEXT = />([^<>{}]*[a-zA-Z]{2,}[^<>{}]*)</g;

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) componentFiles(full, out);
    else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

describe('the words', () => {
  it('keeps every visible string in nl.ts', () => {
    const offenders: string[] = [];

    for (const full of componentFiles(join(ROOT, 'src'))) {
      const file = relative(ROOT, full).split(sep).join('/');
      if (NOT_COPY.has(file)) continue;

      readFileSync(full, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          const trimmed = line.trim();
          if (/^(\/\/|\/\*|\*|\{\/\*)/.test(trimmed)) return;

          for (const match of trimmed.matchAll(LABELLED_ATTRIBUTES)) {
            offenders.push(`${file}:${index + 1} ${match[1]}="${match[2]}"`);
          }
          for (const match of trimmed.matchAll(JSX_TEXT)) {
            const text = (match[1] ?? '').trim();
            // Punctuation and separators are typography, not copy.
            if (!text || /^[\s/·—–|]+$/.test(text)) continue;
            offenders.push(`${file}:${index + 1} text "${text}"`);
          }
        });
    }

    expect(offenders, 'move these into src/i18n/nl.ts and read them with t()').toEqual([]);
  });

  it('has retired the words that meant the same thing three ways', () => {
    // Word boundaries on both sides: "vasteland" is a coastline, not a claim
    // about what a child remembers, and the Waddenzee weetje is allowed to say
    // it. The point is the standalone word.
    const retired = [/\bvast\b/i, /\bbeheersing\b/i, /\bblijft zitten\b/i];
    const offenders: string[] = [];

    for (const [key, value] of Object.entries(nl)) {
      for (const pattern of retired) {
        if (pattern.test(value)) offenders.push(`${key}: "${value}"`);
      }
    }

    expect(offenders, 'ADR-030: the one word for retention is "onthouden"').toEqual([]);
  });

  it('does not tell a child what to feel', () => {
    const forbidden = [/\bleuk\w*/i, /\bspelenderwijs\b/i, /\bavontuur\w*/i, /\bplezier\w*/i];
    const offenders: string[] = [];

    for (const [key, value] of Object.entries(nl)) {
      for (const pattern of forbidden) {
        if (pattern.test(value)) offenders.push(`${key}: "${value}"`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('gives "score" exactly one job', () => {
    // The result of one round, and never a word for how much a child knows.
    for (const [key, value] of Object.entries(nl)) {
      if (!/\bscore\w*/i.test(value)) continue;
      expect(key, `"score" belongs to a round's result, not to ${key}`).toMatch(/^result\./);
    }
  });

  it('writes numbers the Dutch way', () => {
    for (const [key, value] of Object.entries(nl)) {
      // A percentage never takes a space before its sign.
      expect(value, `${key} puts a space before %`).not.toMatch(/\d\s%/);
      // Thousands take a point and decimals a comma, so a digit group of three
      // after a comma is the English habit showing through.
      expect(value, `${key} groups thousands with a comma`).not.toMatch(/\d,\d{3}\b/);
    }
  });

  it('never uses the ĳ ligature', () => {
    for (const [key, value] of Object.entries(nl)) {
      expect(value, `${key} carries a ĳ ligature`).not.toMatch(/[ĳĲ]/);
    }
  });

  it("uses the typographer's apostrophe, not the typewriter's", () => {
    for (const [key, value] of Object.entries(nl)) {
      // Inside a word: "'s ochtends" and "je naam's" would both be wrong with a
      // straight quote. Between words it is usually a quotation, which wants „ ”.
      expect(value, `${key} uses a straight apostrophe`).not.toMatch(/\w'\w/);
    }
  });
});
