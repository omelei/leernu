import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Styleguide §E as a test.
 *
 * §E names sixteen icons and says, in as many words, that it will not draw
 * them: what it fixes is a construction rule and a list. A list in a document
 * nobody reruns is a list that quietly becomes fourteen, so it is here instead.
 *
 * What this can check is the rule, not the drawing. A tick that looks like a
 * cross would pass every assertion below — that is what the design gallery and
 * a pair of eyes are for. What it does catch is the failure that actually
 * happens: an icon added later that quietly uses a different grid, a different
 * weight, or a colour of its own.
 */

/*
 * The heroes are not in here. They were drawn on this frame while they were
 * animals; since ADR-098 they are illustrations with a material of their own,
 * served as images, and a rule about one stroke weight and no colour is not a
 * rule they could keep.
 */
const source = readFileSync(join(process.cwd(), 'src', 'components', 'Icon.tsx'), 'utf8');

/** The sixteen, in §E's own order. */
const NAMED = [
  ['gebied', 'AreaIcon'],
  ['vlag', 'FlagIcon'],
  ['klok', 'ClockIcon'],
  ['tafels', 'TablesIcon'],
  ['woord', 'WordIcon'],
  ['tijdvak', 'EraIcon'],
  ['streak', 'StreakIcon'],
  ['ladder', 'LadderIcon'],
  ['stempel', 'StampIcon'],
  ['voorlezen', 'SpeakIcon'],
  ['goed', 'CorrectIcon'],
  ['fout', 'WrongIcon'],
  ['verder', 'NextIcon'],
  ['leerling', 'PupilIcon'],
  ['gezin', 'FamilyIcon'],
  ['vriezer', 'FreezerIcon'],
] as const;

describe('the icon set', () => {
  it('has all sixteen §E names', () => {
    const missing = NAMED.filter(([, component]) => !source.includes(`function ${component}(`));
    expect(missing.map(([naam]) => naam)).toEqual([]);
  });

  it('draws every one of them on the shared frame', () => {
    // The grid, the weight and the caps live in `Icon` and nowhere else, so an
    // icon that opens its own <svg> has left the system without saying so.
    for (const [, component] of NAMED) {
      const body = source.slice(source.indexOf(`function ${component}(`));
      const end = body.indexOf('\nexport function');
      const drawing = end === -1 ? body : body.slice(0, end);

      expect(drawing, component).toContain('<Icon {...props}>');
      expect(drawing, component).not.toContain('<svg');
    }
  });

  it('keeps every shape inside the 24 grid', () => {
    // §E: a 24 x 24 grid with 2 of margin. A coordinate outside it is either a
    // mistake or an icon drawn against a different frame.
    const numbers = source.matchAll(/(?:cx|cy|r)="(-?[\d.]+)"/g);
    for (const match of numbers) {
      const value = Number(match[1]);
      expect(value, match[0]).toBeGreaterThanOrEqual(0);
      expect(value, match[0]).toBeLessThanOrEqual(24);
    }
  });

  it('gives no two icons the same silhouette', () => {
    // §E: an icon may not mean two things. The pair this is written for is the
    // times sign and the cross for a wrong answer, which are the same drawing
    // until one of them is put on a key.
    const paths = [...source.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(paths).size, 'two icons share a path').toBe(paths.length);
  });

  it('lets no icon carry a colour of its own', () => {
    // Monochrome, §E: ink, secondary ink, or whatever the text around it is.
    // `currentColor` is the only fill allowed, and it is the one the dot uses.
    const fills = [...source.matchAll(/fill="([^"]*)"/g)].map((match) => match[1]);
    for (const fill of fills) {
      expect(['none', 'currentColor'], `fill="${fill ?? ''}"`).toContain(fill);
    }
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/\b(?:rgb|hsl|oklch)\(/);
  });
});
