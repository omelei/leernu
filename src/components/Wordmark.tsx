import { brand } from '@/config/brand';
import { WORDMARK_DOT_RATIO, WORDMARK_FILL } from '@/design/dotGeometry';
import { Dot } from './Dot';

/**
 * The wordmark: leer, the dot, nu.
 *
 * Live text rather than an image, and deliberately so.
 *
 * The delivered wordmark SVGs set the name as <text> in
 * font-family="Space Grotesk, sans-serif", with no font attached and nothing
 * embedded. That makes no third-party request — checked, and worth saying,
 * because it was expected to and it does not — but it does mean the file only
 * renders correctly on a machine that happens to have the face installed, and
 * falls back to whatever sans-serif is to hand everywhere else. Set as text in
 * the self-hosted face, neither problem exists.
 *
 * Measurements are read off the drawings rather than §A's prose, because the
 * two disagree. The prose says the dot is 41% of the x-height; every drawing
 * puts it at 41% of the font size — 36 at 88, 26 at 64, 41 at 100. A logo is
 * what it looks like, so the drawings win. Flagged for the styleguide.
 *
 *   font          Space Grotesk 700, letter-spacing -3.5%, line-height 1
 *   dot           41% of the font size, sitting on the baseline
 *   spacing       6px either side of the dot at 88px, so 0.068em
 *   fill          62%, and in the wordmark never animated
 *   case          always lower, including at the start of a sentence
 *   clear space   one dot diameter on all four sides
 *   minimum       72px wide on screen
 *
 * The dot never takes a module accent. What a module changes is the path behind
 * the name — leer.nu/topo — and nothing about the mark itself.
 */

/** §A: 2px flex gap plus 4px margin either side of the dot, at 88px. */
const DOT_MARGIN_EM = 0.068;

export interface WordmarkProps {
  /** Font size in px. The dot and the spacing are derived from it. */
  readonly size?: number;
  /** Ink on paper, or paper on ink. Never an accent. */
  readonly tone?: 'ink' | 'paper';
  /**
   * The clear space §A requires: one dot diameter on all four sides. On by
   * default, because a rule that has to be remembered at every call site is a
   * rule that gets forgotten at one of them.
   */
  readonly clearSpace?: boolean;
  /**
   * The module path behind the name, without the slash — "topo" renders
   * leer.nu/topo. §A allows this only inside the module itself and in
   * navigation: never on a website header, an app icon or an invoice.
   */
  readonly path?: string;
  readonly className?: string;
}

export function Wordmark({
  size = 40,
  tone = 'ink',
  clearSpace = true,
  path,
  className,
}: WordmarkProps) {
  const dotSize = Math.round(size * WORDMARK_DOT_RATIO);
  const colour = tone === 'ink' ? 'var(--ink)' : 'var(--paper)';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: `${size}px`,
        letterSpacing: '-0.035em',
        lineHeight: 1,
        color: colour,
        padding: clearSpace ? `${dotSize}px` : undefined,
      }}
    >
      {/* One accessible name for the whole mark. The dot is a letter here, not
          information, so it stays hidden and the name is read as a word. */}
      <span className="tk-sr-only">{path ? `${brand.name}/${path}` : brand.name}</span>

      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'baseline' }}>
        leer
        {/* The margin lives on a wrapper rather than on the dot: the dot is one
            shape used in six places, and spacing is a property of this one. */}
        <span style={{ display: 'inline-flex', margin: `0 ${DOT_MARGIN_EM}em` }}>
          <Dot size={dotSize} fill={WORDMARK_FILL} tone="inherit" />
        </span>
        nu
      </span>

      {path ? (
        // The quiet family at 400 in tertiary ink, so the name keeps the
        // emphasis and "leer.nu/topo" still reads as a sentence: leer nu topo.
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: 0,
            color: 'var(--ink-3)',
          }}
        >
          /{path}
        </span>
      ) : null}
    </span>
  );
}
