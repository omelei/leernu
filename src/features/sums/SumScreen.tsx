import { useEffect, useRef } from 'react';
import { t } from '@/i18n';
import { antwoordToestanden, sumText } from '@/game-core';
import { Button } from '@/components/Button';
import { AntwoordKnop, Laden } from '@/components/ds';
import { AntwoordVeld } from '@/features/round/AntwoordVeld';
import { Terugkoppeling } from '@/features/round/Terugkoppeling';
import { useRondeThema } from '@/features/round/useRondeThema';
import { Vraagbalk } from '@/features/round/Vraagbalk';
import { useSumRound, stopsOnAMistake, typesTheSum, type SumMode } from './useSumRound';
import { SumResultScreen } from './SumResultScreen';

/**
 * One round of a table (S5–S9 with the map taken out and the sum put in its
 * place). The question bar is the same bar, the diamonds are the same diamonds,
 * and what the child answers with sits under the canvas.
 *
 * The sum is the whole canvas, the way the map is on the other screen. It is
 * set large and in the display face with tabular figures, because a child
 * reads it from across a table and 7 × 8 has to be one glance rather than
 * three.
 */
export function SumScreen({
  setId,
  mode,
  aantal = null,
  toetsstand = false,
  onHome,
  onAgain,
}: {
  readonly setId: string;
  readonly mode: SumMode;
  /** How many sums the child asked for, or null for the round's own. */
  readonly aantal?: number | null;
  /**
   * Whether the round keeps its answers until the end (ADR-085). A round in
   * toetsstand never rests in the revealed phase, so every branch below that
   * draws feedback is simply never reached.
   */
  readonly toetsstand?: boolean;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const { state, submit, choose, next, stop } = useSumRound(setId, mode, aantal, toetsstand);
  const nextButton = useRef<HTMLButtonElement>(null);

  useRondeThema(state.error === null && state.phase !== 'finished');

  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="ln-titel">{t('practice.mapFailed')}</p>
        <Button onClick={onHome}>{t('result.home')}</Button>
      </main>
    );
  }

  if (state.phase === 'finished')
    return <SumResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="ln-ronde ln-ronde-laden" aria-busy="true">
        <Laden label={t('practice.loading')} />
      </main>
    );
  }

  const { sum } = state.question;
  const som = sumText(sum);
  const revealed = state.phase === 'revealed';
  const typing = typesTheSum(mode);
  const spoken = `${som}. ${t('sums.prompt')}`;

  const toestanden = revealed
    ? antwoordToestanden(
        state.given === null ? null : String(state.given),
        String(sum.antwoord),
      )
    : null;

  return (
    <div className="ln-ronde" data-module="tafels">
      <Vraagbalk
        vraag={t('sums.prompt')}
        voorlezen={spoken}
        index={state.index}
        totaal={state.rule.kind === 'fixed' ? state.total : null}
        beantwoord={state.index + (revealed ? 1 : 0)}
        goed={state.correctCount}
        onStop={stop}
      />

      {/* Announced separately from the heading, so a screen reader hears every
          new sum rather than only the first. */}
      <p className="ln-sr-only" role="status" aria-live="polite">
        {revealed ? spokenFeedback(state.lastCorrect, som, sum.antwoord, state.given) : spoken}
      </p>

      <div className="ln-canvas ln-canvas-midden">
        <p className="tk-sum tk-display tabular-nums">{som}</p>
      </div>

      <div className="ln-ronde-paneel">
        {!typing ? (
          <div className="ln-antwoorden" role="group" aria-label={t('sums.chooseQuestion')}>
            {(state.question.options ?? []).map((option) => (
              <AntwoordKnop
                key={option}
                toestand={toestanden?.get(String(option)) ?? null}
                disabled={revealed}
                onClick={() => choose(option)}
              >
                {option}
              </AntwoordKnop>
            ))}
          </div>
        ) : null}

        {typing && !revealed ? (
          <AntwoordVeld
            key={state.index}
            label={t('sums.typeQuestion')}
            placeholder={t('sums.typePlaceholder')}
            inputMode="numeric"
            maxLength={4}
            onSubmit={submit}
          />
        ) : null}

        {revealed ? (
          <Terugkoppeling
            toestand={state.lastCorrect ? 'goed' : 'fout'}
            kop={
              state.lastCorrect
                ? t('sums.correct', { som, antwoord: sum.antwoord })
                : t('sums.wrong', { som, antwoord: sum.antwoord })
            }
            detail={
              state.lastCorrect
                ? undefined
                : state.given === null
                  ? t('sums.dontKnowSub')
                  : t('sums.wrongSub', { gegeven: state.given })
            }
            // A diploma ends here, so the button says so. "Volgende vraag" on a
            // button that shows a result is the kind of small lie a child
            // notices once and then stops trusting.
            knop={
              state.rule.kind === 'tijd'
                ? null
                : stopsOnAMistake(mode) && !state.lastCorrect
                  ? t('sums.diplomaStop')
                  : t('practice.next')
            }
            onVolgende={next}
            knopRef={nextButton}
          />
        ) : null}
      </div>
    </div>
  );
}

/** What a screen reader hears once the answer is in. */
function spokenFeedback(
  correct: boolean,
  som: string,
  antwoord: number,
  given: number | null,
): string {
  if (correct) return t('sums.correct', { som, antwoord });
  const detail = given === null ? t('sums.dontKnowSub') : t('sums.wrongSub', { gegeven: given });
  return `${t('sums.wrong', { som, antwoord })} ${detail}`;
}
