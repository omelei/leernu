import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast, measured against the real token file rather than a copy of it, so
 * this test cannot drift from what it checks: change a colour and the check
 * follows it.
 *
 * WCAG 2.1 AA: 4.5:1 for running text, 3:1 for large text and for the boundary
 * a control needs in order to be seen as one. The expected ratios are the
 * values measured on 12 September 2026 from the handoff's hexes and are pinned
 * to two decimals, because the report for the house style quotes them — a
 * token that moves without the report moving with it is a documentation bug.
 *
 * Reading the file from the project root is the boring option that works:
 * `import.meta.url` is not a file URL under Vitest, and Vite's `?raw` import
 * of a stylesheet returns an empty string there.
 */

const TOKENS = join(process.cwd(), 'src', 'design', 'tokens.css');
const css = readFileSync(TOKENS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

type Theme = 'light' | 'dark';

/**
 * The declarations of every top-level block with one selector, by theme.
 *
 * Light is every `:root` outside a media query; dark is the round's block.
 * Blocks inside `@media` are the phone step and change sizes, not colours, so
 * skipping them is not skipping anything this test measures.
 */
function declarations(): Record<Theme, Map<string, string>> {
  const out: Record<Theme, Map<string, string>> = { light: new Map(), dark: new Map() };
  const block = /(^|\n)([^{}\n@][^{}]*?)\{([^{}]*)\}/g;
  for (const match of css.matchAll(block)) {
    const selector = (match[2] ?? '').trim();
    const before = css.slice(0, match.index ?? 0);
    const depth = (before.match(/\{/g)?.length ?? 0) - (before.match(/\}/g)?.length ?? 0);
    if (depth !== 0) continue;
    const theme: Theme | null =
      selector === ':root' ? 'light' : selector === "[data-thema='ronde']" ? 'dark' : null;
    if (!theme) continue;
    for (const [, name, value] of (match[3] ?? '').matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      if (name && value) out[theme].set(name, value.trim());
    }
  }
  return out;
}

const declared = declarations();

/**
 * One token's value in a theme, with references chased in that theme — a
 * var() resolves where it is used, not where it was written, so `--surface:
 * var(--grond)` is a different colour in each theme.
 */
function token(name: string, theme: Theme = 'light', seen: string[] = []): string {
  if (seen.includes(name)) throw new Error(`--${name} refers to itself: ${seen.join(' -> ')}`);
  const value = declared[theme].get(name) ?? declared.light.get(name);
  if (!value) throw new Error(`Token --${name} not found in ${TOKENS}`);
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  const reference = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(value);
  if (reference?.[1]) return token(reference[1], theme, [...seen, name]);
  throw new Error(`Token --${name} in the ${theme} theme is not a colour: ${value}`);
}

function channels(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = readonly [name: string, fg: string, bg: string, theme: Theme, measured: number];

/** Running text: 4.5:1. */
const TEXT: readonly Pair[] = [
  ['ink on paper', 'ink', 'paper', 'light', 15.88],
  ['ink on the ground', 'ink', 'grond', 'light', 14.14],
  ['ink-2 on paper', 'ink-2', 'paper', 'light', 6.9],
  ['ink-2 on the ground', 'ink-2', 'grond', 'light', 6.15],
  ['ink-3 on paper', 'ink-3', 'paper', 'light', 5.15],
  // The lowest in the light theme, and the figure stap 3 quotes for it.
  ['ink-3 on the ground', 'ink-3', 'grond', 'light', 4.58],
  ['paper on ink (primary button)', 'paper', 'ink', 'light', 15.88],
  ['accent on paper', 'accent', 'paper', 'light', 4.71],
  ['paper on good (the tick)', 'paper', 'good', 'light', 4.71],
  ['accent-text on the accent tint', 'accent-text', 'accent-tint', 'light', 7.23],
  ['ink on the accent tint', 'ink', 'accent-tint', 'light', 15.41],
  ['bad on paper', 'bad-text', 'paper', 'light', 4.72],
  ['ink on the hatch of a wrong answer', 'ink', 'bad-hatch', 'light', 13.95],
  ['ink on paper, in a round', 'ink', 'paper', 'dark', 13.71],
  ['ink on the ground, in a round', 'ink', 'grond', 'dark', 15.88],
  ['ink-2 on paper, in a round', 'ink-2', 'paper', 'dark', 7.59],
  ['ink-2 on the ground, in a round', 'ink-2', 'grond', 'dark', 8.79],
  // The lowest in the dark theme.
  ['ink-3 on paper, in a round', 'ink-3', 'paper', 'dark', 4.59],
  ['ink-3 on the ground, in a round', 'ink-3', 'grond', 'dark', 5.31],
  ['paper on ink (primary button), in a round', 'paper', 'ink', 'dark', 13.71],
  ['accent on paper, in a round', 'accent', 'paper', 'dark', 8.01],
  ['accent on the ground, in a round', 'accent', 'grond', 'dark', 9.28],
  ['wrong-answer text on paper, in a round', 'bad-text', 'paper', 'dark', 8.4],
  ['wrong-answer rule on paper, in a round', 'bad', 'paper', 'dark', 5.1],
  ['a label on the map, in a round', 'ink', 'map-land', 'dark', 11.62],
];

/** Large text and the boundaries that identify a control or a map area: 3:1. */
const NON_TEXT: readonly Pair[] = [
  ['accent on the ground (large text, the diamonds)', 'accent', 'grond', 'light', 4.2],
  ['the rule of a control, in a round', 'line-strong', 'paper', 'dark', 3.79],
  ['the rule of a control on the ground, in a round', 'line-strong', 'grond', 'dark', 4.39],
  ['a border line on the map, in a round', 'map-border', 'map-land', 'dark', 3.21],
  ['the accent on the map, in a round', 'accent', 'map-land', 'dark', 6.79],
  ['the hatch line of a wrong answer, in a round', 'bad-line', 'bad-hatch', 'dark', 5.72],
  ['the cross on a wrong answer, in a round', 'bad-mark', 'bad-hatch', 'dark', 7.86],
  ['the diamonds on an empty bar, in a round', 'accent', 'rail-empty', 'dark', 5.88],
];

describe('contrast, WCAG 2.1 AA', () => {
  it.each(TEXT)('%s clears 4.5:1', (_name, fg, bg, theme) => {
    expect(contrastRatio(token(fg, theme), token(bg, theme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT)('%s clears 3:1', (_name, fg, bg, theme) => {
    expect(contrastRatio(token(fg, theme), token(bg, theme))).toBeGreaterThanOrEqual(3);
  });

  it.each([...TEXT, ...NON_TEXT])('%s measures %f', (_name, fg, bg, theme, measured) => {
    expect(contrastRatio(token(fg, theme), token(bg, theme))).toBeCloseTo(measured, 2);
  });

  /**
   * Two pairs that do not clear their floor, pinned as facts so that using
   * either as the only thing that shows a control fails here first.
   *
   * The hairline is decoration in both themes: a card on the ground is told
   * apart by its fill, a control by its words and its stronger rule. The
   * handoff's rule on dark (#566056) measures 2.18:1 against the vlak, which
   * is why a control in a round takes the map's border line (3.79:1) instead.
   */
  it('keeps the hairlines under 3:1, and therefore off anything that must be seen', () => {
    expect(contrastRatio(token('line'), token('paper'))).toBeCloseTo(1.4, 2);
    expect(contrastRatio(token('line', 'dark'), token('paper', 'dark'))).toBeCloseTo(2.18, 2);
    expect(contrastRatio(token('line', 'dark'), token('grond', 'dark'))).toBeCloseTo(2.53, 2);
  });

  it('keeps accent green off the ground as running text', () => {
    // 4.20:1: large text and the diamonds, never a sentence.
    expect(contrastRatio(token('accent'), token('grond'))).toBeLessThan(4.5);
  });

  it.each([['topo'], ['tafels'], ['klok'], ['woorden'], ['spelling'], ['tijdvakken'], ['vlaggen']])(
    'carries ink on the %s tint',
    (name) => {
      expect(contrastRatio(token('ink'), token(`tint-${name}`))).toBeGreaterThanOrEqual(15);
    },
  );

  it('gives every rung of the ladder a colour of its own', () => {
    // Five materials, five values, the same in both themes. They are drawn
    // beside a label in ink, so no ratio is asked of them; two rungs with one
    // value would make the ladder look four long.
    const reeksen = ['brons', 'zilver', 'goud', 'platina', 'ultra'];
    const light = reeksen.map((reeks) => token(`reeks-${reeks}`));
    const dark = reeksen.map((reeks) => token(`reeks-${reeks}`, 'dark'));
    expect(new Set(light).size).toBe(reeksen.length);
    expect(dark).toEqual(light);
  });
});
