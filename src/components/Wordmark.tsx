import { brand } from '@/config/brand';
import { LOCKUP, LOCKUP_GLYPHS, LOCKUP_MIN_PX, LOCKUP_VAT } from '@/design/logo';

/**
 * The wordmark: leer, the vat, nu.
 *
 * Drawn, not set. The letters are the designer's own outlines (docs/logo,
 * ADR-108), copied path for path into src/design/logo.ts, so the name is the
 * same on every machine and needs no font at all. The vat between the words is
 * the merkteken at wordmark size, filled to the half and never to anything else:
 * showing progress is the dot's job, not the logo's.
 *
 *   height        set the height, the width follows (642 : 140)
 *   minimum       26px high; below that the level in the vat closes up
 *   clear space   half the width of the vat, on all four sides
 *   case          always lower, including at the start of a sentence
 *
 * The mark never takes a module accent. What a module changes is the path behind
 * the name — leer.nu/topo — and nothing about the mark itself.
 */

/** Half the vat's width, 80 of the 140 the drawing is high. */
const CLEAR_SPACE = 40 / LOCKUP.height;
/** The drawn letters' x-height, 100 of 140. */
const X_HEIGHT = 100 / LOCKUP.height;
/** Public Sans's x-height, 1034 units of 2000. */
const QUIET_X_HEIGHT = 1034 / 2000;

export interface WordmarkProps {
  /** Height in px, never below 26. The width follows from it. */
  readonly height?: number;
  /** Ink on paper, or paper on ink. Never an accent. */
  readonly tone?: 'ink' | 'paper';
  /**
   * The clear space the logo asks for: half the width of the vat on all four
   * sides. On by default, because a rule that has to be remembered at every
   * call site is a rule that gets forgotten at one of them.
   */
  readonly clearSpace?: boolean;
  /**
   * The module path behind the name, without the slash — "topo" renders
   * leer.nu/topo. Only inside the module itself and in navigation: never on a
   * website header, an app icon or an invoice.
   */
  readonly path?: string;
  readonly className?: string;
}

export function Wordmark({
  height = 32,
  tone = 'ink',
  clearSpace = true,
  path,
  className,
}: WordmarkProps) {
  const drawn = Math.max(LOCKUP_MIN_PX, height);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        color: tone === 'ink' ? 'var(--inkt)' : 'var(--kaart)',
        padding: clearSpace ? `${drawn * CLEAR_SPACE}px` : undefined,
      }}
    >
      {/* One accessible name for the whole mark. The drawing is hidden, so the
          name is read as a word and not as a picture of one. */}
      <span className="tk-sr-only">{path ? `${brand.name}/${path}` : brand.name}</span>

      {/* An SVG's baseline is its bottom edge, which is where the letters stand,
          so the path behind the name lines up on the same baseline. The
          overshoot of the round letters, 2 below it, is drawn outside the box
          as the designer drew it. */}
      <svg
        width={(LOCKUP.width / LOCKUP.height) * drawn}
        height={drawn}
        viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`}
        fill="currentColor"
        overflow="visible"
        aria-hidden="true"
        focusable="false"
      >
        {LOCKUP_GLYPHS.map((glyph) => (
          <path key={glyph.x} transform={`translate(${glyph.x},0)`} d={glyph.d} />
        ))}
        <path fillRule="evenodd" d={LOCKUP_VAT.wall} />
        <path d={LOCKUP_VAT.peil} />
      </svg>

      {path ? (
        // The quiet family at 400 in tertiary ink, with its x-height matched to
        // the drawn letters, so the name keeps the emphasis and "leer.nu/topo"
        // still reads as one line: leer nu topo.
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-tekst)',
            fontWeight: 400,
            fontSize: `${(drawn * X_HEIGHT) / QUIET_X_HEIGHT}px`,
            color: 'var(--tekst-tertiair)',
          }}
        >
          /{path}
        </span>
      ) : null}
    </span>
  );
}
