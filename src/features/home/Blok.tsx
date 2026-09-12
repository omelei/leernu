import type { ReactNode } from 'react';

/**
 * The shape every block in the child's own column has (ADR-094): a card with a
 * band across the top that names it, and the block itself under the band.
 *
 * The band is the block's heading and its landmark name at once, so the four of
 * them are four regions a screen reader can jump between — "Jouw toetsen",
 * "Jouw voortgang" — and four a test can find by the word a child reads.
 */
export function Blok({
  titel,
  module,
  bezig = false,
  className,
  children,
}: {
  readonly titel: string;
  /**
   * The module this block is about, where it is about one. It resolves
   * `--accent` for everything inside, and it is how the block says which.
   */
  readonly module?: string | undefined;
  /**
   * Still reading what goes in it. The card is drawn at once and stays empty
   * until it knows, rather than being absent: on WebKit the read takes long
   * enough to see, and a block that arrives late moves everything under it —
   * and on a tablet it left the tests alone on half the row.
   */
  readonly bezig?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <section
      className={['tk-blok', className].filter(Boolean).join(' ')}
      aria-label={titel}
      aria-busy={bezig || undefined}
      data-module={module}
    >
      <h2 className="tk-label tk-blok-kop">{titel}</h2>
      <div className="tk-blok-body">{children}</div>
    </section>
  );
}
