import { STERREN_PER_KIST } from '@/game-core';
import { t } from '@/i18n';
import { StarIcon } from './Icon';

/**
 * Five stars, as many filled as the next chest has.
 *
 * Drawn in gold because it is a reward, and hidden from the accessibility tree
 * because the sentence beside it says the same thing in words.
 *
 * It lives here rather than beside the result screen because since ADR-099 it
 * is in three places: the screen after a round, the child's own column on every
 * screen, and the collection page. A component that three features import is a
 * component, not part of one of them.
 *
 * Three ways of saying it. After a round the sentence names the chest ("3 van
 * de 5 sterren voor je volgende kist"). On "Jouw voortgang" it is short ("3 van
 * de 5 sterren"), because the large sentence under it is about the chest. And
 * inside a row that is itself a button it says nothing, and the row says it for
 * the stars — a paragraph inside a button is neither.
 */
export function Sterren({
  inKist,
  grootte = 24,
  zin = 'kist',
}: {
  readonly inKist: number;
  /** The side of one star in px: 24 after a round, 15 in a row, 32 at the top of a page. */
  readonly grootte?: number;
  readonly zin?: 'kist' | 'kort' | 'geen';
}) {
  const rij = (
    <span className="tk-sterren-rij" aria-hidden="true">
      {Array.from({ length: STERREN_PER_KIST }, (_, ster) => (
        <span key={ster} className={ster < inKist ? 'tk-ster tk-ster-vol' : 'tk-ster'}>
          <StarIcon size={grootte} />
        </span>
      ))}
    </span>
  );

  if (zin === 'geen') return rij;

  return (
    <p className="tk-sterren">
      {rij}
      <span>
        {zin === 'kort'
          ? t('reis.sterrenStand', { aantal: inKist, totaal: STERREN_PER_KIST })
          : t('result.sterStand', { aantal: inKist, totaal: STERREN_PER_KIST })}
      </span>
    </p>
  );
}
