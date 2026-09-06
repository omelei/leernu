import { useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';
import { MapCanvas } from './MapCanvas';
import { ResultScreen } from './ResultScreen';
import { SETS, useRound, type SetId } from './useRound';

/**
 * The practice screen, following docs/leer.nu oefenkaart.html.
 *
 * Layout from the design: a question bar across the top, the map taking every
 * pixel that is left, feedback appearing below only once an answer is given,
 * and a progress rail at the very bottom. The map is the interface — it gets
 * the whole stage rather than a panel in a page, which is the single biggest
 * difference from what a child meets on the free alternatives.
 */
export function PracticeScreen({
  setId,
  onHome,
}: {
  readonly setId: SetId;
  readonly onHome: () => void;
}) {
  const { state, pick, next, stop } = useRound(setId);
  const nextButton = useRef<HTMLButtonElement>(null);

  // Focus moves to "volgende vraag" the moment an answer lands, so a child on a
  // keyboard does not have to tab back out of twelve provinces to continue.
  useEffect(() => {
    if (state.phase === 'revealed') nextButton.current?.focus();
  }, [state.phase]);

  if (state.error !== null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="tk-display text-2xl">{t('practice.mapFailed')}</p>
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </main>
    );
  }

  if (state.phase === 'finished') {
    return <ResultScreen state={state} onHome={onHome} />;
  }

  if (state.phase === 'loading' || !state.geo || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  const naam = state.question.item.naam;
  const revealed = state.phase === 'revealed';
  const chosenName = state.chosenId === null ? '' : (state.namesById.get(state.chosenId) ?? '');
  const vraag = t('practice.question', { naam });

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex flex-none items-center gap-5 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="tk-label">{t(SETS[setId].mode === 'points' ? 'practice.kindCity' : 'practice.kind')}</p>
          <h1 className="tk-display truncate text-3xl font-semibold">{vraag}</h1>
        </div>

        <SpeakButton text={vraag} />

        <div className="ml-auto flex items-center gap-5">
          <Counter label={t('practice.counterQuestion')} value={`${state.index + 1}/${state.total}`} />
          <Counter label={t('practice.counterCombo')} value={`×${state.combo}`} />
          <button type="button" className="tk-button tk-button-quiet" onClick={stop}>
            {t('practice.stop')}
          </button>
        </div>
      </header>

      {/* Announced separately from the heading so a screen reader hears the new
          question on every turn, not only on the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed
          ? state.lastCorrect
            ? t('practice.correct', { naam })
            : `${t('practice.wrong', { naam })} ${t('practice.wrongSub', { gekozen: chosenName })}`
          : vraag}
      </p>

      <main className="flex min-h-0 flex-1 items-center justify-center p-3">
        <MapCanvas
          geo={state.geo}
          points={state.points}
          mode={state.mode}
          namesById={state.namesById}
          targetId={state.question.answerId}
          chosenId={state.chosenId}
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
  // A shape, not only a colour: a tick on green, a cross on red. The same rule
  // as the map, for the same reason.
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
 * text-to-speech API receiving a child's question is a third party in the middle
 * of a lesson, and this product has none.
 *
 * Three things this has to survive, all of which make a naive version look
 * broken rather than absent:
 *
 * - `getVoices()` is empty on first call in Chrome and fills in later, so the
 *   button waits for `voiceschanged` before deciding it has nothing to say.
 * - A machine with no Dutch voice would silently say nothing. We fall back to
 *   any voice rather than insisting on nl-NL.
 * - With no voices at all the button hides itself. A control that does nothing
 *   is worse than a control that is not there.
 */
function SpeakButton({ text }: { readonly text: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const read = () => setVoices(window.speechSynthesis.getVoices());
    read();
    window.speechSynthesis.addEventListener('voiceschanged', read);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', read);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (voices.length === 0) return null;

  function speak() {
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const dutch = voices.find((voice) => voice.lang.toLowerCase().startsWith('nl'));
    if (dutch) utterance.voice = dutch;
    utterance.lang = dutch?.lang ?? 'nl-NL';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      aria-label={t('practice.speak')}
      aria-pressed={speaking}
      className="flex h-14 w-14 flex-none items-center justify-center rounded-control border-2 border-ink bg-paper"
      onClick={speak}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--ink)" aria-hidden="true">
        {speaking ? <rect x="6" y="6" width="12" height="12" /> : <path d="M8 5l11 7-11 7z" />}
      </svg>
    </button>
  );
}
