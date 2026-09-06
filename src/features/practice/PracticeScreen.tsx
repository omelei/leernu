import { useEffect, useRef, useState, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { MapCanvas } from './MapCanvas';
import { ResultScreen } from './ResultScreen';
import { SETS, useRound, type Noemer, type PracticeMode, type SetId } from './useRound';

/**
 * The practice screen, following docs/leer.nu oefenkaart.html.
 *
 * Layout from the design: a question bar across the top, the map taking every
 * pixel that is left, feedback appearing below only once an answer is given,
 * and a progress rail at the very bottom. The map is the interface — it gets
 * the whole stage rather than a panel in a page, which is the single biggest
 * difference from what a child meets on the free alternatives.
 *
 * Two ways of answering share this screen. Pointing asks where something is;
 * typing asks whether the child can name it, which is a different skill and
 * usually the harder one. Typing is also where ADR-017 finally shows up: a
 * child who writes the name of a different real place is not told they were
 * right, and is not simply told they were wrong either.
 */
/**
 * An area, a city, an island and a stretch of water are looked for in different
 * ways, and a child reads the difference. Complete records, so a new set has to
 * say which of the four it is instead of quietly borrowing another one's words.
 */
const PICK_LABEL: Record<Noemer, TranslationKey> = {
  gebied: 'practice.kind',
  stad: 'practice.kindCity',
  eiland: 'practice.kindIsland',
  water: 'practice.kindWater',
};

const TYPE_LABEL: Record<Noemer, TranslationKey> = {
  gebied: 'practice.kindTypeArea',
  stad: 'practice.kindTypeCity',
  eiland: 'practice.kindTypeIsland',
  water: 'practice.kindTypeWater',
};

export function PracticeScreen({
  setId,
  practiceMode,
  onHome,
}: {
  readonly setId: SetId;
  readonly practiceMode: PracticeMode;
  readonly onHome: () => void;
}) {
  const { state, pick, submit, next, stop } = useRound(setId, practiceMode);
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

  if (state.phase === 'finished') return <ResultScreen state={state} onHome={onHome} />;

  if (state.phase === 'loading' || !state.geo || !state.answers || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  const naam = state.question.item.naam;
  const revealed = state.phase === 'revealed';
  const typing = practiceMode === 'hoe-heet-dit';
  const { noemer } = SETS[setId];

  const label = typing ? t('practice.typeQuestion') : t(PICK_LABEL[noemer]);
  const vraag = typing ? t(TYPE_LABEL[noemer]) : t('practice.question', { naam });

  const chosenName = state.chosenId === null ? '' : (state.namesById.get(state.chosenId) ?? '');
  const nearMiss = state.verdict?.kind === 'near-miss';

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="flex flex-none items-center gap-5 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="tk-label">{label}</p>
          <h1 className="tk-display truncate text-3xl font-semibold">{vraag}</h1>
        </div>

        <SpeakButton text={vraag} />

        <div className="ml-auto flex items-center gap-5">
          <Counter
            label={t('practice.counterQuestion')}
            value={`${state.index + 1}/${state.total}`}
          />
          <Counter label={t('practice.counterCombo')} value={`×${state.combo}`} />
          <button type="button" className="tk-button tk-button-quiet" onClick={stop}>
            {t('practice.stop')}
          </button>
        </div>
      </header>

      {/* Announced separately from the heading so a screen reader hears the new
          question on every turn, not only on the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed ? feedbackSentence(state, naam, chosenName) : vraag}
      </p>

      <main className="flex min-h-0 flex-1 items-center justify-center p-3">
        <MapCanvas
          background={state.geo}
          answers={state.answers}
          interaction={typing ? 'show' : 'pick'}
          namesById={state.namesById}
          targetId={state.question.answerId}
          chosenId={state.chosenId}
          revealed={revealed}
          onPick={pick}
        />
      </main>

      {typing && !revealed && <AnswerField key={state.index} onSubmit={submit} />}

      {revealed && (
        <section className="flex flex-none items-end gap-5 border-t border-line bg-paper px-6 py-5">
          <FeedbackIcon kind={state.lastCorrect ? 'good' : nearMiss ? 'near' : 'bad'} />
          <div className="flex-1">
            <p className="tk-display text-2xl font-semibold">
              {state.lastCorrect
                ? t('practice.correct', { naam })
                : nearMiss
                  ? t('practice.almost')
                  : t('practice.wrong', { naam })}
            </p>
            <p className="text-lg text-ink-2">{feedbackDetail(state, naam, chosenName)}</p>
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

type State = ReturnType<typeof useRound>['state'];

/** What a screen reader hears. Same three cases as the panel below the map. */
function feedbackSentence(state: State, naam: string, chosen: string): string {
  if (state.lastCorrect) return t('practice.correct', { naam });
  if (state.verdict?.kind === 'near-miss') {
    return `${t('practice.almost')} ${t('practice.almostSub', { gekozen: state.verdict.confusedWith.naam, naam })}`;
  }
  return `${t('practice.wrong', { naam })} ${chosen ? t('practice.wrongSub', { gekozen: chosen }) : ''}`;
}

function feedbackDetail(state: State, naam: string, chosen: string): string {
  const weetje = state.question?.item.weetje ?? '';
  if (state.lastCorrect) return weetje;

  if (state.verdict?.kind === 'near-miss') {
    return t('practice.almostSub', { gekozen: state.verdict.confusedWith.naam, naam });
  }
  // Pointing names what was pointed at; typing has nothing sensible to quote
  // back, because whatever was typed was not a place we teach.
  return chosen ? `${t('practice.wrongSub', { gekozen: chosen })} ${weetje}` : weetje;
}

/**
 * The answer box. Cleared between questions by being keyed on the question
 * index, which is simpler and harder to get wrong than resetting it by hand.
 */
function AnswerField({ onSubmit }: { readonly onSubmit: (value: string) => void }) {
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
    <form
      onSubmit={handle}
      className="flex flex-none items-center gap-3 border-t border-line bg-paper px-6 py-4"
    >
      <label htmlFor="antwoord" className="tk-sr-only">
        {t('practice.typeQuestion')}
      </label>
      <input
        ref={input}
        id="antwoord"
        className="tk-input max-w-md"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('practice.typePlaceholder')}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={40}
      />
      <button type="submit" className="tk-button" disabled={value.trim().length === 0}>
        {t('practice.check')}
      </button>
    </form>
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

function FeedbackIcon({ kind }: { readonly kind: 'good' | 'near' | 'bad' }) {
  // A shape, not only a colour. The near miss gets its own mark — neither a
  // tick nor a cross — because it is genuinely a third outcome and dressing it
  // as either would undo the point of ADR-017.
  const background =
    kind === 'good' ? 'var(--good)' : kind === 'near' ? 'var(--topo)' : 'var(--bad)';

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 flex-none items-center justify-center"
      style={{ background }}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={3}
      >
        {kind === 'good' && <path d="M4 12l5 5L20 6" />}
        {kind === 'bad' && <path d="M6 6l12 12M18 6L6 18" />}
        {kind === 'near' && <path d="M5 12h14M13 6l6 6-6 6" />}
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
 * broken rather than absent: `getVoices()` is empty on Chrome's first call and
 * fills in later; a machine with no Dutch voice would say nothing at all; and
 * with no voices the button hides itself, because a control that does nothing is
 * worse than a control that is not there.
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
