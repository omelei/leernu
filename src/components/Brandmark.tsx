import { MERKTEKEN, MERKTEKEN_SOLID_BELOW_PX } from '@/design/logo';

/**
 * The merkteken: the logo without the name.
 *
 * A vat with a thin wall and softened points, filled to the half — the same
 * shape that stands between the words in the wordmark (docs/logo, ADR-108). It
 * is always filled to the half. A vat that fills up as a child learns would be
 * a second progress bar, and progress already has a shape of its own: the dot.
 *
 * Below 24px the wall and the level run into one grey, so the mark goes solid
 * there, as the designer's merkteken-klein does.
 *
 * Drawn rather than fetched. The delivered SVGs carry a C2PA manifest larger
 * than the drawing inside it, and an `<img>` is one more request, one more
 * thing to cache, and one more thing that renders as a broken box on a school
 * network that blocks it. This is three paths.
 *
 * Silent, always. It is only used where the wordmark is a step away, and a
 * screen reader that reads the brand name twice on one page is worse than one
 * that reads it once. A mark that needs a name is the wordmark's job.
 */
export function Brandmark({
  size = 32,
  tone = 'ink',
  className,
}: {
  readonly size?: number;
  /** Ink on paper, or paper on ink. Never a module accent. */
  readonly tone?: 'ink' | 'paper';
  readonly className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${MERKTEKEN.size} ${MERKTEKEN.size}`}
        fill={tone === 'ink' ? 'var(--ink)' : 'var(--paper)'}
        focusable="false"
      >
        {size < MERKTEKEN_SOLID_BELOW_PX ? (
          <path d={MERKTEKEN.solid} />
        ) : (
          <>
            <path fillRule="evenodd" d={MERKTEKEN.wall} />
            <path d={MERKTEKEN.peil} />
          </>
        )}
      </svg>
    </span>
  );
}
