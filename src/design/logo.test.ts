import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCKUP, LOCKUP_GLYPHS, LOCKUP_VAT, MERKTEKEN } from './logo';

const svg = (name: string) =>
  readFileSync(join(process.cwd(), 'docs', 'logo', 'svg', name), 'utf8');

/**
 * The part of a half level that is the delivered level's own lower edges: from
 * the end of the first curve to the start of the last one.
 */
function lowerEdges(peil: string): string {
  return peil.slice(peil.indexOf(' ', peil.indexOf('Q')) + 1, peil.lastIndexOf(' Q'));
}

/**
 * The logo, checked against the designer's files rather than against itself.
 *
 * If one of these fails, either the drawing in docs/logo changed and logo.ts has
 * to be copied again, or logo.ts was edited by hand — and the logo is the one
 * thing nobody should be retouching in a code review.
 */
describe('the logo is the one in docs/logo', () => {
  it('draws the wordmark on the same box', () => {
    expect(svg('woordbeeld-inkt.svg')).toContain(
      `viewBox="0 0 ${LOCKUP.width} ${LOCKUP.height}"`,
    );
  });

  it('copies every letter path for path', () => {
    const file = svg('woordbeeld-inkt.svg');
    expect(LOCKUP_GLYPHS).toHaveLength(6);
    for (const glyph of LOCKUP_GLYPHS) {
      expect(file).toContain(`<path transform="translate(${glyph.x},0)" d="${glyph.d}">`);
    }
  });

  it('copies the wall of the vat, between the words and on its own', () => {
    expect(svg('woordbeeld-inkt.svg')).toContain(`d="${LOCKUP_VAT.wall}"`);
    expect(svg('merkteken-inkt.svg')).toContain(`d="${MERKTEKEN.wall}"`);
    expect(svg('merkteken-papier.svg')).toContain(`d="${MERKTEKEN.wall}"`);
    expect(svg('merkteken-klein-inkt.svg')).toContain(`d="${MERKTEKEN.solid}"`);
  });

  it('fills the vat to the half, where the designer clips it', () => {
    // The files clip a whole inner diamond at the middle line; logo.ts carries
    // the half that is left. Its bottom is the delivered edges, and it starts
    // and ends on the line the clip is drawn at.
    const woord = svg('woordbeeld-inkt.svg');
    expect(woord).toContain('<rect x="339" y="100"');
    expect(woord).toContain(lowerEdges(LOCKUP_VAT.peil));
    expect(LOCKUP_VAT.peil).toMatch(/^M[\d.]+,100 .* [\d.]+,100 Z$/);

    const merk = svg('merkteken-inkt.svg');
    expect(merk).toContain('<rect x="0" y="48"');
    expect(merk).toContain(lowerEdges(MERKTEKEN.peil));
    expect(MERKTEKEN.peil).toMatch(/^M[\d.]+,48 .* [\d.]+,48 Z$/);
  });
});
