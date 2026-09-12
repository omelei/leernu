import { useEffect, useRef, useState, type FormEvent } from 'react';
import { t, type TranslationKey } from '@/i18n';
import type { Item } from '@/game-core';
import { SpeakButton } from '@/components/SpeakButton';
import { usePreferences } from '@/features/player/settings';
import { MapCanvas } from './MapCanvas';
import { RoundProgress } from './RoundProgress';
import { SterTeller } from '@/features/reis/SterTeller';
import { StopButton } from './StopButton';
import { Counter } from '@/features/round/Teller';
import { ResultScreen } from './ResultScreen';
import {
  choosesTheAnswer,
  readsTheMap,
  typesTheAnswer,
  useRound,
  type Noemer,
  type PracticeMode,
  type RoundSetId,
} from './useRound';

/**
 * The practice screen, following docs/leer.nu oefenkaart.html.
 *
 * Three arrangements of two things, at four sizes (K3). Beside the map where
 * there is width and a hand on a keyboard; above it when the tablet is turned
 * over and there is height instead; on the map when there is neither. The map
 * is the interface — it gets the whole stage rather than a panel in a page,
 * which is the single biggest difference from what a child meets on the free
 * alternatives.
 *
 * Feedback appears exactly where the question was, at every size, so between
 * K3 and K4 nothing moves except the words. On a phone that makes it a strip
 * lying on the map rather than a dialog: a round is never interrupted by
 * something a child has to dismiss.
 *
 * The ten dots at the top are the progress bar of §B and carry the question
 * number, which is why no counter says it any more.
 *
 * Three ways of answering share this screen. Pointing asks where something is.
 * Naming it is a different skill and usually the harder one, and it comes in
 * two strengths: choosing between four names, where the answer is on the screen
 * and the work is knowing which one, and typing it unaided.
 *
 * Typing is where ADR-017 shows up: a child who writes the name of a different
 * real place is not told they were right, and is not simply told they were
 * wrong either. Choosing has no such case — every name on the screen was put
 * there by us, so a wrong one is wrong — but it does travel to the map, which
 * is the same lesson by a shorter road.
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
  land: 'practice.kindCountry',
};

const TYPE_LABEL: Record<Noemer, TranslationKey> = {
  gebied: 'practice.kindTypeArea',
  stad: 'practice.kindTypeCity',
  eiland: 'practice.kindTypeIsland',
  water: 'practice.kindTypeWater',
  land: 'practice.kindTypeCountry',
};

export function PracticeScreen({
  setId,
  practiceMode,
  aantal = null,
  toetsstand = false,
  onHome,
  onAgain,
}: {
  readonly setId: RoundSetId;
  readonly practiceMode: PracticeMode;
  /** How many questions the child asked for, or null for the round's own. */
  readonly aantal?: number | null;
  /**
   * Whether the round keeps its answers until the end (ADR-085).
   *
   * Nothing on this screen tests for it. It does not have to: a round in
   * toetsstand never rests in the revealed phase — the hook moves on before the
   * frame is painted — so every branch below that draws feedback is simply
   * never reached, and there is no second copy of the rule to keep in step.
   */
  readonly toetsstand?: boolean;
  readonly onHome: () => void;
  /** Another round of the same thing: K8's one primary button. */
  readonly onAgain: () => void;
}) {
  const { state, pick, choose, submit, giveUp, next, stop } = useRound(
    setId,
    practiceMode,
    aantal,
    toetsstand,
  );
  const prefs = usePreferences();
  const nextButton = useRef<HTMLButtonElement>(null);

  // Focus moves to "volgende vraag" the moment an answer lands, so a child on a
  // keyboard does not have to tab back out of twelve provinces to continue.
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
    return <ResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.geo || !state.answers || !state.question) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" aria-busy="true">
        <p className="text-ink-2">{t('practice.loading')}</p>
      </main>
    );
  }

  const naam = state.question.item.naam;
  const revealed = state.phase === 'revealed';
  const typing = typesTheAnswer(practiceMode);
  const choosing = choosesTheAnswer(practiceMode);
  const reading = readsTheMap(practiceMode);
  // From the round rather than from the set: in the Topomix one question is
  // about a province and the next about a sea, and the sentence has to follow.
  const { noemer } = state;

  // Choosing and typing ask the same question of the same map. Only the
  // instruction differs, because what the child does next differs.
  const instruction = choosing ? 'practice.chooseQuestion' : 'practice.typeQuestion';
  const label = reading ? t(instruction) : t(PICK_LABEL[noemer]);
  const vraag = reading ? t(TYPE_LABEL[noemer]) : t('practice.question', { naam });

  const chosenName = state.chosenId === null ? '' : (state.namesById.get(state.chosenId) ?? '');
  const nearMiss = state.verdict?.kind === 'near-miss';

  // The four answer shapes of step 7 need to know which of them applies. Only
  // three reach the map: "gemist" is what is left when the child neither found
  // it nor nearly named it, and the map works that out from the absence.
  const mapVerdict: 'correct' | 'near' | 'wrong' | undefined = !revealed
    ? undefined
    : nearMiss
      ? 'near'
      : state.verdict?.kind === 'correct'
        ? 'correct'
        : 'wrong';

  return (
    <div className="flex h-screen flex-col bg-paper">
      {/* Everything that is not the question or the map, on one line at the top.
          No navigation at any size — this screen is not wrapped in the Shell at
          all (ADR-041), so there is nothing to hide. */}
      <header className="tk-round-bar">
        <StopButton onStop={stop} />

        {/* The ten dots, except in the endless modes, which have no ten to
            count towards. There the counters carry it instead. */}
        {state.rule.kind === 'fixed' ? (
          <RoundProgress
            total={state.total}
            index={state.index}
            answered={state.index + (revealed ? 1 : 0)}
          />
        ) : null}

        {prefs.readAloud ? <SpeakButton text={vraag} /> : null}

        <div className="ml-auto flex items-center gap-4 md:gap-6">
          {/* The star being filled, on every round screen and in every mode:
              ten correct answers are one, and between two chests it is the only
              thing that moves (ADR-099). */}
          <SterTeller correct={state.correctCount} />
          {/* What is running out, or how far along you are — never both, because
              in a timed round the question number counts towards nothing. */}
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
          {/* In an endless round the dots are gone and there is room, so the
              combo stands beside the clock or the lives at every size. In a
              round with dots it waits for a screen wide enough. */}
          <Counter
            label={t('practice.counterCombo')}
            value={`×${state.combo}`}
            onlyWide={state.rule.kind === 'fixed'}
          />
        </div>
      </header>

      {/* Announced separately from the heading so a screen reader hears the new
          question on every turn, not only on the first. */}
      <p className="tk-sr-only" role="status" aria-live="polite">
        {revealed ? feedbackSentence(state, naam, chosenName) : vraag}
      </p>

      <div className="tk-round-body">
        {/* The question, and after an answer the feedback, in the same place.
            K4 asks for exactly that: between question and answer nothing moves
            except the words, so a child's eyes do not have to find the sentence
            again at the moment they most want to read it.
            On a phone this is a strip lying on the map rather than a dialog —
            a round is never interrupted by something that has to be dismissed. */}
        <div className="tk-round-question">
          {revealed ? (
            <>
              <div className="flex items-start gap-4">
                <FeedbackIcon kind={state.lastCorrect ? 'good' : nearMiss ? 'near' : 'bad'} />
                <div className="min-w-0">
                  {/* The heading is the right answer, not the word "fout" (K6):
                      first what it is, and only then what the child chose. */}
                  <p className="tk-display text-h2 font-semibold">
                    {state.lastCorrect
                      ? t('practice.correct', { naam })
                      : nearMiss
                        ? t('practice.almost')
                        : t('practice.wrong', { naam })}
                  </p>
                  <p className="text-body text-ink-2">{feedbackDetail(state, naam, chosenName)}</p>
                </div>
              </div>

              {/* A lightning round moves on by itself, so there is nothing to
                  press and nothing to charge a child for pressing. */}
              {state.rule.kind !== 'tijd' && (
                <button ref={nextButton} type="button" className="tk-button mt-4" onClick={next}>
                  {t('practice.next')}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="tk-label">{label}</p>
              <h1 className="tk-display mt-1 text-h1 font-semibold">{vraag}</h1>
              {typing ? <AnswerField key={state.index} onSubmit={submit} /> : null}
              {choosing && state.question.options ? (
                <OptionList key={state.index} options={state.question.options} onChoose={choose} />
              ) : null}
              {/* Drawn on K3 below the question at every size. It is the one
                  control that lets a child stop guessing, so it is secondary
                  in weight and never hidden behind anything. */}
              <button type="button" className="tk-button tk-button-secondary mt-4" onClick={giveUp}>
                {t('practice.dontKnow')}
              </button>
            </>
          )}
        </div>

        <div className="tk-round-map">
          <MapCanvas
            background={state.geo}
            answers={state.answers}
            interaction={reading ? 'show' : 'pick'}
            namesById={state.namesById}
            targetId={state.question.answerId}
            chosenId={state.chosenId}
            revealed={revealed}
            verdict={mapVerdict}
            onPick={pick}
          />
        </div>
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
 * The four names, K5.
 *
 * Two by two where there is width and one under the other where there is not,
 * so no option is ever the odd one at the end of a row — a child scanning four
 * boxes should not have to work out whether the fourth is a fourth option or
 * something else. Each is a whole box rather than a radio button with a label
 * beside it: the target is the answer, not a five-millimetre circle next to it.
 *
 * No option is marked in any way before it is pressed. There is no "chosen but
 * not confirmed" state to be in, because a second press to confirm is a second
 * chance to mis-tap and buys nothing at four options.
 */
function OptionList({
  options,
  onChoose,
}: {
  readonly options: readonly Item[];
  readonly onChoose: (itemId: string) => void;
}) {
  return (
    <div className="tk-options" role="group" aria-label={t('practice.chooseQuestion')}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="tk-option"
          onClick={() => onChoose(option.id)}
        >
          {option.naam}
        </button>
      ))}
    </div>
  );
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

/** Seconds as a clock, because 0:07 reads as "nearly out" and 7 does not. */
function klok(seconden: number): string {
  const m = Math.floor(seconden / 60);
  const sec = seconden % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function FeedbackIcon({ kind }: { readonly kind: 'good' | 'near' | 'bad' }) {
  // A shape, not only a colour. The near miss gets its own mark — neither a
  // tick nor a cross — because it is genuinely a third outcome and dressing it
  // as either would undo the point of ADR-017.
  const background =
    kind === 'good' ? 'var(--good)' : kind === 'near' ? 'var(--ink)' : 'var(--bad)';

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
