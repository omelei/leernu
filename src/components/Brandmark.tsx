import { WORDMARK_FILL } from '@/design/dotGeometry';
import { Dot } from './Dot';

/**
 * The merkteken: the logo without the name.
 *
 * It is the dot at the wordmark's standing fill and nothing else, which is not
 * an approximation — `docs/Logo/leer-nu-merkteken-inkt.svg` is a ring of one
 * twelfth on a 96 canvas with the fill rising to 62%, and that is exactly what
 * `Dot` draws. Sharing the component with the progress bar, the map highlight
 * and the item status is the point: a child learns one shape and meets it
 * everywhere, and the mark cannot drift away from the rest of the product
 * because there is nothing to drift.
 *
 * Drawn rather than fetched. The delivered SVGs carry a C2PA manifest larger
 * than the drawing inside it, and an `<img>` is one more request, one more
 * thing to cache, and one more thing that renders as a broken box on a school
 * network that blocks it. This is a circle and some arithmetic.
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
  /** Ink on paper, or paper on ink. Never a module accent — see `Dot`. */
  readonly tone?: 'ink' | 'paper';
  readonly className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      <Dot size={size} fill={WORDMARK_FILL} tone={tone} />
    </span>
  );
}
