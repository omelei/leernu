import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A module may colour exactly three things.
 *
 * Styleguide §B: the highlight on the image, the progress bar and the module
 * entrance. Not a button, not a message, not a table, and never the mark — the
 * dot is ink on paper or paper on ink in every module.
 *
 * The reason it is worth enforcing rather than agreeing is that an accent is
 * always the tempting colour. It is the one that looks like the brand, so it
 * creeps onto the primary button, then onto the number that matters, then onto
 * a badge — and each step looks like an improvement on its own. What it costs
 * is the thing the rule protects: a child learns to look for a colour instead
 * of for a word, and then the seventh module arrives and the colour means
 * something else.
 *
 * So: every use of an accent in the source has to be named here, with a reason.
 * Adding one is deliberate and shows up in a diff as what it is.
 */

const ROOT = process.cwd();

/** CSS rules that may paint with an accent, and why. */
const ALLOWED_SELECTORS: ReadonlyMap<string, string> = new Map([
  ['.tk-shape-asked', 'the highlight on the image'],
  ['.tk-progress-fill', 'the progress bar'],
  ['.tk-module-card', 'the module entrance'],
  ['.tk-module-card:hover', 'the module entrance'],
  ['.tk-module-card:disabled', 'the module entrance'],
]);

/** Where an accent may be *defined* rather than used. */
const DEFINITION_SELECTORS = /^(:root|\[data-module='[a-z]+'\])$/;

/** Lines in components that may name an accent, and why. */
const ALLOWED_LINES: readonly { file: string; snippet: string; why: string }[] = [
  { file: 'src/features/home/HomeScreen.tsx', snippet: 'bg-accent', why: 'the progress bar' },
  { file: 'src/features/practice/PracticeScreen.tsx', snippet: 'bg-accent', why: 'the progress bar' },
  {
    file: 'src/features/practice/MapCanvas.tsx',
    snippet: 'var(--accent',
    why: 'the highlight on the map',
  },
  {
    file: 'src/features/practice/ResultScreen.tsx',
    snippet: 'var(--accent',
    why: 'the highlight on the map',
  },
];

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments talk about the rule; they do not break it. */
function isComment(line: string): boolean {
  return /^\s*(\/\/|\/\*|\*)/.test(line.trim()) || line.trim().startsWith('{/*');
}

describe('a module accent colours three things and nothing else', () => {
  it('paints with an accent only in rules that are allowed to', () => {
    const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );

    const offenders: string[] = [];
    let selector = '';

    for (const raw of css.split('\n')) {
      const line = raw.trim();
      if (line.endsWith('{')) {
        const named = line.slice(0, -1).trim();
        // Only track real selectors, not @media or @layer wrappers.
        if (named && !named.startsWith('@')) selector = named;
        continue;
      }

      if (!line.includes('--accent')) continue;

      // A declaration whose *property* is an accent is a definition.
      const property = /^(--[a-z-]+)\s*:/.exec(line)?.[1];
      if (property?.startsWith('--accent')) {
        if (!DEFINITION_SELECTORS.test(selector)) {
          offenders.push(`${selector} defines ${property}`);
        }
        continue;
      }

      if (!ALLOWED_SELECTORS.has(selector)) offenders.push(`${selector} uses ${line}`);
    }

    expect(offenders, 'add the rule to ALLOWED_SELECTORS, with a reason, or use ink').toEqual([]);
  });

  it('names an accent in a component only where it is listed, with a reason', () => {
    const offenders: string[] = [];

    for (const full of sourceFiles(join(ROOT, 'src'))) {
      const file = relative(ROOT, full).split('\\').join('/');
      const lines = readFileSync(full, 'utf8').split('\n');

      lines.forEach((line, index) => {
        if (!/\b(bg|text|border|fill|stroke)-accent|var\(--accent/.test(line)) return;
        if (isComment(line)) return;

        const allowed = ALLOWED_LINES.some(
          (entry) => entry.file === file && line.includes(entry.snippet),
        );
        if (!allowed) offenders.push(`${file}:${index + 1} ${line.trim()}`);
      });
    }

    expect(offenders, 'add it to ALLOWED_LINES with a reason, or use ink').toEqual([]);
  });

  it('keeps the mark out of it entirely', () => {
    // The dot is the one thing that is identical in every module. If it ever
    // learns about accents, the brand has seven versions of itself.
    for (const name of ['Dot.tsx', 'Wordmark.tsx']) {
      const source = readFileSync(join(ROOT, 'src', 'components', name), 'utf8');
      const code = source
        .split('\n')
        .filter((line) => !isComment(line))
        .join('\n');
      expect(code, `${name} must not know about accents`).not.toMatch(/var\(--accent/);
    }
  });
});
