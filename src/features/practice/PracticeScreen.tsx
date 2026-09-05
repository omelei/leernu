import { useEffect, useRef } from 'react';
import { t } from '@/i18n';
import { MapCanvas } from './MapCanvas';
import { ResultScreen } from './ResultScreen';
import { useRound } from './useRound';

/**
 * The practice screen, following docs/leer.nu oefenkaart.html.
 *
 * Layout from the design: a question bar across the top, the map taking every
 * pixel that is left, feedback appearing below only once an answer is given,
 * and a progress rail at the very bottom. The map is the interface — the design
 * gives it the whole stage rather than a panel in a page, which is the single
 * biggest difference from what a child meets on the free alternatives.
 */
export function PracticeScreen({ onHome }: { readonly onHome: () => void }) {
  const { state, pick, next } = useRound();
  const nextButton = useRef<HTMLButtonElement>(null);

  // Focus moves to "volgende vraag" the moment an answer lands, so a child on a
  // keyboard does not have to tab back out of twelve provinces to continue.
  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="font-display text-2xl">{t('practice.mapFailed')}</p>
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </main>
    );
  }

  if (state.phase === 'loading' || !state.geo || !state.question) {
    if (state.phase === 'finished') {
      return <ResultScreen state={state} onHome={onHome} />;
    }
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  if (state.phase === 'finished') {
    return <ResultScreen state={state} onHome={onHome} />;
  }

  const naam = state.question.item.naam;
  const revealed = state.phase === 'revealed';
  const chosenName =
    state.chosenShapeId === null ? '' : (state.namesById.get(state.chosenShapeId) ?? '');

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex flex-none items-center gap-5 border-b border-line px-6 py-4">
        <div>
          <p className="tk-label">{t('practice.kind')}</p>
          <h1 className="tk-display text-3xl font-semibold">{t('practice.question', { naam })}</h1>
        </div>

        <SpeakButton text={t('practice.question', { naam })} />

        <div className="ml-auto flex items-center gap-5">
          <Counter label={t('practice.counterQuestion')} value={`${state.index + 1}/${state.total}`} />
          <Counter label={t('practice.counterCombo')} value={`×${state.combo}`} />
        </div>
      </header>

      {/* The question is announced separately from the heading so a screen
          reader hears the new question on every turn, not only on the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed
          ? state.lastCorrect
            ? t('practice.correct', { naam })
            : `${t('practice.wrong', { naam })} ${t('practice.wrongSub', { gekozen: chosenName })}`
          : t('practice.question', { naam })}
      </p>

      <main className="flex min-h-0 flex-1 items-center justify-center p-3">
        <MapCanvas
          geo={state.geo}
          namesById={state.namesById}
          targetShapeId={state.question.shapeId}
          chosenShapeId={state.chosenShapeId}
          revealed={revealed}
          onPick={pick}
        />
      </main>

      {revealed && (
        <section className="flex flex-none items-end gap-5 border-t border-line bg-paper px-6 py-5">
          <FeedbackIcon correct={state.lastCorrect} />
          <div className="flex-1">
            <p className="tk-display text-2xl font-semibold">
              {state.lastCorrect ? t('practice.correct', { naam }) : t('practice.wrong', { naam })}
            </p>
            <p className="text-lg text-ink-2">
              {state.lastCorrect
                ? (state.question.item.weetje ?? '')
                : `${t('practice.wrongSub', { gekozen: chosenName })} ${state.question.item.weetje ?? ''}`}
            </p>
          </div>
          <button ref={nextButton} type="button" className="tk-button tk-button-big" onClick={next}>
            {t('practice.next')}
          </button>
        </section>
      )}

      <div
        className="h-2 flex-none bg-sunken"
        role="progressbar"
        aria-label={t('a11y.progress')}
        aria-valuenow={state.index + (revealed ? 1 : 0)}
        aria-valuemin={0}
        aria-valuemax={state.total}
      >
        <div
          className="h-full bg-topo transition-[width] duration-200"
          style={{ width: `${((state.index + (revealed ? 1 : 0)) / state.total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Counter({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="tk-label">{label}</span>
      <b className="tk-display text-2xl font-bold tabular-nums">{value}</b>
    </div>
  );
}

function FeedbackIcon({ correct }: { readonly correct: boolean }) {
  // A shape, not only a colour: a tick on green, a cross on hatched red. The
  // same rule as the map, for the same reason.
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 flex-none items-center justify-center"
      style={{ background: correct ? 'var(--good)' : 'var(--bad)' }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--paper)" strokeWidth={3}>
        {correct ? <path d="M4 12l5 5L20 6" /> : <path d="M6 6l12 12M18 6L6 18" />}
      </svg>
    </span>
  );
}

/**
 * Reads the question aloud with the browser's own voice. No cloud service: a
 * text-to-speech API receiving a child's question is a third party in the
 * middle of a lesson, and this product has none.
 */
function SpeakButton({ text }: { readonly text: string }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label={t('practice.speak')}
      className="flex h-14 w-14 flex-none items-center justify-center rounded-control border-2 border-ink bg-paper"
      onClick={() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL';
        window.speechSynthesis.speak(utterance);
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--ink)" aria-hidden="true">
        <path d="M8 5l11 7-11 7z" />
      </svg>
    </button>
  );
}
