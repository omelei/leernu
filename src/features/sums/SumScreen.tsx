import { useEffect, useRef, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import { sumText } from '@/game-core';
import { SpeakButton } from '@/components/SpeakButton';
import { usePreferences } from '@/features/player/settings';
import { RoundProgress } from '@/features/practice/RoundProgress';
import { StopButton } from '@/features/practice/StopButton';
import { useSumRound, stopsOnAMistake, typesTheSum, type SumMode } from './useSumRound';
import { SumResultScreen } from './SumResultScreen';

/**
 * One round of a table.
 *
 * The app design draws the tables as a module — a rail entry, a card, a level —
 * and does not draw this screen (ADR-049). So it is not invented: it is K3 and
 * K4 with the map taken out and the sum put in its place. The round bar is the
 * same bar, the ten dots are the same dots, the feedback appears where the
 * question was, and "Ik weet het niet" does here what ADR-048 decided it does
 * there.
 *
 * The sum is the whole stage, the way the map is on the other screen. It is set
 * large and in the display face with tabular figures, because a child reads it
 * from across a table and 7 × 8 has to be one glance rather than three.
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
   * Whether the round keeps its answers until the end (ADR-085).
   *
   * Nothing on this screen tests for it, and it does not have to: a round in
   * toetsstand never rests in the revealed phase — the hook moves on before the
   * frame is painted — so every branch below that draws feedback is simply
   * never reached, and there is no second copy of the rule to keep in step.
   */
  readonly toetsstand?: boolean;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const { state, submit, choose, giveUp, next, stop } = useSumRound(
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
    return <SumResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  const { sum } = state.question;
  const som = sumText(sum);
  const revealed = state.phase === 'revealed';
  const typing = typesTheSum(mode);

  const instruction = typing ? t('sums.typeQuestion') : t('sums.chooseQuestion');
  const spoken = `${som}. ${t('sums.prompt')}`;

  return (
    <div className="flex h-screen flex-col bg-paper" data-module="tafels">
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
          {/* What is running out, or nothing. Never both a clock and lives:
              only one round has each. */}
          {state.secondsLeft !== null ? (
            <Counter
              label={t('practice.counterTime')}
              value={klok(state.secondsLeft)}
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
          new sum rather than only the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed ? spokenFeedback(state.lastCorrect, som, sum.antwoord, state.given) : spoken}
      </p>

      <div className="tk-round-body">
        <div className="tk-round-question">
          {revealed ? (
            <>
              <p className="tk-display text-h2 font-semibold">
                {state.lastCorrect
                  ? t('sums.correct', { som, antwoord: sum.antwoord })
                  : t('sums.wrong', { som, antwoord: sum.antwoord })}
              </p>
              <p className="text-body text-ink-2">
                {state.lastCorrect
                  ? ''
                  : state.given === null
                    ? t('sums.dontKnowSub')
                    : t('sums.wrongSub', { gegeven: state.given })}
              </p>
              {/* A timed round moves on by itself, so there is nothing to
                  press and nothing to charge a child for pressing. */}
              {state.rule.kind !== 'tijd' && (
                <button ref={nextButton} type="button" className="tk-button mt-4" onClick={next}>
                  {/* A diploma ends here, so the button says so. "Volgende
                      vraag" on a button that shows a result is the kind of
                      small lie a child notices once and then stops trusting. */}
                  {stopsOnAMistake(mode) && !state.lastCorrect
                    ? t('sums.diplomaStop')
                    : t('practice.next')}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="tk-label">{instruction}</p>
              {/* The card carries a heading like every other question card, so
                  a screen reader gets one and the eye has somewhere to land in
                  a column that is otherwise a label and a box. The sum itself
                  is beside it, where the map is on the other screen. */}
              <h1 className="tk-display mt-1 text-h1 font-semibold">{t('sums.prompt')}</h1>
              {typing ? (
                <SumField key={state.index} onSubmit={submit} />
              ) : (
                <div className="tk-options" role="group" aria-label={t('sums.chooseQuestion')}>
                  {(state.question.options ?? []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="tk-option tabular-nums"
                      onClick={() => choose(option)}
                    >
                      {option}
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

        {/* Where the map goes on the other screen. The sum gets the same stage,
            because it is the same thing: what the child is being asked about. */}
        <div className="tk-round-map flex items-center justify-center">
          <p className="tk-sum tk-display tabular-nums">{som}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The same counter the map's round bar uses, and the same reason it is kept off
 * a phone in a round that has dots: the bar at 393 cannot hold a stop, ten
 * dots, a read-aloud button and a counter as well.
 */
function Counter({
  label,
  value,
  urgent = false,
  onlyWide = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly urgent?: boolean;
  readonly onlyWide?: boolean;
}) {
  return (
    <div className={onlyWide ? 'hidden flex-col items-end md:flex' : 'flex flex-col items-end'}>
      <span className="tk-label">{label}</span>
      <b
        className={
          urgent
            ? 'tk-display text-h2 font-bold tabular-nums text-bad'
            : 'tk-display text-h2 font-bold tabular-nums'
        }
      >
        {value}
      </b>
    </div>
  );
}

/** Seconds as a clock, because 0:07 reads as "nearly out" and 7 does not. */
function klok(seconden: number): string {
  const m = Math.floor(seconden / 60);
  const sec = seconden % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
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

/**
 * The answer box. A numeric keyboard on a phone, because the answer is always a
 * number and making a child find the digits is a tax on the arithmetic.
 * `inputMode` rather than `type="number"`, which brings spinners nobody wants
 * and a browser that quietly accepts "1e3".
 */
function SumField({ onSubmit }: { readonly onSubmit: (value: string) => void }) {
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

  // Wrapping, because the desktop question column is 22rem and an answer box
  // beside a button does not fit in it: the button squashed and broke "Kijk na"
  // over two lines rather than dropping below it.
  return (
    <form onSubmit={handle} className="mt-3 flex flex-wrap items-center gap-3">
      <label htmlFor="som" className="tk-sr-only">
        {t('sums.typeQuestion')}
      </label>
      <input
        ref={input}
        id="som"
        className="tk-input max-w-[10rem] tabular-nums"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('sums.typePlaceholder')}
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
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
