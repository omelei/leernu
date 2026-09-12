import { Dot } from './Dot';

/**
 * The progress bar is the dot, drawn sideways.
 *
 * That is not a metaphor for the comment: the end point is a real `Dot` at the
 * same fill as the bar, so the two read as one idea. A child who has learned
 * that a full dot means "you remember this" gets the bar for free.
 *
 * The accent is allowed here. It is one of exactly three places a module may
 * colour anything — the highlight on the image, this, and the module entrance.
 */

export interface ProgressBarProps {
  /** 0 to 1. Clamped, because a percentage from a store is not a promise. */
  readonly value: number;
  /**
   * What a screen reader should say. A bar with no name is a decoration, and a
   * decoration should not be in the accessibility tree at all.
   */
  readonly label: string;
  /** The dot at the end. Off where the bar is a rail inside something else. */
  readonly showDot?: boolean;
  readonly className?: string;
}

export function ProgressBar({ value, label, showDot = true, className }: ProgressBarProps) {
  const filled = Math.min(1, Math.max(0, value));
  const percent = Math.round(filled * 100);

  // Spans rather than divs, all the way down. A progress bar belongs inside a
  // module tile on K1, a tile is a button, and a button may only contain
  // phrasing content — a div there is markup no validator accepts and every
  // browser quietly forgives. Nothing about the drawing changes: the rail is a
  // flex item and the fill is displayed as a block in the stylesheet.
  return (
    <span className={['tk-progress', className].filter(Boolean).join(' ')}>
      <span
        className="tk-progress-rail"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        // The percentage in words as well as in the number, because "62" on its
        // own is read out as a bare figure with no unit.
        aria-valuetext={`${percent}%`}
      >
        <span className="tk-progress-fill" style={{ width: `${percent}%` }} />
      </span>

      {showDot ? <Dot size={24} fill={filled} /> : null}
    </span>
  );
}
