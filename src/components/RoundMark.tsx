import { formatGrade, grade } from '@/game-core';
import { t } from '@/i18n';

/**
 * The mark, on the one round that has earned one.
 *
 * Every round in this product is scored and every one of them is logged with a
 * cijfer on the front door. What no round screen has ever done is *give* a
 * mark, and the reason is ADR-053's: a mark is a judgement, and a round where
 * the app told you the answer half a second after every question is not a round
 * whose mark means anything about you.
 *
 * A toetsstand is (ADR-085). Nothing helped, nothing was corrected on the way,
 * and what came out the other end is a number a child can compare with the one
 * they will get at school — which is the whole reason for practising that way.
 *
 * Over what was answered rather than what was asked, the same as everywhere
 * else: a round stopped early asked questions nobody got wrong.
 */
export function RoundMark({ goed, totaal }: { readonly goed: number; readonly totaal: number }) {
  const cijfer = grade(goed, totaal);
  if (cijfer === null) return null;

  return (
    <p className="tk-cijfer">
      <span className="tk-label">{t('result.markLabel')}</span>
      <span className="tk-display text-getal-groot tabular-nums">{formatGrade(cijfer)}</span>
      <span className="tk-cijfer-why">{t('result.markWhy')}</span>
    </p>
  );
}
