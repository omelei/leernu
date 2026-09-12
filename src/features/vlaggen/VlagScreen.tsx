import { useEffect, useRef } from 'react';
import { t } from '@/i18n';
import { antwoordToestanden, type VlagItem } from '@/game-core';
import { Button } from '@/components/Button';
import { AntwoordKnop, Laden } from '@/components/ds';
import { Terugkoppeling } from '@/features/round/Terugkoppeling';
import { useRondeThema } from '@/features/round/useRondeThema';
import { Vraagbalk } from '@/features/round/Vraagbalk';
import { Vlag } from './Vlag';
import { VlagResultScreen } from './VlagResultScreen';
import { useVlagRound, type VlagMode } from './useVlagRound';

/**
 * One round of flags (S5–S9 with a flag in the place of the map).
 *
 * **Two directions, as on the clock.** "Vlag zoeken" puts a name in the heading
 * and flags on the canvas; "Meerkeuze" puts one flag on the canvas and four
 * names under it. The oefentoets alternates, question by question.
 *
 * **No flag on the canvas is named by its picture.** Where flags are the
 * options, each one is read out as its description — "drie liggende banen:
 * rood, wit en blauw" — because reading out its name would answer the
 * question. The name comes with the feedback.
 */
export function VlagScreen({
  setId,
  mode,
  aantal = null,
  toetsstand = false,
  onHome,
  onAgain,
}: {
  readonly setId: string;
  readonly mode: VlagMode;
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
  const { state, choose, next, stop } = useVlagRound(setId, mode, aantal, toetsstand);
  const nextButton = useRef<HTMLButtonElement>(null);

  useRondeThema(state.error === null && state.phase !== 'finished');

  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="ln-titel">{t('vlag.failed')}</p>
        <Button onClick={onHome}>{t('result.home')}</Button>
      </main>
    );
  }

  if (state.phase === 'finished') {
    return <VlagResultScreen state={state} onHome={onHome} onAgain={onAgain} />;
  }

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="ln-ronde ln-ronde-laden" aria-busy="true">
        <Laden label={t('vlag.loading')} />
      </main>
    );
  }

  const { vlag, richting, opties } = state.question;
  const revealed = state.phase === 'revealed';
  const zoeken = richting === 'zoeken';
  const provincie = vlag.werelddelen.includes('nederland');

  const instruction = zoeken
    ? t('vlag.zoekLabel')
    : provincie
      ? t('vlag.meerkeuzeLabelProvincie')
      : t('vlag.meerkeuzeLabelLand');
  // The name out loud only where the name is the question. Where the flag is
  // the question, saying the name would be the answer.
  const spoken = zoeken ? `${vlag.naam}. ${instruction}` : instruction;

  const toestanden = revealed ? antwoordToestanden(state.given?.id ?? null, vlag.id) : null;

  return (
    <div className="ln-ronde" data-module="vlaggen">
      <Vraagbalk
        // The heading is the question when a name is asked for a flag: the
        // name itself, and flags on the canvas to choose from.
        vraag={zoeken ? vlag.naam : t('vlag.prompt')}
        voorlezen={spoken}
        index={state.index}
        totaal={state.rule.kind === 'fixed' ? state.total : null}
        beantwoord={state.index + (revealed ? 1 : 0)}
        goed={state.correctCount}
        onStop={stop}
      />

      {/* Announced separately from the heading, so a screen reader hears every
          new question rather than only the first. */}
      <p className="ln-sr-only" role="status" aria-live="polite">
        {revealed ? spokenFeedback(state.lastCorrect, vlag, state.given, zoeken) : spoken}
      </p>

      {/* The flags to choose from, two by two — three by two where there are
          six — or the one flag the question is about, and after an answer the
          right one. */}
      <div className="ln-canvas ln-canvas-midden">
        {zoeken && !revealed ? (
          <div
            className={opties.length > 4 ? 'tk-vlag-keuze tk-vlag-keuze-zes' : 'tk-vlag-keuze'}
            role="group"
            aria-label={t('vlag.optiesLabel')}
          >
            {opties.map((optie) => (
              <button
                key={optie.id}
                type="button"
                className="tk-vlag-optie"
                aria-label={optie.beschrijving}
                onClick={() => choose(optie)}
              >
                <Vlag vlag={optie} alt="" lazy={false} />
              </button>
            ))}
          </div>
        ) : (
          <div className="tk-vlag-podium">
            <Vlag
              vlag={vlag}
              alt={revealed ? t('vlag.alt', { naam: vlag.naam }) : vlag.beschrijving}
              lazy={false}
            />
          </div>
        )}
      </div>

      <div className="ln-ronde-paneel">
        {zoeken ? null : (
          <div className="ln-antwoorden" role="group" aria-label={t('vlag.namenLabel')}>
            {opties.map((optie) => (
              <AntwoordKnop
                key={optie.id}
                toestand={toestanden?.get(optie.id) ?? null}
                disabled={revealed}
                onClick={() => choose(optie)}
              >
                {optie.naam}
              </AntwoordKnop>
            ))}
          </div>
        )}

        {revealed ? (
          <Terugkoppeling
            toestand={state.lastCorrect ? 'goed' : 'fout'}
            kop={
              state.lastCorrect
                ? t('vlag.correct', { naam: vlag.naam })
                : t('vlag.wrong', { naam: vlag.naam })
            }
            detail={feedbackSub(state.lastCorrect, state.given, zoeken) || undefined}
            knop={t('practice.next')}
            onVolgende={next}
            knopRef={nextButton}
          />
        ) : null}
      </div>
    </div>
  );
}

/** The line under the feedback: what the child chose, or nothing. */
function feedbackSub(correct: boolean, given: VlagItem | null, zoeken: boolean): string {
  if (correct) return '';
  if (given === null) return t('vlag.dontKnowSub');
  return zoeken
    ? t('vlag.wrongSubVlag', { gekozen: given.naam })
    : t('vlag.wrongSubNaam', { gekozen: given.naam });
}

/** What a screen reader hears once the answer is in. */
function spokenFeedback(
  correct: boolean,
  vlag: VlagItem,
  given: VlagItem | null,
  zoeken: boolean,
): string {
  if (correct) return t('vlag.correct', { naam: vlag.naam });
  return `${t('vlag.wrong', { naam: vlag.naam })} ${feedbackSub(false, given, zoeken)}`;
}
