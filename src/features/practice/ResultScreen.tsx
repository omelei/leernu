import { t } from '@/i18n';
import type { RoundState } from './useRound';

/**
 * The screen after a round. Spec section 4.6 asks for exactly three things and
 * no more: what went well, the two or three items still missing, and one
 * concrete next step.
 *
 * The restraint is the design. A wall of statistics after every round is how a
 * child learns that finishing is paperwork; three sentences is how they learn
 * what to do tomorrow.
 */
export function ResultScreen({
  state,
  onHome,
}: {
  readonly state: RoundState;
  readonly onHome: () => void;
}) {
  // Two or three, never the whole list. A child who missed eight does not need
  // to read eight; they need to know where to start.
  const toPractise = state.missed.slice(0, 3);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
      <div>
        <p className="tk-label">{t('result.title')}</p>
        <h1 className="tk-display text-3xl font-semibold">
          {t('result.score', { goed: state.correctCount, totaal: state.total })}
        </h1>
      </div>

      {toPractise.length === 0 ? (
        <p className="text-lg">{t('result.allCorrect')}</p>
      ) : (
        <section>
          <h2 className="tk-label mb-2">{t('result.practiceMore')}</h2>
          <ul className="flex flex-col gap-2">
            {toPractise.map((item) => (
              <li key={item.id} className="tk-card rounded-control px-4 py-3">
                <p className="tk-display text-xl font-semibold">{item.naam}</p>
                {item.weetje !== undefined && <p className="text-ink-2">{item.weetje}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="tk-button" onClick={onHome}>
          {t('result.home')}
        </button>
      </div>
    </main>
  );
}
