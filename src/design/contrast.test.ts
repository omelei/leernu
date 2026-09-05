import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Contrast, checked against the real stylesheet rather than a copy of it.
 *
 * The palette is parsed out of src/index.css, so this test cannot drift away
 * from the tokens it is checking — change a colour and the check follows it.
 * That matters more here than in most products: the primary interface is a map,
 * where colour does most of the work, and a palette that quietly slips below AA
 * is invisible to everyone who can already read it.
 */

const cssPath = fileURLToPath(new URL('../index.css', import.meta.url));
const css = readFileSync(cssPath, 'utf8');

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match?.[1]) throw new Error(`Token --${name} not found in src/index.css`);
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

const WHITE = '#ffffff';

describe('palette contrast', () => {
  const paper = token('paper');
  const surface = token('surface');

  it.each([
    ['ink-900 on paper', token('ink-900'), paper],
    ['ink-700 on paper', token('ink-700'), paper],
    ['ink-500 on paper', token('ink-500'), paper],
    ['ink-500 on surface', token('ink-500'), surface],
    ['white on primary', WHITE, token('primary')],
    ['white on primary-hover', WHITE, token('primary-hover')],
    ['white on good', WHITE, token('good')],
    ['white on bad', WHITE, token('bad')],
  ])('%s clears 4.5:1 for body text', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  // Non-text contrast: a focus ring and a map fill only have to be
  // distinguishable, not readable.
  it.each([['focus ring on paper', token('focus'), paper]])(
    '%s clears 3:1 for a non-text indicator',
    (_name, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
    },
  );

  // A label sits on top of every map fill, so each fill has to carry dark ink.
  it.each([
    ['water', token('water')],
    ['land', token('land')],
    ['land-active', token('land-active')],
  ])('a label on %s is readable', (_name, fill) => {
    expect(contrastRatio(token('ink-900'), fill)).toBeGreaterThanOrEqual(4.5);
  });
});
