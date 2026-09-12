/**
 * A counter in the round bar: what is running out, how many are right, the run.
 *
 * One component for all four round screens, which each carried their own copy
 * of these thirty lines.
 *
 * `urgent` is never the only signal that something is running out: the number
 * itself is already counting down in plain sight, and a child who cannot tell
 * the red from the ink still reads "0:07".
 */
export function Counter({
  label,
  value,
  urgent = false,
  onlyWide = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly urgent?: boolean;
  /**
   * Kept off the phone. The round bar at 393 cannot hold the stop, the dots,
   * the read-aloud button and a counter as well, and of those the combo is the
   * one that says nothing at the start of a round.
   */
  readonly onlyWide?: boolean;
}) {
  return (
    <div className={onlyWide ? 'hidden flex-col items-end md:flex' : 'flex flex-col items-end'}>
      <span className="tk-label">{label}</span>
      <b
        className={
          urgent
            ? 'tk-display text-sectiekop tabular-nums text-fout'
            : 'tk-display text-sectiekop tabular-nums'
        }
      >
        {value}
      </b>
    </div>
  );
}
