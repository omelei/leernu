import { t } from '@/i18n';
import { sumText } from '@/game-core';
import { Uitslag } from '@/features/round/Uitslag';
import type { SumRoundState } from './useSumRound';

/**
 * The result of a round of sums (S10), with the one thing only the tables
 * have: the diploma, earned or not. The rows name the sums.
 */
export function SumResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: SumRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const namen = new Map(state.items.map((sum) => [sum.id, sumText(sum)]));

  return (
    <Uitslag
      voor={state.voor}
      na={state.na}
      naamVan={(id) => namen.get(id)}
      goed={state.correctCount}
      beantwoord={state.answeredCount}
      totaal={state.rule.kind === 'fixed' ? state.total : null}
      fouten={state.missed.length}
      toetsstand={state.toetsstand}
      reward={state.reward}
      streak={state.streak}
      module="tafels"
      extra={
        state.reward?.diploma ? (
          <p className="ln-titel">{t('sums.diplomaEarned', { tafel: state.reward.diploma })}</p>
        ) : state.mode === 'tafeldiploma' ? (
          <p className="ln-tekst">{t('sums.diplomaMissed')}</p>
        ) : null
      }
      onHome={onHome}
      onAgain={onAgain}
    />
  );
}
