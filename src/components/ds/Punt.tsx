import { t } from '@/i18n';
import { puntProcent, puntVulling, type PuntMaat } from './meten';

/**
 * De punt: the product's mark, and the retention meter (README, "De punt").
 *
 * It shows how much of something a child remembers and nothing else — never a
 * score, never a speed, never how far a round has got (that is the diamond's
 * job). A circle whose fill is `conic-gradient(<accent> 0 <pct>%, <leeg> …)`,
 * at one of the seven sizes in use.
 *
 * **No value, no dot.** A set that has never been touched has no retention,
 * and zero is not the same thing: pass `null` and nothing is drawn (ADR-107).
 * The dot is never filled with another figure to have something to show.
 */
export function Punt({
  procent,
  maat = 28,
  label,
  className,
}: {
  readonly procent: number | null;
  readonly maat?: PuntMaat | undefined;
  /** What a screen reader hears; by default "75% onthouden". */
  readonly label?: string | undefined;
  readonly className?: string | undefined;
}) {
  if (procent === null) return null;
  const pct = puntProcent(procent);

  return (
    <span
      role="img"
      aria-label={label ?? t('ds.punt', { procent: pct })}
      className={['ln-punt', className].filter(Boolean).join(' ')}
      style={{ width: maat, height: maat, background: puntVulling(pct) }}
    />
  );
}
