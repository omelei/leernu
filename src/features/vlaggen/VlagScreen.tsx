import { useEffect, useRef } from 'react';
import { t } from '@/i18n';
import type { VlagItem } from '@/game-core';
import { SpeakButton } from '@/components/SpeakButton';
import { usePreferences } from '@/features/player/settings';
import { RoundProgress } from '@/features/practice/RoundProgress';
import { StopButton } from '@/features/practice/StopButton';
import { SterTeller } from '@/features/reis/SterTeller';
import { Counter } from '@/features/round/Teller';
import { Vlag } from './Vlag';
import { VlagResultScreen } from './VlagResultScreen';
import { useVlagRound, type VlagMode } from './useVlagRound';

/**
 * One round of flags.
 *
 * The clock's screen with a flag in the place of the face, which is the family
 * resemblance on purpose: the round bar is the same bar, the dots are the same
 * dots, the feedback appears where the question was, and "Ik weet het niet"
 * does what ADR-048 decided it does.
 *
 * **Two directions, as on the clock.** "Vlag zoeken" puts a name in the heading
 * and flags on the stage; "Meerkeuze" puts one flag on the stage and names
 * under the heading. The oefentoets and overleven alternate, question by
 * question.
 *
 * **No flag on the stage is named by its picture.** Where flags are the
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
  const { state, choose, giveUp, next, stop } = useVlagRound(setId, mode, aantal, toetsstand);
  const prefs = usePreferences();
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="tk-display text-title">{t('vlag.failed')}</p>
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </main>
    );
  }

  if (state.phase === 'finished') {
    return <VlagResultScreen state={state} onHome={onHome} onAgain={onAgain} />;
  }

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('vlag.loading')}</p>
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

  return (
    <div className="flex h-screen flex-col bg-paper" data-module="vlaggen">
      <header className="tk-round-bar">
        <StopButton onStop={stop} />
        {state.rule.kind === 'fixed' ? (
          <RoundProgress
            total={state.total}
            index={state.index}
            answered={state.index + (revealed ? 1 : 0)}
          />
        ) : null}
        {prefs.readAloud ? <SpeakButton text={spoken} /> : null}
        <div className="ml-auto flex items-center gap-4 md:gap-6">
          <SterTeller correct={state.correctCount} />
          {state.livesLeft !== null ? (
            <>
              <Counter
                label={t('practice.counterLives')}
                value={String(state.livesLeft)}
                urgent={state.livesLeft <= 1}
              />
              <Counter label={t('practice.counterCorrect')} value={String(state.correctCount)} />
            </>
          ) : null}
          <Counter
            label={t('practice.counterCombo')}
            value={`×${state.combo}`}
            onlyWide={state.rule.kind === 'fixed'}
          />
        </div>
      </header>

      {/* Announced separately from the heading, so a screen reader hears every
          new question rather than only the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed ? spokenFeedback(state.lastCorrect, vlag, state.given, zoeken) : spoken}
      </p>

      <div className="tk-round-body">
        <div className="tk-round-question">
          {revealed ? (
            <>
              <p className="tk-display text-title font-semibold">
                {state.lastCorrect
                  ? t('vlag.correct', { naam: vlag.naam })
                  : t('vlag.wrong', { naam: vlag.naam })}
              </p>
              <p className="text-body text-ink-2">
                {feedbackSub(state.lastCorrect, state.given, zoeken)}
              </p>
              <button ref={nextButton} type="button" className="tk-button mt-4" onClick={next}>
                {t('practice.next')}
              </button>
            </>
          ) : (
            <>
              <p className="tk-label">{instruction}</p>
              {/* The heading is the question when a name is asked for a flag:
                  the name itself, and flags on the stage to choose from. */}
              <h1 className="tk-display mt-1 text-display font-semibold">
                {zoeken ? vlag.naam : t('vlag.prompt')}
              </h1>
              {zoeken ? null : (
                <div className="tk-options" role="group" aria-label={t('vlag.namenLabel')}>
                  {opties.map((optie) => (
                    <button
                      key={optie.id}
                      type="button"
                      className="tk-option"
                      onClick={() => choose(optie)}
                    >
                      {optie.naam}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="tk-button tk-button-secondary mt-4" onClick={giveUp}>
                {t('practice.dontKnow')}
              </button>
            </>
          )}
        </div>

        {/* Where the map goes on the map's screen. The flags to choose from, two
            by two — three by two where there are six — or the one flag the
            question is about, and after an answer the right one. */}
        <div className="tk-round-map flex items-center justify-center">
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
