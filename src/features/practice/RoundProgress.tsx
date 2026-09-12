import { t } from '@/i18n';

/**
 * Ten dots, at the top of every size.
 *
 * They are the progress bar of §B — one of exactly three things a module may
 * colour — drawn as a row rather than a rail because a round is a countable
 * number of questions and a child can see at a glance how many are left.
 *
 * Answered is filled, the one being asked is a ring, the rest are the empty
 * track. An indication and not a control: they shrink to 14px on a phone rather
 * than claiming a hit target, because there is nothing to press.
 *
 * The endless modes have no ten to count towards, so they get nothing here and
 * their counters carry it instead.
 */
export function RoundProgress({
  total,
  index,
  answered,
}: {
  readonly total: number;
  /** Which question is being asked, from zero. */
  readonly index: number;
  /** How many have been answered, which is index plus one once revealed. */
  readonly answered: number;
}) {
  return (
    <div
      className="tk-round-dots"
      role="progressbar"
      aria-label={t('a11y.progress')}
      aria-valuenow={answered}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuetext={t('practice.questionOf', { nu: index + 1, totaal: total })}
    >
      {Array.from({ length: total }, (_, n) => (
        <span
          key={n}
          aria-hidden="true"
          className={[
            'tk-round-dot',
            n < answered ? 'tk-round-dot-done' : null,
            n === index && n >= answered ? 'tk-round-dot-now' : null,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  );
}
