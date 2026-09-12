import { useEffect, useState } from 'react';
import { StarIcon } from '@/components/Icon';
import { GOED_PER_STER, goedInSter } from '@/game-core';
import { t } from '@/i18n';
import { loadAccuracy } from '@/store/progress';

/**
 * The star being filled, in the round bar (ADR-099).
 *
 * Ten correct answers are a star, and until this there was nowhere between two
 * rewards where a child could see one coming: the stars were on the result
 * screen and the collection page, and the round itself said nothing about them.
 * A ladder whose rungs are two hundred answers apart with nothing in between is
 * the shape of the problem the September redesign was for.
 *
 * It counts rather than moves. A count is what the rest of this bar does, and a
 * third animation in a product that has two on purpose would need an argument
 * this does not have (ADR-084).
 *
 * The total before the round is read once, when the round opens, and the
 * round's own correct answers are added to it. Reading it again mid-round would
 * count them twice, because they are written to the store as they are given.
 */
export function SterTeller({ correct }: { readonly correct: number }) {
  const [voor, setVoor] = useState<number | null>(null);

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setVoor(accuracy.correct));
  }, []);

  // Nothing until it is known. A counter that starts at nought and then jumps
  // has told a child something that was not true.
  if (voor === null) return null;

  const goed = voor + correct;
  const inSter = goedInSter(goed);
  // Exactly on a ten, and the star that was being filled is full. It is full
  // for one answer, which is the moment it is there to mark.
  const vol = goed > 0 && inSter === 0;

  return (
    <div className="flex flex-col items-end">
      <span className="tk-label">{t('practice.counterStar')}</span>
      <span className="flex items-center gap-2">
        <span className="tk-sterren-rij" aria-hidden="true">
          <span className={vol ? 'tk-ster tk-ster-vol' : 'tk-ster'}>
            <StarIcon size={20} />
          </span>
        </span>
        <b className="tk-display text-sectiekop tabular-nums">
          {t('practice.counterStarValue', { aantal: inSter, totaal: GOED_PER_STER })}
        </b>
      </span>
    </div>
  );
}
