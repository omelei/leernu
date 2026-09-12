import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The house style, held in place (ADR-106, docs/HUISSTIJL.md).
 *
 * The tokens come from design_handoff_leernu/README.md and are definitive. This
 * file is what makes that true for the next page as well as for this one: a new
 * screen that reaches for a literal colour, a shadow, a third typeface or one
 * of the old token names fails here, with the file and the line, before anyone
 * has to notice it in a screenshot.
 */

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8');
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of `:root`, which has no nested braces. */
const rootStart = css.indexOf(':root {');
const rootBlock = css.slice(rootStart, css.indexOf('}', rootStart));

function rootValue(name: string): string | undefined {
  return new RegExp(`(?<![\\w-])--${name}:\\s*([^;]+);`).exec(rootBlock)?.[1]?.trim();
}

function sourceFiles(dir: string, pattern: RegExp, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, pattern, out);
    else if (pattern.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Offending lines as `file:line text`, for a failure that says where. */
function offenders(pattern: RegExp, files: string[]): string[] {
  const found: string[] = [];
  for (const full of files) {
    const file = relative(ROOT, full).split('\\').join('/');
    withoutComments(readFileSync(full, 'utf8'))
      .split('\n')
      .forEach((line, index) => {
        if (pattern.test(line)) found.push(`${file}:${index + 1} ${line.trim()}`);
      });
  }
  return found;
}

describe('the tokens are the handoff’s', () => {
  it.each([
    ['canvas', '#dcd9cd'],
    ['papier', '#efede4'],
    ['kaart', '#fbfaf6'],
    ['inkt', '#1a201b'],
    ['tekst-secundair', '#525953'],
    ['tekst-tertiair', '#666c67'],
    ['rand-licht', '#d8d6cc'],
    ['rand-sterk', '#c1beb2'],
    ['nadruk', '#327f48'],
    ['nadruk-vlak', '#eafbec'],
    ['nadruk-tekst', '#2c5c3a'],
    ['donker-grond', '#1a201b'],
    ['donker-vlak', '#252c26'],
    ['donker-land', '#2f3831'],
    ['donker-rail', '#3a413b'],
    ['donker-rand', '#566056'],
    ['donker-land-hover', '#3e4a40'],
    ['donker-grenslijn', '#7c867d'],
    ['donker-nadruk', '#7fd494'],
    ['donker-tekst', '#fbfaf6'],
    ['donker-tekst-secundair', '#b9beb9'],
    ['donker-tekst-tertiair', '#8c948c'],
    ['donker-fout-rand', '#c98a8a'],
    ['donker-fout-rand-kaart', '#e8b3b3'],
    ['donker-fout-tekst', '#f2b8b8'],
    ['donker-fout-tekst-kaart', '#f6d9d9'],
    ['donker-fout-arcering', '#4a3030'],
    ['donker-fout-arcering-kaart', '#5a3636'],
  ])('--%s is %s', (name, hex) => {
    expect(rootValue(name)?.toLowerCase()).toBe(hex);
  });

  it.each([
    // Type, PO: size / line height in rem at a 16px root, as the README's px.
    ['type-paginakop', '2.5rem'],
    ['type-paginakop-lh', '2.75rem'],
    ['type-paginakop-ls', '-0.015em'],
    ['type-sectiekop', '1.75rem'],
    ['type-sectiekop-lh', '2.125rem'],
    ['type-sectiekop-ls', '-0.01em'],
    ['type-kaartkop', '1.25rem'],
    ['type-kaartkop-lh', '1.625rem'],
    ['type-vraag', '2rem'],
    ['type-vraag-lh', '2.25rem'],
    ['type-getal', '2.75rem'],
    ['type-getal-groot', '3rem'],
    ['type-lopend', '1rem'],
    ['type-lopend-lh', '1.625rem'],
    ['type-knop', '1.0625rem'],
    ['type-knop-lh', '1.5rem'],
    ['type-vlaklabel', '0.8125rem'],
    ['type-vlaklabel-lh', '1rem'],
    ['type-vlaklabel-ls', '0.08em'],
    ['type-bijschrift', '0.875rem'],
    ['type-bijschrift-lh', '1.25rem'],
    // Shape and space.
    ['radius-chip', '6px'],
    ['radius-chip-groot', '8px'],
    ['radius-kaart-vo', '10px'],
    ['radius-kaart', '12px'],
    ['radius-kaart-telefoon', '14px'],
    ['radius-rondevlak', '16px'],
    ['padding-paneel', '32px'],
    ['padding-kaart', '24px'],
    ['padding-kaart-telefoon', '20px'],
    ['padding-kaart-vo', '16px'],
    ['gap-sectie', '64px'],
    ['stroke-hair', '1px'],
    ['stroke-active', '2px'],
    // Hit targets.
    ['touch-wijzer', '44px'],
    ['touch-tablet', '48px'],
    ['touch-duim', '56px'],
    ['touch-ronde', '56px'],
    ['touch-vo', '44px'],
    // The one shadow.
    ['schaduw-beloning', '0 10px 18px rgb(26 32 27 / 22%)'],
  ])('--%s is %s', (name, value) => {
    expect(rootValue(name)).toBe(value);
  });

  it('sets headings and numbers in Archivo, and everything else in Public Sans', () => {
    expect(rootValue('font-kop')).toMatch(/^'Archivo'/);
    expect(rootValue('font-tekst')).toMatch(/^'Public Sans'/);
    const faces = [...css.matchAll(/@font-face\s*\{[^}]*font-family:\s*'([^']+)'/g)].map(
      (match) => match[1],
    );
    expect(new Set(faces)).toEqual(new Set(['Archivo', 'Public Sans']));
    // And only their files are shipped: an unused face in public/ is a face
    // someone will reach for.
    expect(readdirSync(join(ROOT, 'public', 'fonts')).sort()).toEqual([
      'archivo-latin-wght.woff2',
      'public-sans-latin-wght.woff2',
    ]);
  });
});

describe('the stylesheet uses them and nothing else', () => {
  it('names a colour only where a token is declared', () => {
    // A literal hex in a rule is a colour the round cannot switch and the next
    // palette change will miss.
    const lines = cssCode
      .split('\n')
      .filter((line) => /#[0-9a-fA-F]{3,8}\b/.test(line))
      .filter((line) => !/^\s*--[a-z0-9-]+:\s*#[0-9a-fA-F]{3,8};/.test(line));
    expect(lines).toEqual([]);
  });

  it('names a typeface only through its token', () => {
    const lines = cssCode
      .split('\n')
      .filter((line) => /font-family:/.test(line))
      .filter((line) => !/font-family:\s*(var\(--font-(kop|tekst)\)|inherit|'(Archivo|Public Sans)')/.test(line));
    expect(lines).toEqual([]);
  });

  it('draws no shadow except on a reward image', () => {
    expect(cssCode).not.toMatch(/box-shadow/);
    const filters = [...cssCode.matchAll(/drop-shadow\(([^;]*)\)/g)].map((match) => match[1]);
    for (const filter of filters) {
      // The flag's hairline is an edge that follows the flag's own outline,
      // not a shadow: no offset, one pixel, in the tertiary ink.
      if (filter === '0 0 1px var(--tekst-tertiair)') continue;
      expect(filter).toBe('var(--schaduw-beloning)');
    }
  });

  it('keeps running text pretty', () => {
    expect(/(^|\n)\s*p\s*\{[^}]*text-wrap:\s*pretty/.test(cssCode)).toBe(true);
  });

  it('takes a round dark and the hit targets up to 56', () => {
    const start = css.indexOf("[data-thema='ronde'] {");
    const ronde = css.slice(start, css.indexOf('}', start));
    expect(ronde).toContain('--papier: var(--donker-grond)');
    expect(ronde).toContain('--kaart: var(--donker-vlak)');
    expect(ronde).toContain('--raak: var(--touch-ronde)');
    expect(ronde).toContain('--knop-hoogte: var(--touch-ronde)');
  });
});

/** The names the handoff replaced (MIGRATIE-STATUS.md), gone for good. */
const OLD_TOKENS =
  /(?<![\w-])--(paper|surface|sunken|grond|line|line-strong|ink|ink-2|ink-3|good|good-text|bad|attention|attention-text|neutral|shadow-1|shadow-2|shadow-menu|shadow-held|touch|touch-min|touch-board|control-height|card-radius|card-padding|row-gap|radius-card|radius-control|radius-field|radius-full|radius-flat|radius-plaat|radius-klein|radius-balk|type-(?:h1|h2|h3|body|label|small|score)(?:-lh|-ls)?)(?![\w-])/;

describe('the old vocabulary is gone', () => {
  it('from the stylesheet', () => {
    expect(cssCode.split('\n').filter((line) => OLD_TOKENS.test(line))).toEqual([]);
  });

  it('from the components', () => {
    expect(offenders(OLD_TOKENS, sourceFiles(join(ROOT, 'src'), /\.tsx?$/))).toEqual([]);
  });

  it('and no component reaches past the tokens', () => {
    // Tailwind's own palette, shadows, radii, families and type sizes do not
    // exist in this project (tailwind.config.ts), so a class like these renders
    // nothing at all. Saying so here turns a silent miss into a failure.
    const stray =
      /(?<![\w-])(?:[a-z0-9-]+:)*(?:(?:bg|text|border|fill|stroke|ring|outline|divide|decoration|placeholder|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|paper|surface|sunken|grond|line|line-strong|ink|ink-2|good|good-text|bad|attention|topo|tafels|klok|woorden|spelling|tijdvakken|vlaggen)(?:-\d{2,3})?|shadow(?:-(?:sm|md|lg|xl|2xl|inner|1|2))?|rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|control|card|field|flat))?|font-(?:sans|serif|mono|display)|text-(?:xs|sm|base|lg|xl|[2-9]xl|h1|h2|h3|body|label|small|score|eyebrow)|[hw]-touch(?:-min|-board)?)(?![\w-])/;
    expect(offenders(stray, sourceFiles(join(ROOT, 'src'), /\.tsx$/))).toEqual([]);
  });

  it('and no inline style picks its own typeface', () => {
    const inline = /fontFamily:\s*['"`](?!var\(--font-(?:kop|tekst)\))/;
    expect(offenders(inline, sourceFiles(join(ROOT, 'src'), /\.tsx$/))).toEqual([]);
  });
});

describe('a round is dark on every module', () => {
  it.each([
    ['src/features/practice/PracticeScreen.tsx'],
    ['src/features/sums/SumScreen.tsx'],
    ['src/features/klok/KlokScreen.tsx'],
    ['src/features/vlaggen/VlagScreen.tsx'],
    ['src/features/explore/ExploreScreen.tsx'],
    ['src/features/vlaggen/VlagExploreScreen.tsx'],
  ])('%s switches the round theme on', (file) => {
    expect(readFileSync(join(ROOT, file), 'utf8')).toContain('data-thema="ronde"');
  });
});
