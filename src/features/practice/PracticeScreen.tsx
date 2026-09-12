import { useEffect, useRef, useState } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { antwoordToestanden } from '@/game-core';
import { Button } from '@/components/Button';
import { AntwoordKnop, Laden } from '@/components/ds';
import { AntwoordVeld } from '@/features/round/AntwoordVeld';
import { Terugkoppeling } from '@/features/round/Terugkoppeling';
import { useRondeThema } from '@/features/round/useRondeThema';
import { Vraagbalk } from '@/features/round/Vraagbalk';
import { MapCanvas } from './MapCanvas';
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
 * A round on the map (S5–S9).
 *
 * No frame: no kopbalk, no rail, no tab bar — this screen is not wrapped in the
 * Shell at all (ADR-041) — and the round's dark theme on the root while a
 * question is up. The question bar on top, the canvas under it filling what is
 * left, and under the canvas whatever the child answers with: the four names,
 * the field, and after an answer the feedback card. Never over the map.
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
 *
 * There is no "Ik weet het niet" any more: S5 draws no action during a
 * question, and nothing a child has to confirm.
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
  /** Another round of the same thing: the result's one primary button. */
  readonly onAgain: () => void;
}) {
  const { state, pick, choose, submit, next, stop } = useRound(
    setId,
    practiceMode,
    aantal,
    toetsstand,
  );
  const nextButton = useRef<HTMLButtonElement>(null);
  /** Which of the four names was pressed, and on which question. */
  const [gekozen, setGekozen] = useState<{ readonly index: number; readonly id: string } | null>(
    null,
  );

  useRondeThema(state.error === null && state.phase !== 'finished');

  // Focus moves to "volgende vraag" the moment an answer lands, so a child on a
  // keyboard does not have to tab back out of twelve provinces to continue.
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
    return <ResultScreen state={state} onHome={onHome} onAgain={onAgain} />;

  if (state.phase === 'loading' || !state.geo || !state.answers || !state.question) {
    return (
      <main className="ln-ronde ln-ronde-laden" aria-busy="true">
        <Laden label={t('practice.loading')} />
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

  const vraag = reading ? t(TYPE_LABEL[noemer]) : t('practice.question', { naam });
  // Read aloud says what to do as well, which the heading leaves to the map:
  // "Waar ligt Texel? Wijs het eiland aan."
  const instructie = choosing
    ? t('practice.chooseQuestion')
    : typing
      ? t('practice.typeQuestion')
      : t(PICK_LABEL[noemer]);
  const voorlezen = `${vraag} ${instructie}.`;

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

  // After an answer the four names keep their places and take their states:
  // the one pressed, and the right one if that was another (S7).
  const toestanden =
    revealed && choosing
      ? antwoordToestanden(
          gekozen?.index === state.index ? gekozen.id : null,
          state.question.item.id,
        )
      : null;

  return (
    <div className="ln-ronde">
      <Vraagbalk
        vraag={vraag}
        voorlezen={voorlezen}
        index={state.index}
        totaal={state.rule.kind === 'fixed' ? state.total : null}
        beantwoord={state.index + (revealed ? 1 : 0)}
        goed={state.correctCount}
        onStop={stop}
      />

      {/* Announced separately from the heading so a screen reader hears the new
          question on every turn, not only on the first. */}
      <p className="ln-sr-only" role="status" aria-live="polite">
        {revealed ? feedbackSentence(state, naam, chosenName) : vraag}
      </p>

      <div className="ln-canvas">
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

      <div className="ln-ronde-paneel">
        {choosing && state.question.options ? (
          <div className="ln-antwoorden" role="group" aria-label={t('practice.chooseQuestion')}>
            {state.question.options.map((option) => (
              <AntwoordKnop
                key={option.id}
                toestand={toestanden?.get(option.id) ?? null}
                disabled={revealed}
                onClick={() => {
                  setGekozen({ index: state.index, id: option.id });
                  choose(option.id);
                }}
              >
                {option.naam}
              </AntwoordKnop>
            ))}
          </div>
        ) : null}

        {typing && !revealed ? (
          <AntwoordVeld
            key={state.index}
            label={t('practice.typeQuestion')}
            placeholder={t('practice.typePlaceholder')}
            maxLength={40}
            onSubmit={submit}
          />
        ) : null}

        {revealed ? (
          <Terugkoppeling
            toestand={state.lastCorrect ? 'goed' : 'fout'}
            // The heading is the right answer, not the word "fout" (S7): first
            // what it is, and only then what the child chose.
            kop={
              state.lastCorrect
                ? t('practice.correct', { naam })
                : nearMiss
                  ? t('practice.almost')
                  : t('practice.wrong', { naam })
            }
            detail={feedbackDetail(state, naam, chosenName)}
            // A round on a clock moves on by itself, so there is nothing to
            // press and nothing to charge a child for pressing.
            knop={state.rule.kind === 'tijd' ? null : t('practice.next')}
            onVolgende={next}
            knopRef={nextButton}
          />
        ) : null}
      </div>
    </div>
  );
}
type State = ReturnType<typeof useRound>['state'];

/** What a screen reader hears. Same three cases as the feedback card. */
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
