import { useEffect, useRef, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import type { KlokItem } from '@/game-core';
import { SpeakButton } from '@/components/SpeakButton';
import { usePreferences } from '@/features/player/settings';
import { RoundProgress } from '@/features/practice/RoundProgress';
import { SterTeller } from '@/features/reis/SterTeller';
import { StopButton } from '@/features/practice/StopButton';
import { Counter } from '@/features/round/Teller';
import { KlokFace } from './KlokFace';
import { klokVoluit, klokWoorden } from './klokTaal';
import { useKlokRound, typesTheKlok, wijstDeKlokAan, type KlokMode } from './useKlokRound';
import { KlokResultScreen } from './KlokResultScreen';

/**
 * One round of the clock.
 *
 * K3 and K4 with the map taken out and a clock face put in its place, which is
 * exactly what rekenen did with the sum. The round bar is the same bar, the ten
 * dots are the same dots, the feedback appears where the question was, and "Ik
 * weet het niet" does here what ADR-048 decided it does there.
 *
 * The one thing this screen has that neither of the others does is a **second
 * direction**. Two of the three ways of practising show a face and ask for the
 * time; the third shows a time and asks which of four faces says it. So the
 * stage holds a clock or a sentence depending on the mode, and the answers hold
 * the other one — see `wijstDeKlokAan`.
 *
 * **Read-aloud does not read the answer out.** On rekenen the button speaks the
 * question, because "7 × 8" is the question and the answer is 56. Here the
 * question is a picture, and a button that said "half acht" would be the
 * product doing the exercise for the child. So it speaks the instruction on the
 * two modes that show a face, and the time itself only on the one where the
 * time *is* the question (K9's read-aloud is for children who cannot read the
 * words, not for children who cannot read the clock).
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
   * Whether the round keeps its answers until the end (ADR-085).
   *
   * Nothing on this screen tests for it, and it does not have to: a round in
   * toetsstand never rests in the revealed phase — the hook moves on before the
   * frame is painted — so every branch below that draws feedback is simply
   * never reached.
   */
  readonly toetsstand?: boolean;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const { state, submit, choose, giveUp, next, stop } = useKlokRound(
    setId,
    mode,
    aantal,
    toetsstand,
  );
  const prefs = usePreferences();
  const nextButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="tk-display text-h2">{t('practice.mapFailed')}</p>
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </main>
    );
  }

  if (state.phase === 'finished')
    return <KlokResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
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
  // Quoting a pressed option back in figures would be answering a question
  // they were not asked.
  const gegeven = state.given === null ? state.getypt : klokVoluit(state.given);

  return (
    <div className="flex h-screen flex-col bg-paper" data-module="klok">
      <header className="tk-round-bar">
        <StopButton onStop={stop} />
        {/* The dots, except in the endless rounds, which have no ten to count
            towards. There the counters carry it instead. */}
        {state.rule.kind === 'fixed' ? (
          <RoundProgress
            total={state.total}
            index={state.index}
            answered={state.index + (revealed ? 1 : 0)}
          />
        ) : null}
        {prefs.readAloud ? <SpeakButton text={spoken} /> : null}
        <div className="ml-auto flex items-center gap-4 md:gap-6">
          {/* The star being filled, on every round screen and in every mode:
              ten correct answers are one, and between two chests it is the only
              thing that moves (ADR-099). */}
          <SterTeller correct={state.correctCount} />
          {/* What is running out, or nothing. Never both a clock and lives:
              only one round has each. */}
          {state.secondsLeft !== null ? (
            <Counter
              label={t('practice.counterTime')}
              value={aftellen(state.secondsLeft)}
              urgent={state.secondsLeft <= 10}
            />
          ) : state.livesLeft !== null ? (
            <Counter
              label={t('practice.counterLives')}
              value={String(state.livesLeft)}
              urgent={state.livesLeft <= 1}
            />
          ) : null}
          {state.secondsLeft !== null || state.livesLeft !== null ? (
            <Counter label={t('practice.counterCorrect')} value={String(state.correctCount)} />
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
        {revealed ? spokenFeedback(state.lastCorrect, tijd, gegeven) : spoken}
      </p>

      <div className="tk-round-body">
        <div className="tk-round-question">
          {revealed ? (
            <>
              <p className="tk-display text-h2 font-semibold">
                {state.lastCorrect
                  ? t('klok.correct', { tijd: klokVoluit(tijd) })
                  : t('klok.wrong', { tijd: klokVoluit(tijd) })}
              </p>
              <p className="text-body text-ink-2">
                {state.lastCorrect
                  ? ''
                  : gegeven === null || gegeven === ''
                    ? t('klok.dontKnowSub')
                    : t('klok.wrongSub', { gegeven })}
              </p>
              {/* A timed round moves on by itself, so there is nothing to
                  press and nothing to charge a child for pressing. */}
              {state.rule.kind !== 'tijd' && (
                <button ref={nextButton} type="button" className="tk-button mt-4" onClick={next}>
                  {t('practice.next')}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="tk-label">{instruction}</p>
              {/* The card carries a heading like every other question card, so
                  a screen reader gets one and the eye has somewhere to land.
                  On the mode that asks the other way round, the heading *is*
                  the question: the time, in words, and nothing on the stage
                  but the four faces to choose between. */}
              <h1 className="tk-display mt-1 text-h1 font-semibold">
                {andersom ? woorden : t('klok.prompt')}
              </h1>
              {typing ? <KlokField key={state.index} onSubmit={submit} /> : null}
              {/* Four times in words, on the two-of-three ways that show a
                  face. The mode that asks the other way round has its answers
                  on the stage instead, because four clocks need the room. */}
              {!typing && !andersom ? (
                <div className="tk-options" role="group" aria-label={t('klok.chooseQuestion')}>
                  {(opties ?? []).map((optie) => (
                    <button
                      key={optie.id}
                      type="button"
                      className="tk-option"
                      onClick={() => choose(optie)}
                    >
                      {klokWoorden(optie)}
                    </button>
                  ))}
                </div>
              ) : null}
              <button type="button" className="tk-button tk-button-secondary mt-4" onClick={giveUp}>
                {t('practice.dontKnow')}
              </button>
            </>
          )}
        </div>

        {/* Where the map goes on the other screens. Usually the clock, because
            the clock is what the child is being asked about — and four clocks
            on the mode where the question was the sentence, because there the
            faces are the answers and they need the room, not the card. */}
        <div className="tk-round-map flex items-center justify-center">
          {andersom && !revealed ? (
            <div className="tk-klok-keuze" role="group" aria-label={t('klok.whichQuestion')}>
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
      </div>
    </div>
  );
}

/** Seconds as a clock, because 0:07 reads as "nearly out" and 7 does not. */
function aftellen(seconden: number): string {
  const m = Math.floor(seconden / 60);
  const sec = seconden % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** What a screen reader hears once the answer is in. */
function spokenFeedback(correct: boolean, tijd: KlokItem, gegeven: string | null): string {
  const voluit = klokVoluit(tijd);
  if (correct) return t('klok.correct', { tijd: voluit });

  const detail =
    gegeven === null || gegeven === '' ? t('klok.dontKnowSub') : t('klok.wrongSub', { gegeven });
  return `${t('klok.wrong', { tijd: voluit })} ${detail}`;
}

/**
 * The answer box, in figures.
 *
 * A numeric keyboard on a phone, for the same reason rekenen has one: the answer
 * is a time and making a child hunt for the digits is a tax on the reading. The
 * colon is not required — `judgeKlok` takes "730" and "7.30" as readily as
 * "7:30", because a child who typed those knows what time it is.
 */
function KlokField({ onSubmit }: { readonly onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function handle(event: FormEvent) {
    event.preventDefault();
    if (value.trim().length === 0) return;
    onSubmit(value);
  }

  return (
    <form onSubmit={handle} className="mt-3 flex flex-wrap items-center gap-3">
      <label htmlFor="tijd" className="tk-sr-only">
        {t('klok.typeQuestion')}
      </label>
      <input
        ref={input}
        id="tijd"
        className="tk-input max-w-[10rem] tabular-nums"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('klok.typePlaceholder')}
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
      />
      <button
        type="submit"
        className="tk-button flex-none whitespace-nowrap"
        disabled={value.trim().length === 0}
      >
        {t('practice.check')}
      </button>
    </form>
  );
}
