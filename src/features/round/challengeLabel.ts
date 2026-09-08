import { t, type TranslationKey } from '@/i18n';
import type { RoundRule } from '@/game-core';

/**
 * A challenge chip carries its own measure: "Bliksemronde · 60 s", "Overleven ·
 * 3 levens". K2 draws it that way, and it is the difference between a name a
 * child has to have been told and a name that says what it costs.
 *
 * The number comes from the rule rather than from the copy, so a round whose
 * clock is changed cannot end up with a chip that still claims sixty seconds.
 */
export function challengeLabel(name: TranslationKey, rule: RoundRule): string {
  const naam = t(name);

  if (rule.kind === 'tijd') return t('challenge.tijd', { naam, seconden: rule.seconden });
  if (rule.kind === 'levens') return t('challenge.levens', { naam, aantal: rule.levens });
  return naam;
}
