import { t } from '@/i18n';
import { Beloning } from '@/features/reis/Beloning';
import { RoundMark } from '@/components/RoundMark';
import { KlokFace } from './KlokFace';
import { klokVoluit } from './klokTaal';
import type { KlokRoundState } from './useKlokRound';

/**
 * K8 for the clock.
 *
 * The same argument as the other two result screens: the score is there, and
 * what changed is the product. "Twee tijden meer die je nu kunt lezen" is the
 * one line a child could not have counted themselves, so it gets the heading.
 *
 * The times still to practise are **shown as well as told**, which is the one
 * place this screen differs from rekenen's. A sum cannot be pointed at, so
 * reading "7 × 8 = 56" is what looking at it does; a clock can, and a child who
 * has just misread half past seven should see the hands that say it beside the
 * words. That is the same reasoning the map's result screen uses to draw the
 * places rather than list them.
 */
export function KlokResultScreen({
  state,
  onHome,
  onAgain,
}: {
  readonly state: KlokRoundState;
  readonly onHome: () => void;
  readonly onAgain: () => void;
}) {
  // Only a fixed round has a total to fall short of. "Je stopte na 3 van de
  // 144" would be a lie about a round that was never going to ask 144.
  const stoppedEarly = state.rule.kind === 'fixed' && state.answeredCount < state.total;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6" data-module="klok">
      <div>
        <p className="tk-label">{t('result.title')}</p>
        <h1 className="tk-display text-paginakop">{t('result.changed')}</h1>
        <p className="mt-2 text-lopend">
          {state.gained === 0
            ? t('result.gainedNone')
            : state.gained === 1
              ? t('result.gainedOne')
              : t('result.gainedMany', { aantal: state.gained })}
        </p>
        <p className="mt-4 text-tekst-secundair">
          {t('result.score', { goed: state.correctCount, totaal: state.answeredCount })}
        </p>
        {stoppedEarly ? (
          <p className="text-tekst-secundair">
            {t('result.stoppedEarly', { gedaan: state.answeredCount, totaal: state.total })}
          </p>
        ) : null}
      </div>

      {/* The mark, on the one round that has earned one. See the other two
          result screens: same block, same place, same argument. */}
      {state.toetsstand ? (
        <RoundMark goed={state.correctCount} totaal={state.answeredCount} />
      ) : null}

      {/* What the round handed over, if it handed anything over. */}
      <Beloning reward={state.reward} />

      {state.missed.length > 0 ? (
        <section className="flex flex-col gap-3" aria-label={t('klok.practiceMore')}>
          <h2 className="tk-label">{t('klok.practiceMore')}</h2>
          <ul className="tk-klok-lijst list-none p-0">
            {state.missed.map((tijd) => (
              <li key={tijd.id} className="tk-klok-gemist">
                {/* The face is decorative here and deliberately so: the words
                    beside it say the same thing, and a screen reader that read
                    both would hear half past seven twice. */}
                <KlokFace item={tijd} cijfers={false} />
                <span>{klokVoluit(tijd)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-lopend">{t('result.allCorrect')}</p>
      )}

      {state.streak ? (
        <p className="text-tekst-secundair">
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
