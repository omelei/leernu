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

type Theme = 'licht' | 'ronde';

/**
 * The two themes, read apart (ADR-109).
 *
 * Light is `:root`. The round's is the block `data-thema="ronde"` switches on,
 * which redefines the same role names — `--kaart`, `--inkt`, `--nadruk` — with
 * the handoff's dark values. A lookup that is not scoped to a theme would find
 * the light declaration first and report every dark token at its light value,
 * measuring the wrong colours while claiming the round was checked.
 *
 * The round block has no nested braces, so it ends at the first `}`.
 */
const RONDE_OPEN = "[data-thema='ronde'] {";
const rondeStart = css.indexOf(RONDE_OPEN);
if (rondeStart < 0) throw new Error(`No round theme block in ${CSS_PATH}`);

const blocks: Record<Theme, string> = {
  licht: css.slice(0, rondeStart),
  ronde: css.slice(rondeStart, css.indexOf('}', rondeStart)),
};

/**
 * One token's declaration in a theme. A token the round does not redefine
 * falls back to the light block, which is what the cascade does too.
 *
 * The lookbehind keeps `--kaart` from matching `--padding-kaart`.
 */
function declarationOf(name: string, theme: Theme): string {
  const here = new RegExp(`(?<![\\w-])--${name}:\\s*([^;]+);`).exec(blocks[theme]);
  if (here?.[1]) return here[1].trim();
  if (theme === 'ronde') return declarationOf(name, 'licht');
  throw new Error(`Token --${name} not found in ${CSS_PATH}`);
}

/**
 * A token's value, resolved.
 *
 * A reference resolves in the theme being asked about, not in the theme its
 * declaration was written in: `--map-land` is declared once, as
 * `var(--papier)`, and is a different colour in a round because var() is
 * resolved where it is used.
 */
function token(name: string, theme: Theme = 'licht', seen: string[] = []): string {
  if (seen.includes(name))
    throw new Error(`Token --${name} refers to itself: ${seen.join(' -> ')}`);

  const value = declarationOf(name, theme);
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;

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

function ratio(foreground: string, background: string, theme: Theme): number {
  return contrastRatio(token(foreground, theme), token(background, theme));
}

/** The seven modules, in the rail order of ADR-029. */
const MODULES = ['topo', 'tafels', 'klok', 'woorden', 'spelling', 'tijdvakken', 'vlaggen'] as const;
const REEKSEN = ['brons', 'zilver', 'goud', 'platina', 'ultra'] as const;

describe('contrast, light', () => {
  it.each([
    ['inkt', 'kaart'],
    ['inkt', 'papier'],
    ['tekst-secundair', 'kaart'],
    ['tekst-secundair', 'papier'],
    // The handoff made the third ink a text colour, and it is one: 5.15 on a
    // card and 4.58 on the ground, just over the line.
    ['tekst-tertiair', 'kaart'],
    ['tekst-tertiair', 'papier'],
    // The primary button, and the tick on the one solid fill there is.
    ['kaart', 'inkt'],
    ['kaart', 'nadruk'],
    // Green as text on a card. Not on the ground, where it reaches 4.20 —
    // there it is nadruk-tekst, which is measured on both.
    ['nadruk', 'kaart'],
    ['nadruk-tekst', 'nadruk-vlak'],
    ['nadruk-tekst', 'papier'],
    ['accent-text', 'accent-tint'],
    // Wrong as text sits on a card (4.72); on the ground it reaches 4.21 and
    // is only ever an edge there, measured below.
    ['fout', 'kaart'],
    ['fout-tekst', 'fout-arcering-grond'],
    ['inkt', 'vlak-hover'],
    ['inkt', 'map-land'],
  ])('%s on %s clears 4.5:1', (foreground, background) => {
    expect(ratio(foreground, background, 'licht')).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * WCAG 1.4.11: the edge of a control and the marks that identify a state
   * need 3:1. The light rule does not clear it (1.40) and is never the only
   * thing that shows where a control is — which is why every field, option and
   * secondary button is drawn in rand-bediening, as the screens draw them.
   */
  it.each([
    ['rand-bediening', 'kaart'],
    ['rand-bediening', 'papier'],
    ['nadruk', 'papier'],
    ['fout', 'papier'],
    ['accent', 'kaart'],
    ['map-grens', 'map-land'],
    ['fout-kaart-rand', 'map-land'],
    ['tekst-tertiair', 'kaart'],
  ])('%s on %s clears 3:1 as a non-text indicator', (foreground, background) => {
    expect(ratio(foreground, background, 'licht')).toBeGreaterThanOrEqual(3);
  });
});

describe('contrast, in a round', () => {
  it.each([
    ['inkt', 'papier'],
    ['inkt', 'kaart'],
    ['tekst-secundair', 'kaart'],
    ['tekst-tertiair', 'kaart'],
    ['nadruk', 'kaart'],
    ['nadruk', 'papier'],
    ['kaart', 'inkt'],
    ['kaart', 'nadruk'],
    ['accent-text', 'accent-tint'],
    ['fout', 'kaart'],
    ['fout', 'papier'],
    ['fout-tekst', 'fout-arcering-grond'],
    ['inkt', 'vlak-hover'],
    ['inkt', 'map-land'],
  ])('%s on %s clears 4.5:1', (foreground, background) => {
    expect(ratio(foreground, background, 'ronde')).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['rand-bediening', 'kaart'],
    ['rand-bediening', 'papier'],
    ['map-grens', 'map-land'],
    ['fout-kaart-rand', 'map-land'],
    ['accent', 'kaart'],
  ])('%s on %s clears 3:1 as a non-text indicator', (foreground, background) => {
    expect(ratio(foreground, background, 'ronde')).toBeGreaterThanOrEqual(3);
  });

  it('really is dark: the ground is the handoff ink', () => {
    expect(token('papier', 'ronde')).toBe(token('inkt', 'licht'));
    expect(token('inkt', 'ronde')).toBe(token('kaart', 'licht'));
  });
});

describe('the colours outside the handoff table', () => {
  /**
   * A module's pictogram on its own tint: the plate, the one place a module
   * still has a colour of its own. Text on it is the module's text colour.
   */
  it.each(MODULES.map((name) => [name] as const))('%s-text clears 4.5:1 on its tint', (name) => {
    expect(ratio(`${name}-text`, `${name}-tint`, 'licht')).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * The collection's five materials (ADR-071). They carry a drawing rather
   * than text, so the floor is three; gold is also the stars in a round's bar,
   * so it is measured on the round's ground as well.
   */
  it.each(REEKSEN.map((reeks) => [reeks] as const))('draws %s legibly on a card', (reeks) => {
    expect(ratio(`reeks-${reeks}`, 'kaart', 'licht')).toBeGreaterThanOrEqual(3);
  });

  it('draws the stars legibly on the ground of a round', () => {
    expect(ratio('reeks-goud', 'papier', 'ronde')).toBeGreaterThanOrEqual(3);
  });

  it.each(REEKSEN.map((reeks) => [reeks] as const))(
    'names %s legibly in its deep tone, and draws on it in the light',
    (reeks) => {
      expect(ratio(`reeks-${reeks}-diep`, 'kaart', 'licht'), 'deep tone').toBeGreaterThanOrEqual(
        4.5,
      );
      expect(ratio('reeks-licht', `reeks-${reeks}`, 'licht'), 'drawing').toBeGreaterThanOrEqual(3);
    },
  );

  it('gives every rung of the ladder a colour of its own', () => {
    const waarden = REEKSEN.map((reeks) => token(`reeks-${reeks}`));
    expect(new Set(waarden).size).toBe(waarden.length);
  });
});
