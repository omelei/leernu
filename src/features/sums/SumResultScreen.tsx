import { t } from '@/i18n';
import { sumText } from '@/game-core';
import type { SumRoundState } from './useSumRound';

/**
 * K8 for the tables.
 *
 * The same argument as the map's result screen: the score is there, and what
 * changed is the product. "Twee sommen meer die je nu onthoudt" is the one line
 * on this screen a child could not have counted themselves, so it is the one
 * that gets the heading.
 *
 * The sums still to practise are listed with their answers. On the map they are
 * shown as places rather than told, because a map can show; a sum cannot be
 * pointed at, and reading "7 × 8 = 56" is what looking at it does.
 */
export function SumResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: SumRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const stoppedEarly = state.answeredCount < state.total;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6" data-module="tafels">
      <div>
        <p className="tk-label">{t('result.title')}</p>
        <h1 className="tk-display text-h1 font-semibold">{t('result.changed')}</h1>
        <p className="mt-2 text-body">
          {state.gained === 0
            ? t('result.gainedNone')
            : state.gained === 1
              ? t('result.gainedOne')
              : t('result.gainedMany', { aantal: state.gained })}
        </p>
        <p className="mt-4 text-ink-2">
          {t('result.score', { goed: state.correctCount, totaal: state.answeredCount })}
        </p>
        {stoppedEarly ? (
          <p className="text-ink-2">
            {t('result.stoppedEarly', { gedaan: state.answeredCount, totaal: state.total })}
          </p>
        ) : null}
      </div>

      {state.missed.length > 0 ? (
        <section className="flex flex-col gap-3" aria-label={t('sums.practiceMore')}>
          <h2 className="tk-label">{t('sums.practiceMore')}</h2>
          <ul className="tk-options list-none p-0">
            {state.missed.map((sum) => (
              <li key={sum.id} className="tk-option tabular-nums">
                {`${sumText(sum)} = ${sum.antwoord}`}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-body">{t('result.allCorrect')}</p>
      )}

      {state.streak ? (
        <p className="text-ink-2">
          {state.streak.state.huidigeStreak <= 1
            ? t('result.streakGrewOne')
            : t('result.streakGrew', { aantal: state.streak.state.huidigeStreak })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
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
