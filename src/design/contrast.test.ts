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

type Theme = 'light' | 'dark';

/**
 * The two theme blocks, read apart.
 *
 * Until the dark theme existed, a token could be found by searching the whole
 * file for its name. It cannot any more: `--good` is declared twice, and the
 * first match wins. A lookup that is not scoped to a theme would have reported
 * every dark token at its light value and passed — measuring the wrong colours
 * while claiming the dark palette was checked, which is worse than not checking
 * it at all.
 */
const DARK_OPEN = '@media (prefers-color-scheme: dark) {';
const darkStart = css.indexOf(DARK_OPEN);
if (darkStart < 0) throw new Error(`No dark theme block in ${CSS_PATH}`);

const blocks: Record<Theme, string> = {
  light: css.slice(0, darkStart),
  dark: css.slice(darkStart),
};

/**
 * One token's value, resolved.
 *
 * Some tokens are written as a reference — `--map-land: var(--surface)` — so a
 * plain regex would come back with the reference rather than a colour. Chasing
 * it here means the stylesheet stays readable, and a token that resolves to
 * nothing fails loudly instead of quietly measuring the string "var(--x)".
 *
 * A dark token defined only as a reference to something the dark block does not
 * itself redefine falls back to the light block, which is what the cascade does
 * too.
 */
function declarationOf(name: string, theme: Theme): string {
  const here = new RegExp(`--${name}:\\s*([^;]+);`).exec(blocks[theme]);
  if (here?.[1]) return here[1].trim();
  // Not redefined in this theme, so the light declaration is the one that
  // applies.
  if (theme === 'dark') return declarationOf(name, 'light');
  throw new Error(`Token --${name} not found in ${CSS_PATH}`);
}

function token(name: string, theme: Theme = 'light', seen: string[] = []): string {
  if (seen.includes(name))
    throw new Error(`Token --${name} refers to itself: ${seen.join(' -> ')}`);

  const value = declarationOf(name, theme);
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;

  // A reference resolves in the theme being asked about, not in the theme its
  // declaration was written in. --map-land is declared once, as var(--surface),
  // and is a different colour in each theme because var() is resolved where it
  // is used, not where it is written. Following the declaration into the light
  // block instead reports dark map land as light grey — which is what the first
  // version of this function did, and what caught it was running the table.
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

/** The seven modules, in the rail order of ADR-029. */
const ACCENTS = ['topo', 'tafels', 'klok', 'woorden', 'spelling', 'tijdvakken', 'vlaggen'] as const;

describe('palette contrast', () => {
  const paper = token('paper');
  const darkPaper = token('paper', 'dark');

  it.each([
    ['ink on paper', token('ink'), paper],
    ['ink-2 on paper', token('ink-2'), paper],
    ['ink-2 on surface', token('ink-2'), token('surface')],
    ['paper on ink (button)', paper, token('ink')],
    ['paper on good', paper, token('good')],
    ['paper on bad', paper, token('bad')],
    ['good-text on paper', token('good-text'), paper],
    ['attention-text on paper', token('attention-text'), paper],
    ['ink on attention', token('ink'), token('attention')],
    ['paper on neutral', paper, token('neutral')],
    ['topo-text on paper', token('topo-text'), paper],
    ['a label on the map', token('ink'), token('map-land')],
  ])('%s clears 4.5:1 for body text', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['ink on paper', token('ink', 'dark'), darkPaper],
    ['ink-2 on paper', token('ink-2', 'dark'), darkPaper],
    ['ink-3 on paper', token('ink-3', 'dark'), darkPaper],
    ['paper on ink (button)', darkPaper, token('ink', 'dark')],
    ['good on paper', token('good', 'dark'), darkPaper],
    ['bad on paper', token('bad', 'dark'), darkPaper],
    ['attention on paper', token('attention', 'dark'), darkPaper],
    ['neutral on paper', token('neutral', 'dark'), darkPaper],
    ['a label on the map', token('ink', 'dark'), token('map-land', 'dark')],
  ])('dark: %s clears 4.5:1 for body text', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Every module's text variant on its own tint. The styleguide quotes a ratio
   * for each; the exact values are pinned further down, and this is the floor
   * that has to hold whatever the numbers move to.
   */
  it.each(ACCENTS.map((name) => [name] as const))(
    '%s-text clears 4.5:1 on its own tint',
    (name) => {
      expect(contrastRatio(token(`${name}-text`), token(`${name}-tint`))).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each(ACCENTS.map((name) => [name] as const))('dark: %s clears 4.5:1 on paper', (name) => {
    expect(contrastRatio(token(name, 'dark'), darkPaper)).toBeGreaterThanOrEqual(4.5);
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
    ['the outline of the shape being asked about', token('accent'), paper],
    ['that outline against its own tinted fill', token('accent'), token('accent-tint')],
    ['the outline of a dimmed province', token('ink-3'), paper],
    ['the progress rail', token('accent'), paper],
    ['the attention surface', token('attention'), paper],
  ])('%s clears 3:1 as a non-text indicator', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ['the green outline of a correct answer', token('good', 'dark'), darkPaper],
    ['the red outline of a wrong answer', token('bad', 'dark'), darkPaper],
    ['the outline of the shape being asked about', token('accent', 'dark'), darkPaper],
    ['the outline of a dimmed province', token('ink-3', 'dark'), darkPaper],
  ])('dark: %s clears 3:1 as a non-text indicator', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(3);
  });

  /**
   * The ratios styleguide §B publishes, pinned to two decimals.
   *
   * The point of this table is not that these pairs are legible — the floors
   * above already say that. It is that the styleguide claims *measured* values,
   * so a token that moves without the document moving with it is a
   * documentation bug, and a documentation bug in a palette is how the next
   * colour gets chosen against a number that is no longer true.
   *
   * Two entries deliberately carry the measured value rather than the published
   * one, both recorded in ADR-028: the light neutral is published at 5.29 and
   * measures 5.23, which is rounding, and the dark neutral is published at 7.66
   * and measures 7.24, which is not. Both still clear AA comfortably. Twenty-
   * seven of the twenty-nine published pairs reproduce exactly, which is why
   * these two are worth correcting in the styleguide rather than shrugging at.
   */
  it.each([
    ['ink on paper', token('ink'), paper, 15.47],
    ['ink-2 on paper', token('ink-2'), paper, 6.24],
    ['ink-3 on paper', token('ink-3'), paper, 3.75],
    ['line on paper', token('line'), paper, 1.4],
    ['line-strong on paper', token('line-strong'), paper, 1.91],
    ['paper on good', paper, token('good'), 4.96],
    ['paper on bad', paper, token('bad'), 6.25],
    ['ink on attention', token('ink'), token('attention'), 5.12],
    ['attention on paper', token('attention'), paper, 3.02],
    ['attention-text on paper', token('attention-text'), paper, 5.8],
    ['paper on neutral', paper, token('neutral'), 5.23],
    ['topo-text on its tint', token('topo-text'), token('topo-tint'), 5.8],
    ['tafels-text on its tint', token('tafels-text'), token('tafels-tint'), 5.21],
    ['klok-text on its tint', token('klok-text'), token('klok-tint'), 6.47],
    ['woorden-text on its tint', token('woorden-text'), token('woorden-tint'), 6.09],
    ['spelling-text on its tint', token('spelling-text'), token('spelling-tint'), 6.15],
    ['tijdvakken-text on its tint', token('tijdvakken-text'), token('tijdvakken-tint'), 5.67],
    ['vlaggen-text on its tint', token('vlaggen-text'), token('vlaggen-tint'), 5.14],
    ['paper on klok', paper, token('klok'), 4.86],
    ['dark ink on dark paper', token('ink', 'dark'), darkPaper, 16.96],
    ['dark ink-2 on dark paper', token('ink-2', 'dark'), darkPaper, 9.35],
    ['dark ink-3 on dark paper', token('ink-3', 'dark'), darkPaper, 6.03],
    ['dark line on dark paper', token('line', 'dark'), darkPaper, 1.66],
    ['dark line-strong on dark paper', token('line-strong', 'dark'), darkPaper, 2.54],
    ['dark good on dark paper', token('good', 'dark'), darkPaper, 8.81],
    ['dark bad on dark paper', token('bad', 'dark'), darkPaper, 7.15],
    ['dark attention on dark paper', token('attention', 'dark'), darkPaper, 9.94],
    ['dark neutral on dark paper', token('neutral', 'dark'), darkPaper, 7.24],
    ['dark klok on dark paper', token('klok', 'dark'), darkPaper, 7.84],
  ])('%s measures the documented ratio', (_name, foreground, background, expected) => {
    expect(contrastRatio(foreground, background)).toBeCloseTo(expected, 2);
  });

  /**
   * The seventh accent, ADR-028. Amber is the tight neighbour at 26.3° of hue,
   * which is why clock reading may never be the only thing distinguishing a
   * module from an attention message. That rule cannot be measured here, but
   * the thing that makes it necessary can be: the two are close enough in
   * contrast against paper that neither reads as "louder".
   */
  it('gives clock reading a surface as usable as the other six', () => {
    for (const name of ACCENTS) {
      expect(contrastRatio(paper, token(name))).toBeGreaterThanOrEqual(3);
    }
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
   *
   * The dark theme's third ink is not in the same position — at 6.03:1 it
   * reaches AA even at 15px — so the constraint is asserted for light only.
   */
  it('keeps ink-3 out of text, and says so when that changes', () => {
    expect(contrastRatio(token('ink-3'), paper)).toBeLessThan(4.5);
    expect(contrastRatio(token('ink-3'), paper)).toBeGreaterThanOrEqual(3);
  });

  /**
   * The semantic colours sit outside the accent system: a module may never
   * borrow one, and an accent may never mean right or wrong.
   *
   * --good-text and the tafels accent's text variant are the same hex today,
   * which is exactly the collision that rule exists to prevent from becoming
   * load-bearing. They stay two tokens with two names, and this test states
   * the fact so that whoever moves one of them meets it deliberately.
   */
  /**
   * The collection's five materials (ADR-071).
   *
   * They carry a drawing rather than text, so §A's floor for them is three, and
   * they are one value each rather than a light and a dark — a material that
   * changed hue between themes would stop being a material. That makes both
   * themes worth measuring: it is the same colour standing on two very
   * different grounds.
   */
  it.each([['brons'], ['zilver'], ['goud'], ['platina'], ['ultra']])(
    'draws %s legibly on paper in both themes',
    (reeks) => {
      expect(contrastRatio(token(`reeks-${reeks}`), paper), 'light').toBeGreaterThanOrEqual(3);
      expect(contrastRatio(token(`reeks-${reeks}`), darkPaper), 'dark').toBeGreaterThanOrEqual(3);
    },
  );

  it('gives every rung of the ladder a colour of its own', () => {
    // Five materials, five hexes. Two rungs that resolved to the same value
    // would make the ladder look four long, which is the failure a name alone
    // does not catch: "platina" and "ultra" read as different words either way.
    const waarden = ['brons', 'zilver', 'goud', 'platina', 'ultra'].map((reeks) =>
      token(`reeks-${reeks}`),
    );
    expect(new Set(waarden).size).toBe(waarden.length);
  });

  /**
   * The soft step (ADR-094) carries the module's text colour on a chosen tile
   * and the start bar. It is lighter than the tint, so this should hold by
   * construction — which is exactly the kind of "should" worth measuring.
   */
  it.each(ACCENTS.map((name) => [name] as const))(
    '%s-text clears 4.5:1 on its own soft step',
    (name) => {
      expect(contrastRatio(token(`${name}-text`), token(`${name}-soft`))).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  /**
   * A hero's plate (ADR-094). The deep tone names the reeks on paper, so it is
   * text and has to clear 4.5; the light drawing on the material is a graphical
   * object and has to clear 3, the floor the materials were chosen against.
   */
  it.each([['brons'], ['zilver'], ['goud'], ['platina'], ['ultra']])(
    'names %s legibly in its deep tone, and draws on it in the light',
    (reeks) => {
      expect(
        contrastRatio(token(`reeks-${reeks}-diep`), paper),
        'deep tone',
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(token('reeks-licht'), token(`reeks-${reeks}`)),
        'drawing',
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps the semantic and accent scales separate, collision and all', () => {
    expect(token('good-text')).toBe(token('tafels-text'));
  });
});
