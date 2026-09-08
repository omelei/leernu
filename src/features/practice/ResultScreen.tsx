import { t, type TranslationKey } from '@/i18n';
import type { GeoSet } from '@/content/loadGeo';
import type { AnswerLayer } from './MapCanvas';
import type { StampId } from '@/game-core';
import { isMixSet, type RoundState } from './useRound';

/**
 * The screen after a round. Spec section 4.6 asks for exactly three things and
 * no more: what went well, the items still missing, and one concrete next step.
 *
 * The map beside the list is the part that does the teaching. A list of names a
 * child got wrong is a list of words; the same names lit up on the map is the
 * thing they were actually failing to picture. Reading "Drenthe" tells them
 * nothing they did not already know — seeing where Drenthe is does.
 */
export function ResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: RoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const missedIds = new Set(
    state.missed.map((item) => item.geometrieRef).filter((id): id is string => id !== undefined),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      {/* The score is what happened; what changed is the product.
          So the heading is the change and the score sits under it as a fact —
          the round's result is a number a child could count themselves, and
          "two more than when you sat down" is the one thing on this screen
          they could not have. */}
      <div>
        <p className="tk-label">{t('result.title')}</p>
        <h1 className="tk-display text-h1 font-semibold">{t('result.changed')}</h1>
        <p className="text-body">
          {state.gained === 0
            ? t('result.gainedNone')
            : state.gained === 1
              ? t('result.gainedOne')
              : t('result.gainedMany', { aantal: state.gained })}
        </p>
        <p className="mt-2 text-ink-2">
          {t('result.score', { goed: state.correctCount, totaal: state.answeredCount })}
        </p>
        {state.rule.kind === 'fixed' && state.answeredCount < state.total && (
          <p className="text-ink-2">
            {t('result.stoppedEarly', { gedaan: state.answeredCount, totaal: state.total })}
          </p>
        )}
        <StreakLine state={state} />
        <RewardLine state={state} />
      </div>

      {state.missed.length === 0 ? (
        <p className="text-body">{t('result.allCorrect')}</p>
      ) : (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <section className="md:w-1/2">
            <h2 className="tk-label mb-2">{t('result.practiceMore')}</h2>
            <ul className="flex flex-col gap-2">
              {state.missed.map((item) => (
                <li key={item.id} className="tk-card">
                  <p className="tk-display text-h3 font-semibold">{item.naam}</p>
                  {item.weetje !== undefined && <p className="text-ink-2">{item.weetje}</p>}
                </li>
              ))}
            </ul>
          </section>

          {/* The map is absent after a Topomix, and that is the honest thing.
              A mix asks about provinces, capitals, islands and seas in one
              round; one map can light up one of those layers, so a review map
              here would show a child four of their eight misses and quietly
              drop the rest. The list beside it names all of them. */}
          {state.geo !== null && !isMixSet(state.setId) && (
            <section className="md:w-1/2" aria-label={t('result.mapLabel')}>
              <div className="tk-card flex justify-center">
                <ReviewMap background={state.geo} answers={state.answers} highlighted={missedIds} />
              </div>
              <p className="mt-2 text-ink-2">{t('result.mapHelp')}</p>
            </section>
          )}
        </div>
      )}

      {/* One primary button, and it is another round rather than the way out:
          the shortest path back to practising, same as K1. */}
      <div className="mt-auto flex flex-wrap gap-3">
        <button type="button" className="tk-button" onClick={onAgain}>
          {t('result.again')}
        </button>
        <button type="button" className="tk-button tk-button-secondary" onClick={onHome}>
          {t('result.home')}
        </button>
      </div>
    </main>
  );
}

/**
 * A map with nothing to click: the shapes or cities a child missed, lit up
 * together. Decorative for a screen reader — the same information is already in
 * the list beside it, and a second reading of twelve province names is noise.
 */
function ReviewMap({
  background,
  answers,
  highlighted,
}: {
  readonly background: GeoSet;
  readonly answers: AnswerLayer | null;
  readonly highlighted: ReadonlySet<string>;
}) {
  const [, , viewWidth, viewHeight] = background.viewBox;
  const litShapes =
    answers?.kind === 'background'
      ? background.vormen
      : answers?.kind === 'shapes'
        ? answers.set.vormen
        : [];

  return (
    <svg
      viewBox={background.viewBox.join(' ')}
      className="h-auto w-full max-w-sm"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
      role="img"
      aria-hidden="true"
    >
      {background.vormen.map((vorm) => (
        <path
          key={vorm.id}
          d={vorm.d}
          fill="var(--paper)"
          stroke="var(--ink-3)"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ))}

      {litShapes
        .filter((vorm) => highlighted.has(vorm.id))
        .map((vorm) => (
          <path
            key={vorm.id}
            d={vorm.d}
            fill="var(--accent-tint)"
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ))}

      {answers?.kind === 'points' &&
        answers.set.punten
          .filter((point) => highlighted.has(point.id))
          .map((point) => (
            <circle
              key={point.id}
              cx={point.punt[0]}
              cy={point.punt[1]}
              r={9}
              fill="var(--accent-tint)"
              stroke="var(--accent)"
              strokeWidth={3}
            />
          ))}
    </svg>
  );
}

/**
 * What today did to the streak.
 *
 * Told after the score, never before it: the number that matters is what the
 * child learned, and a streak that leads the screen turns a lesson into a
 * scoreboard. It is also silent when nothing happened — a second round on the
 * same day says nothing, because nothing changed.
 */
function StreakLine({ state }: { readonly state: RoundState }) {
  const streak = state.streak;
  if (streak === null || !streak.counted) return null;

  const days = streak.state.huidigeStreak;

  return (
    <p className="mt-2 text-ink-2">
      {days === 1
        ? streak.broken
          ? t('result.streakGrewOne')
          : t('result.streakStarted')
        : t('result.streakGrew', { aantal: days })}
      {/* Said out loud rather than silently spent. A safety net nobody knows
          about protects the streak but teaches nothing about coming back. */}
      {streak.rustdagenGebruikt > 0 && ` ${t('result.streakSaved')}`}
      {streak.rustdagVerdiend && ` ${t('result.restDayEarned')}`}
    </p>
  );
}

/**
 * What the round earned. Below the score and the streak, in that order: the
 * number that matters is what the child learned, and points that lead the
 * screen turn a lesson into a scoreboard.
 */
const STAMP_NAME: Record<StampId, TranslationKey> = {
  'provincies-foutloos': 'stamp.provincies-foutloos',
  'hoofdsteden-foutloos': 'stamp.hoofdsteden-foutloos',
  'eilanden-foutloos': 'stamp.eilanden-foutloos',
  'week-op-rij': 'stamp.week-op-rij',
  'set-onthouden': 'stamp.set-onthouden',
  'wateren-foutloos': 'stamp.wateren-foutloos',
  'steden-foutloos': 'stamp.steden-foutloos',
  'tafel-foutloos': 'stamp.tafel-foutloos',
  'bliksem-tien': 'stamp.bliksem-tien',
  'overleven-vijftien': 'stamp.overleven-vijftien',
};

/**
 * Coins are earned and stored on every round, and deliberately not shown.
 *
 * There is nothing to spend them on yet. A currency with no shop is a promise
 * the product does not keep, and with children that is the edge where dark
 * patterns start — a number that only goes up, implying something that never
 * arrives. They keep accruing, so the day a shop exists nobody has lost
 * anything they earned.
 */
function RewardLine({ state }: { readonly state: RoundState }) {
  const reward = state.reward;
  if (reward === null || reward.stamps.length === 0) return null;

  // Unknown ids are skipped rather than rendered. Stored rows outlive the code
  // that wrote them — "eerste-ronde" is retired and "set-vast" was renamed — and
  // a stamp nobody can name is a blank line where a reward should be.
  const named = reward.stamps.filter((stamp) => stamp in STAMP_NAME);
  if (named.length === 0) return null;

  return (
    <>
      {named.map((stamp) => (
        <p key={stamp} className="mt-1">
          <span className="tk-display font-semibold">
            {t('result.newStamp', { naam: t(STAMP_NAME[stamp]) })}
          </span>
          {/* The criterion beside the name, always. A reward you cannot explain
              is a riddle, and a child who does not know what earned it cannot
              earn another one on purpose. */}
          <span className="block text-ink-2">
            {t(`${STAMP_NAME[stamp]}.criterion` as TranslationKey)}
          </span>
        </p>
      ))}
    </>
  );
}
