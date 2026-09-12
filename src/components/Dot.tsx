/**
 * The dot. One shape, and very nearly the whole product.
 *
 * It is the highlight on the map, the progress bar, the retention indicator and
 * the item status — and the half-filled dot is also the shape of the "Bijna"
 * answer state. It was the logo too, until ADR-108 gave the logo a shape of its
 * own; that is what freed it to mean only "how far along". That last overlap is not a coincidence to
 * be tidied away: a dot half full means "practised, not yet certain" in the
 * table on K9 and "nearly right" after an answer, and those are the same idea.
 * Which is why there is one component and not two that look alike.
 *
 * Geometry, styleguide §A:
 *
 *   ring thickness   one twelfth of the diameter
 *   fill             from the bottom, as a proportion
 *   at and below 20  the fill drops away: a solid core with 1px of air inside
 *                    the ring
 *   below 16         solid, no ring at all
 *   in negative      the ring is 10% heavier, against reading optically thinner
 *
 * That is the only simplification allowed. Nothing else about the shape changes
 * with size, and it never takes a module accent — the dot is ink on paper or
 * paper on ink, identical in every module. What distinguishes a module is the
 * accent on the highlight, the progress bar and the module entrance, plus the
 * path behind the name.
 */

import { useId } from 'react';
import { CORE_GAP_PX, dotGeometry, FILL_FLOOR_PX, RING_FLOOR_PX } from '@/design/dotGeometry';

export interface DotProps {
  /**
   * How full, 0 to 1. Clamped rather than trusted: this is fed by a retention
   * figure, and a bar that renders past its own ring because a percentage came
   * back as 1.02 is a bug that looks like a design decision.
   */
  readonly fill?: number;
  /** Diameter in px. */
  readonly size?: number;
  /**
   * Ink on paper, or paper on ink. Anything else — including a module accent —
   * is wrong, which is why this is two values and not a colour.
   *
   * `inherit` takes the surrounding text colour, for a dot that stands in a
   * line of text and should follow it wherever it goes.
   */
  readonly tone?: 'ink' | 'paper' | 'inherit';
  /**
   * What a screen reader should say. Left out, the dot is decorative and hidden
   * — which is right beside text that already says what it shows, and wrong
   * for a retention indicator, where the dot _is_ the information.
   */
  readonly label?: string;
  readonly className?: string;
}

const TONE_COLOUR = {
  ink: 'var(--ink)',
  paper: 'var(--paper)',
  inherit: 'currentColor',
} as const;

export function Dot({ fill = 1, size = 24, tone = 'ink', label, className }: DotProps) {
  // Unique per instance. Two dots of the same size and fill would otherwise
  // share a clip-path id, which is invalid markup and something axe will say so
  // about, even though it happens to render correctly.
  //
  // The colons are stripped because React's ids look like ":r0:", and a colon
  // inside url(#...) is where SVG references have historically come apart in
  // WebKit — which CI runs on purpose, because an iPad in a classroom is Safari.
  const clipId = useId().replace(/:/g, '');

  const filled = Math.min(1, Math.max(0, fill));
  const colour = TONE_COLOUR[tone];

  // The arithmetic lives in src/design/dotGeometry.ts, where it is pinned
  // against the numbers the designer delivered. Paper on ink is the negative
  // case, where the ring is 10% heavier against reading optically thinner.
  const { ring, radius, innerRadius, fillTop, fillHeight } = dotGeometry(
    size,
    filled,
    tone === 'paper',
  );

  const centre = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      focusable="false"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label ? <title>{label}</title> : null}

      {size < RING_FLOOR_PX ? (
        // Solid. At this size a ring and a fill are two greys pretending to be
        // a diagram.
        <circle cx={centre} cy={centre} r={size / 2} fill={colour} />
      ) : (
        <>
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke={colour}
            strokeWidth={ring}
          />

          {size < FILL_FLOOR_PX ? (
            <circle cx={centre} cy={centre} r={innerRadius - CORE_GAP_PX} fill={colour} />
          ) : (
            <>
              {/* The fill rises from the bottom of the inner circle, clipped to
                  it, so it reads as a vessel filling rather than a pie chart
                  turning. A child watching this should see a level, not an
                  angle. */}
              <clipPath id={clipId}>
                <circle cx={centre} cy={centre} r={innerRadius} />
              </clipPath>
              <rect
                x={0}
                y={fillTop}
                width={size}
                height={fillHeight}
                fill={colour}
                clipPath={`url(#${clipId})`}
              />
            </>
          )}
        </>
      )}
    </svg>
  );
}
