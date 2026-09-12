import { t } from '@/i18n';

/**
 * The word on whatever will need an account (ADR-110).
 *
 * Hidden from a screen reader on a control whose own name already ends with it
 * (`metPremium`), so it is not heard twice; heard where it stands beside a
 * heading, which has no name to carry it.
 */
export function PremiumLabel({ hoorbaar = false }: { readonly hoorbaar?: boolean }) {
  return (
    <span className="tk-premium" aria-hidden={hoorbaar ? undefined : true}>
      {t('premium.label')}
    </span>
  );
}
