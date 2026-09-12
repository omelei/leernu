import { useEffect, useRef } from 'react';
import { t } from '@/i18n';
import { antwoordToestanden, type KlokItem } from '@/game-core';
import { Button } from '@/components/Button';
import { AntwoordKnop, Laden } from '@/components/ds';
import { AntwoordVeld } from '@/features/round/AntwoordVeld';
import { Terugkoppeling } from '@/features/round/Terugkoppeling';
import { useRondeThema } from '@/features/round/useRondeThema';
import { Vraagbalk } from '@/features/round/Vraagbalk';
import { KlokFace } from './KlokFace';
import { klokVoluit, klokWoorden } from './klokTaal';
import { useKlokRound, typesTheKlok, wijstDeKlokAan, type KlokMode } from './useKlokRound';
import { KlokResultScreen } from './KlokResultScreen';

/**
 * One round of the clock (S5–S9 with a clock face in the place of the map).
 *
 * The one thing this screen has that the others do not is a **second
 * direction**. Two of the three ways of practising show a face and ask for the
 * time; the third shows a time and asks which of four faces says it. So the
 * canvas holds a clock or four of them depending on the mode — see
 * `wijstDeKlokAan`.
 *
 * **Read-aloud does not read the answer out.** On rekenen the button speaks the
 * question, because "7 × 8" is the question and the answer is 56. Here the
 * question is a picture, and a button that said "half acht" would be the
 * product doing the exercise for the child. So it speaks the instruction on the
 * two modes that show a face, and the time itself only on the one where the
 * time *is* the question.
 */
export function KlokScreen({
  setId,
  mode,
  aantal = null,
  toetsstand = false,
  onHome,
  onAgain,
}: {
  readonly setId: string;
  readonly mode: KlokMode;
  /** How many faces the child asked for, or null for the round's own. */
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
  const { state, submit, choose, next, stop } = useKlokRound(setId, mode, aantal, toetsstand);
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
    return <KlokResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="ln-ronde ln-ronde-laden" aria-busy="true">
        <Laden label={t('practice.loading')} />
      </main>
    );
  }

  const { tijd, opties } = state.question;
  const revealed = state.phase === 'revealed';
  const typing = typesTheKlok(mode);
  const andersom = wijstDeKlokAan(mode);
  const woorden = klokWoorden(tijd);

  const instruction = andersom
    ? t('klok.whichQuestion')
    : typing
      ? t('klok.typeQuestion')
      : t('klok.chooseQuestion');
  // The time out loud only where the time is the question. See the note above.
  const spoken = andersom ? `${woorden}. ${t('klok.whichQuestion')}` : t('klok.lookPrompt');
  // What the child answered, in the notation they answered in: the words if
  // they pressed one of four times, and their own keystrokes if they typed.
  const gegeven = state.given === null ? state.getypt : klokVoluit(state.given);

  const toestanden = revealed ? antwoordToestanden(state.given?.id ?? null, tijd.id) : null;

  return (
    <div className="ln-ronde" data-module="klok">
      <Vraagbalk
        // On the mode that asks the other way round, the heading *is* the
        // question: the time, in words, and the four faces on the canvas.
        vraag={andersom ? woorden : t('klok.prompt')}
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
        {revealed ? spokenFeedback(state.lastCorrect, tijd, gegeven) : spoken}
      </p>

      <div className="ln-canvas ln-canvas-midden">
        {andersom && !revealed ? (
          <div className="tk-klok-keuze" role="group" aria-label={instruction}>
            {(opties ?? []).map((optie) => (
              <button
                key={optie.id}
                type="button"
                className="tk-klok-optie"
                aria-label={klokWoorden(optie)}
                onClick={() => choose(optie)}
              >
                <KlokFace item={optie} />
              </button>
            ))}
          </div>
        ) : (
          <KlokFace item={tijd} />
        )}
      </div>

      <div className="ln-ronde-paneel">
        {/* Four times in words, on the two-of-three ways that show a face. */}
        {!typing && !andersom ? (
          <div className="ln-antwoorden" role="group" aria-label={instruction}>
            {(opties ?? []).map((optie) => (
              <AntwoordKnop
                key={optie.id}
                toestand={toestanden?.get(optie.id) ?? null}
                disabled={revealed}
                onClick={() => choose(optie)}
              >
                {klokWoorden(optie)}
              </AntwoordKnop>
            ))}
          </div>
        ) : null}

        {typing && !revealed ? (
          <AntwoordVeld
            key={state.index}
            label={instruction}
            placeholder={t('klok.typePlaceholder')}
            inputMode="numeric"
            maxLength={5}
            onSubmit={submit}
          />
        ) : null}

        {revealed ? (
          <Terugkoppeling
            toestand={state.lastCorrect ? 'goed' : 'fout'}
            kop={
              state.lastCorrect
                ? t('klok.correct', { tijd: klokVoluit(tijd) })
                : t('klok.wrong', { tijd: klokVoluit(tijd) })
            }
            detail={
              state.lastCorrect
                ? undefined
                : gegeven === null || gegeven === ''
                  ? t('klok.dontKnowSub')
                  : t('klok.wrongSub', { gegeven })
            }
            knop={state.rule.kind === 'tijd' ? null : t('practice.next')}
            onVolgende={next}
            knopRef={nextButton}
          />
        ) : null}
      </div>
    </div>
  );
}

/** What a screen reader hears once the answer is in. */
function spokenFeedback(correct: boolean, tijd: KlokItem, gegeven: string | null): string {
  const voluit = klokVoluit(tijd);
  if (correct) return t('klok.correct', { tijd: voluit });

  const detail =
    gegeven === null || gegeven === '' ? t('klok.dontKnowSub') : t('klok.wrongSub', { gegeven });
  return `${t('klok.wrong', { tijd: voluit })} ${detail}`;
}
