import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The four answer states, told apart without colour.
 *
 * Step 8 asks for a colour-blindness check done as a test on the shapes rather
 * than as an eye test, and this is it. The claim being defended is styleguide
 * §B's: colour adds speed, form carries the meaning. If two states ever end up
 * differing only in their colour, a child with deuteranopia is looking at the
 * same picture twice and being told it means two things.
 *
 * The four:
 *
 *   goed     closed fill, tick, 2px border
 *   bijna    open fill, single 3px border, half-filled dot
 *   fout     hatched fill, cross
 *   gemist   open fill, double border, full dot
 *
 * "Gemist" is the one that has to differ from "goed" most carefully: it is the
 * right answer, shown to a child who did not give it, and if it looked like an
 * answer they got right it would be congratulating them for missing.
 */

const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8');

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!match?.[1]) throw new Error(`No rule for ${selector} in index.css`);
  return match[1];
}

function declaration(selector: string, property: string): string | null {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`).exec(rule(selector));
  return match?.[1]?.trim() ?? null;
}

const STATES = {
  goed: '.tk-shape-correct',
  bijna: '.tk-shape-near',
  fout: '.tk-shape-wrong',
  gemist: '.tk-shape-missed-outer',
} as const;

describe('the four answer states', () => {
  it('all exist as rules of their own', () => {
    for (const selector of Object.values(STATES)) {
      expect(rule(selector).length, selector).toBeGreaterThan(0);
    }
  });

  it('no two of them share a fill and a border weight', () => {
    // The pair that would be indistinguishable in grey. Colour is not in the
    // key on purpose: that is the whole point of the check.
    const shapes = Object.entries(STATES).map(([name, selector]) => ({
      name,
      key: `${declaration(selector, 'fill')} / ${declaration(selector, 'stroke-width')}`,
    }));

    const seen = new Map<string, string>();
    for (const shape of shapes) {
      const clash = seen.get(shape.key);
      expect(clash, `${shape.name} and ${clash} are the same shape`).toBeUndefined();
      seen.set(shape.key, shape.name);
    }
  });

  it('keeps the hatch on wrong and nowhere else', () => {
    // §B: the exception signal gets the texture. A hatch on a right answer
    // would make the one state a child most wants to see the busiest to read.
    expect(declaration(STATES.fout, 'fill')).toContain('tk-hatch');
    for (const [name, selector] of Object.entries(STATES)) {
      if (name === 'fout') continue;
      expect(declaration(selector, 'fill'), name).not.toContain('tk-hatch');
    }
  });

  it('gives "gemist" a second rule that "goed" does not have', () => {
    // The double border, which SVG cannot express as one stroke. Without the
    // inner path there is nothing but weight between the answer a child found
    // and the answer they were shown.
    expect(rule('.tk-shape-missed-inner')).toContain('stroke');
    const outer = Number(declaration(STATES.gemist, 'stroke-width'));
    const inner = Number(declaration('.tk-shape-missed-inner', 'stroke-width'));
    expect(outer).toBeGreaterThan(inner);
  });

  it('never draws a mark in the colour of the state it marks', () => {
    // A green tick says "right" twice and leaves the shape doing none of the
    // work. A mark takes whichever of ink or paper its own ground needs.
    expect(declaration('.tk-mark', 'stroke')).toBe('var(--inkt)');
    // The tick sits on the one solid fill there is, so it goes the other way:
    // the card's colour on green, 4.71:1 in light and 8:1 in a round.
    expect(declaration('.tk-mark-on-fill', 'stroke')).toBe('var(--kaart)');
    expect(declaration(STATES.goed, 'stroke')).toBe('var(--inkt)');
  });

  it('gives "bijna" no colour of its own', () => {
    // Amber would be a fifth meaning to learn, and the hatch belongs to wrong.
    // What says "nearly" is the half-filled dot, which is a shape.
    const fill = declaration(STATES.bijna, 'fill');
    const stroke = declaration(STATES.bijna, 'stroke');
    expect(fill).toBe('var(--kaart)');
    expect(stroke).toBe('var(--inkt)');
  });

  it('draws the same three outcomes after an answer in every module', () => {
    // The mark beside the feedback in all four rounds (UitkomstTeken): goed a
    // solid green square with a tick, fout the hatch with a cross, bijna open
    // with a rule. The hatch is the handoff's: 45 degrees, a period of 8px.
    expect(declaration('.tk-teken-goed', 'background')).toBe('var(--nadruk)');
    // Whitespace out, because Prettier breaks a long gradient over lines.
    const fout = (declaration('.tk-teken-fout', 'background') ?? '').replace(/\s+/g, '');
    expect(fout).toContain('repeating-linear-gradient(45deg,');
    expect(fout).toMatch(/3px8px\)$/);
    expect(declaration('.tk-teken-bijna', 'background')).toBe('var(--kaart)');
  });
});
