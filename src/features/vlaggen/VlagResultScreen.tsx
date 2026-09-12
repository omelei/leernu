import { vlagdiplomaDrempel } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { Uitslag } from '@/features/round/Uitslag';
import type { VlagRoundState } from './useVlagRound';

/**
 * The result of a round of flags (S10), with the vlaggendiploma where this was
 * one: earned, or how far off it was, in right answers (ADR-104). The rows name
 * the flags; after an oefentoets the mark stands beside them.
 *
 * The flags still to practise, drawn, give way: S10 draws one card of rows.
 */
export function VlagResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: VlagRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const namen = new Map(state.items.map((vlag) => [vlag.id, vlag.naam]));

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
      module="vlaggen"
      extra={
        state.mode === 'vlag-diploma' && state.reward ? (
          state.reward.vlagDiploma ? (
            <p className="ln-titel">
              {t('vlag.diplomaEarned', {
                deel: t(`regio.${state.reward.vlagDiploma}` as TranslationKey),
              })}
            </p>
          ) : (
            <p className="ln-tekst">
              {t('vlag.diplomaMissed', {
                goed: state.correctCount,
                totaal: state.total,
                nodig: vlagdiplomaDrempel(state.total),
              })}
            </p>
          )
        ) : null
      }
      onHome={onHome}
      onAgain={onAgain}
    />
  );
}
