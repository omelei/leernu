import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast, checked against the real stylesheet rather than a copy of it, so
 * this test cannot drift away from the tokens it is checking — change a colour
 * and the check follows it.
 *
 * Getting the file took two attempts, both worth recording. `import.meta.url`
 * is not a file URL under Vitest, so `fileURLToPath` throws. Vite's `?raw`
 * import looks like the idiomatic answer but returns an empty string, because
 * Vitest stubs CSS imports by default and the stub wins. Reading from the
 * project root is the boring option that actually works, in CI as well.
 *
 * That this matters more here than in most products is the point. The interface
 * is a map, where colour does nearly all the work, and a palette that slips
 * below AA is invisible to everyone who can already read it.
 */

const CSS_PATH = join(process.cwd(), 'src', 'index.css');
const css = readFileSync(CSS_PATH, 'utf8');

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match?.[1]) throw new Error(`Token --${name} not found in ${CSS_PATH}`);
  return match[1];
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

describe('palette contrast', () => {
  const paper = token('paper');

  it.each([
    ['ink on paper', token('ink'), paper],
    ['ink-2 on paper', token('ink-2'), paper],
    ['ink-2 on surface', token('ink-2'), token('surface')],
    ['paper on ink (button)', paper, token('ink')],
    ['paper on good', paper, token('good')],
    ['paper on bad', paper, token('bad')],
    ['topo-text on paper', token('topo-text'), paper],
    ['a label on the map', token('ink'), token('map-land')],
  ])('%s clears 4.5:1 for body text', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * WCAG 1.4.11 for the map. What matters is the thing that *identifies* a
   * state, which on every one of these is the outline — the fills are paper or
   * a pale tint by design, and measuring them would be measuring decoration.
   *
   * The dimmed provinces are in this list on purpose. Behind a capitals
   * exercise they look like background, but they are how a child knows where
   * on the map they are, which makes them a graphical object needed to
   * understand the content rather than an ornament.
   */
  it.each([
    ['the green outline of a correct answer', token('good'), paper],
    ['the red outline of a wrong answer', token('bad'), paper],
    ['the outline of the shape being asked about', token('topo'), paper],
    ['that outline against its own tinted fill', token('topo'), token('topo-tint')],
    ['the outline of a dimmed province', token('ink-3'), paper],
    ['the progress rail', token('topo'), paper],
  ])('%s clears 3:1 as a non-text indicator', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  /**
   * --ink-3 sits in a useful gap: at 3.75:1 it is below AA for text and above
   * the 3:1 that a line needs. So it draws the dimmed provinces (checked above)
   * and sets no type anywhere, which is why it is not exposed as a Tailwind
   * colour.
   *
   * This test pins the fact rather than the intention: if the value is ever
   * darkened past 4.5:1 it fails, and that failure is the prompt to decide
   * deliberately whether it has become a text colour. #70756e is the nearest
   * shade that would qualify.
   */
  it('keeps ink-3 out of text, and says so when that changes', () => {
    expect(contrastRatio(token('ink-3'), paper)).toBeLessThan(4.5);
    expect(contrastRatio(token('ink-3'), paper)).toBeGreaterThanOrEqual(3);
  });
});
