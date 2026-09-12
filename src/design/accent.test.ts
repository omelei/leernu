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
  // The ten dots of a round are the progress bar too — the same idea counted
  // out rather than drawn as a rail, because a round is a countable number of
  // questions and a child can see how many are left.
  ['.tk-round-dot-done', 'the progress bar, as ten dots'],
  ['.tk-round-dot-now', 'the progress bar, as ten dots'],
  ['.tk-module-card', 'the module entrance'],
  ['.tk-module-card:hover', 'the module entrance'],
  ['.tk-module-card:disabled', 'the module entrance'],
  // The fourth thing, added deliberately in ADR-089 and kept in ADR-095: the
  // answer a child has already given, on a page that is nothing but questions.
  // Every question on a module page is answered by a chip, a tile or a square,
  // and the chosen one of each is the only thing worth finding again after
  // looking away. Each also changes its rule or carries a tick, because §A does
  // not let a hue carry a state on its own.
  [".tk-keuze[aria-pressed='true']", 'the answer already given, as a chip'],
  [".tk-tegel[aria-pressed='true']", 'the answer already given, as a tile'],
  [".tk-tegel[aria-pressed='true'] .tk-plaat", 'the answer already given, as a tile'],
  ['.tk-tegel-vink', 'the answer already given: its tick'],
  [".tk-tafel[aria-pressed='true']", 'the answer already given, as a square'],
  [".tk-tafel[aria-pressed='true'] .tk-plaat", 'the answer already given, as a square'],
  // The start bar is all of those answers at once, on the module's soft ground
  // with its colour down the leading edge (ADR-095). Its label is in the
  // module's text colour; the chips on it are ink.
  ['.tk-startbalk', 'the answers already given, together'],
  ['.tk-startbalk-label', 'the answers already given, together'],
  // The rail is where the module entrance does most of its work: a column of
  // seven accents is the only place in the product that shows them together.
  [".tk-rail-item[aria-current='page']", 'the module entrance, in the rail'],
  // The plate: a module's pictogram on the module's own tint (ADR-094). The
  // handoff draws it wherever a card, a row or a line is about one module —
  // the front door's rows, the favourites, the tests, the rail and the menu —
  // and it is the one case §E lets an icon take an accent: it denotes the
  // module. The words beside a plate stay ink.
  ['.tk-plaat', 'the module entrance, as a plate'],
  // The menu the rail becomes below 1200 (ADR-093): the module you are in,
  // marked the way the rail marks it.
  [".tk-vakmenu-optie[aria-current='page']", 'the module entrance, in the menu'],
  // A test's subject, as the module's mark and name in its tint. It says
  // which door the test is behind; it is not a badge about the child.
  ['.tk-vakbadge', 'the module entrance, naming a test'],
  // The track under a module's bar on the front door, in that module's tint
  // rather than the sunken grey. The fill is already allowed as the progress
  // bar, and the handoff draws the track as the same module.
  ['.tk-verder .tk-progress-rail', 'the progress bar, on the front door'],
  // The same pair as .tk-plaat — the module's pictogram and the module's
  // name — at the head of the module's own page. If anything in the product is
  // the module entrance, the line that says which module you have entered is,
  // and on a phone it is the only thing that says so at all: §D drops the rail
  // at that width. The heading under it stays ink.
  ['.tk-modulebadge', 'the module entrance, at the head of its own page'],
  // The number of each question on that page: the page's own order, told in
  // the module's colour. The question beside it stays ink.
  ['.tk-stap-nummer', 'the module entrance, numbering its own page'],

  // House style v2. There is one accent now, the green, and stap 3's
  // conformity table gives it four jobs and no more: the module's area, right,
  // chosen, and progress. The component set below is where each of the four
  // is drawn.
  ['.ln-punt', 'progress over time: the dot is the retention meter (README)'],
  [".ln-ruit[data-stand='gedaan']", 'progress in a round: an answered question'],
  ['.ln-balk-vul', 'progress: the bar'],
  [".ln-tegel[aria-pressed='true']", 'chosen: a tile'],
  ['.ln-tegel-ruit', 'chosen: the diamond in a chosen tile’s plate'],
  ['.ln-chip-accent', 'right: a chest that is ready, on the light green'],
]);

/** Where an accent may be *defined* rather than used. */
const DEFINITION_SELECTORS = /^(:root|\[data-module='[a-z]+'\])$/;

/** Lines in components that may name an accent, and why. */
const ALLOWED_LINES: readonly { file: string; snippet: string; why: string }[] = [
  {
    file: 'src/features/practice/PracticeScreen.tsx',
    snippet: 'bg-accent',
    why: 'the progress bar',
  },
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
  {
    // The README writes the dot's fill as conic-gradient(<accent> …), and this
    // is the one line that does.
    file: 'src/components/ds/meten.ts',
    snippet: 'conic-gradient(var(--accent)',
    why: 'the dot, the retention meter',
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
    for (const name of ['Dot.tsx', 'Wordmark.tsx', 'ds/Logo.tsx']) {
      const source = readFileSync(join(ROOT, 'src', 'components', name), 'utf8');
      const code = source
        .split('\n')
        .filter((line) => !isComment(line))
        .join('\n');
      expect(code, `${name} must not know about accents`).not.toMatch(/var\(--accent/);
    }
  });
});
