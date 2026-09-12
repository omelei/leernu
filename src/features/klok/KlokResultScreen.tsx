import { Uitslag } from '@/features/round/Uitslag';
import { klokVoluit } from './klokTaal';
import type { KlokRoundState } from './useKlokRound';

/**
 * The result of a round of the clock (S10). The rows name the times in words.
 *
 * The faces of the times still to practise give way: S10 draws one card of
 * rows, and the row that keeps changing names them.
 */
export function KlokResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: KlokRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const namen = new Map(state.items.map((tijd) => [tijd.id, klokVoluit(tijd)]));

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
      module="klok"
      onHome={onHome}
      onAgain={onAgain}
    />
  );
}
