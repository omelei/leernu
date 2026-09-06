import { t } from '@/i18n';
import type { GeoSet, PointSet } from '@/content/loadGeo';
import type { RoundState } from './useRound';

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
}: {
  readonly state: RoundState;
  readonly onHome: () => void;
}) {
  const missedIds = new Set(
    state.missed.map((item) => item.geometrieRef).filter((id): id is string => id !== undefined),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <p className="tk-label">{t('result.title')}</p>
        <h1 className="tk-display text-3xl font-semibold">
          {t('result.score', { goed: state.correctCount, totaal: state.answeredCount })}
        </h1>
        {state.answeredCount < state.total && (
          <p className="text-ink-2">
            {t('result.stoppedEarly', { gedaan: state.answeredCount, totaal: state.total })}
          </p>
        )}
        <StreakLine state={state} />
      </div>

      {state.missed.length === 0 ? (
        <p className="text-lg">{t('result.allCorrect')}</p>
      ) : (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <section className="md:w-1/2">
            <h2 className="tk-label mb-2">{t('result.practiceMore')}</h2>
            <ul className="flex flex-col gap-2">
              {state.missed.map((item) => (
                <li key={item.id} className="tk-card rounded-control px-4 py-3">
                  <p className="tk-display text-xl font-semibold">{item.naam}</p>
                  {item.weetje !== undefined && <p className="text-ink-2">{item.weetje}</p>}
                </li>
              ))}
            </ul>
          </section>

          {state.geo !== null && (
            <section className="md:w-1/2" aria-label={t('result.mapLabel')}>
              <div className="tk-card flex justify-center rounded-control p-3">
                <ReviewMap
                  geo={state.geo}
                  points={state.points}
                  mode={state.mode}
                  highlighted={missedIds}
                />
              </div>
              <p className="mt-2 text-ink-2">{t('result.mapHelp')}</p>
            </section>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3">
        <button type="button" className="tk-button" onClick={onHome}>
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
  geo,
  points,
  mode,
  highlighted,
}: {
  readonly geo: GeoSet;
  readonly points: PointSet | null;
  readonly mode: RoundState['mode'];
  readonly highlighted: ReadonlySet<string>;
}) {
  const [, , viewWidth, viewHeight] = geo.viewBox;

  return (
    <svg
      viewBox={geo.viewBox.join(' ')}
      className="h-auto w-full max-w-sm"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
      role="img"
      aria-hidden="true"
    >
      {geo.vormen.map((vorm) => {
        const lit = mode === 'shapes' && highlighted.has(vorm.id);
        return (
          <path
            key={vorm.id}
            d={vorm.d}
            fill={lit ? 'var(--topo-tint)' : 'var(--paper)'}
            stroke={lit ? 'var(--topo)' : 'var(--line-strong)'}
            strokeWidth={lit ? 3 : 1}
            strokeLinejoin="round"
          />
        );
      })}

      {mode === 'points' &&
        points?.punten
          .filter((point) => highlighted.has(point.id))
          .map((point) => (
            <circle
              key={point.id}
              cx={point.punt[0]}
              cy={point.punt[1]}
              r={9}
              fill="var(--topo-tint)"
              stroke="var(--topo)"
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
      {streak.freezesUsed > 0 && ` ${t('result.streakSaved')}`}
      {streak.freezeEarned && ` ${t('result.freezeEarned')}`}
    </p>
  );
}
