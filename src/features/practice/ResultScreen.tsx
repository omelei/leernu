import { Uitslag } from '@/features/round/Uitslag';
import type { RoundState } from './useRound';

/**
 * The result of a round on the map (S10). What changed is the card of three
 * rows; the names are the places'.
 *
 * The review map that stood beside the list gives way: S10 draws one card and
 * no map, and the rows name the places that keep changing.
 */
export function ResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: RoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const namen = new Map(state.items.map((item) => [item.id, item.naam]));

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
      module="topo"
      onHome={onHome}
      onAgain={onAgain}
    />
  );
}
