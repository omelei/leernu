import { t } from '@/i18n';
import { metPremium } from '@/features/module/premium';
import { PremiumLabel } from '@/features/module/PremiumLabel';

/**
 * "Herhaal je fouten", on every result screen that has a miss to repeat.
 *
 * Beside "Nog een ronde" rather than instead of it, and secondary: another
 * round is still the way on, and this is the shorter way back over what just
 * went wrong — exactly those, straight away, while the child still remembers
 * getting them wrong (ADR-111). Premium, like the list of mistakes on the
 * module page; the label is there before the account is.
 */
export function HerhaalFouten({
  missed,
  onHerhaal,
}: {
  readonly missed: readonly { readonly id: string }[];
  readonly onHerhaal: (ids: readonly string[]) => void;
}) {
  if (missed.length === 0) return null;

  return (
    <button
      type="button"
      className="tk-button tk-button-secondary"
      aria-label={metPremium(t('result.herhaalFouten'), true)}
      onClick={() => onHerhaal(missed.map((item) => item.id))}
    >
      <span className="inline-flex items-center gap-2">
        {t('result.herhaalFouten')}
        <PremiumLabel />
      </span>
    </button>
  );
}
