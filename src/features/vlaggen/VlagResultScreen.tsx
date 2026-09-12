import { t } from '@/i18n';
import { Beloning } from '@/features/reis/Beloning';
import { RoundMark } from '@/components/RoundMark';
import { Vlag } from './Vlag';
import type { VlagRoundState } from './useVlagRound';

/**
 * K8 for flags.
 *
 * The clock's result screen with flags where the faces were: the score is
 * there, and what changed gets the heading. The flags still to practise are
 * shown as well as named, for the clock's reason — a flag can be looked at,
 * and a child who has just chosen Roemenië for Tsjaad should see the flag that
 * was meant.
 *
 * After an oefentoets the mark is here, as after every oefentoets. The flags
 * got wrong in it are what "Oefen je fouten" holds from now on, on the module
 * page, the way the tables do it (ADR-078, ADR-102).
 */
export function VlagResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: VlagRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  const stoppedEarly = state.rule.kind === 'fixed' && state.answeredCount < state.total;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6" data-module="vlaggen">
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

      {state.toetsstand ? (
        <RoundMark goed={state.correctCount} totaal={state.answeredCount} />
      ) : null}

      <Beloning reward={state.reward} />

      {state.missed.length > 0 ? (
        <section className="flex flex-col gap-3" aria-label={t('vlag.practiceMore')}>
          <h2 className="tk-label">{t('vlag.practiceMore')}</h2>
          <ul className="tk-vlag-lijst list-none p-0">
            {state.missed.map((vlag) => (
              <li key={vlag.id} className="tk-vlag-gemist">
                {/* Decorative here: the name beside it says the same thing. */}
                <Vlag vlag={vlag} alt="" />
                <span>{vlag.naam}</span>
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
