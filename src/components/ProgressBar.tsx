/**
 * voortgangsbalk: a rail and a fill in the accent.
 *
 * It measures progress towards something — the next chest — and never
 * retention, which is the dot's alone (README, "De punt"). It used to end in a
 * dot at the bar's own fill; that made the dot mean progress as well, which is
 * the one thing the handoff forbids it.
 */

export interface ProgressBarProps {
  /** 0 to 1. Clamped, because a figure from a store is not a promise. */
  readonly value: number;
  /** What a screen reader says. A bar with no name is decoration. */
  readonly label: string;
  readonly className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const filled = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = Math.round(filled * 100);

  // Spans all the way down, so the bar is legal inside a button.
  return (
    <span
      className={['ln-balk', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      // With the unit, because "62" read on its own is a bare number.
      aria-valuetext={`${percent}%`}
    >
      <span className="ln-balk-vul" style={{ width: `${percent}%` }} />
    </span>
  );
}
