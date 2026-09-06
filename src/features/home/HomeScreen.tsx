import { useEffect, useState } from 'react';
import { countMastered, retentionAfterRound, setRetention, type ItemState } from '@/game-core';
import { loadAllItems } from '@/content/loadSets';
import { t } from '@/i18n';
import { brand } from '@/config/brand';
import { loadItemStates } from '@/store/progress';
import type { ProfileRecord } from '@/store/db';

const THREE_WEEKS_DAYS = 21;
const ROUND_SIZE = 10;

/**
 * The home screen, following the app design.
 *
 * Its one job is a single obvious action: **Ga verder**. Everything else on the
 * screen argues for pressing it, and the argument is a forecast rather than a
 * score — "67%, weet je hier over drie weken nog van" is the only number that
 * says why practising today is worth anything. A mastery percentage says where
 * you are; this says what happens if you stop.
 *
 * Only topography exists as content today. The design shows a Rekenen module
 * beside it, and it is deliberately not drawn here: a tile that leads nowhere
 * is a promise the product cannot keep, and children notice that faster than
 * adults do.
 */
export function HomeScreen({
  profile,
  onStart,
}: {
  readonly profile: ProfileRecord;
  readonly onStart: () => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const items = loadAllItems();
  const itemIds = items.map((item) => item.id);

  const now = new Date();
  const inThreeWeeks = new Date(now.getTime() + THREE_WEEKS_DAYS * 86_400_000);

  const known = states ?? new Map<string, ItemState>();
  const retention = setRetention(known, itemIds, inThreeWeeks);
  const afterRound = retentionAfterRound(known, itemIds, inThreeWeeks, now);
  const mastered = countMastered(known, itemIds);
  const started = [...known.values()].some((state) => state.laatsteReview !== null);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <header className="flex items-baseline gap-4">
        <p className="tk-display text-2xl font-bold">{brand.name}</p>
        <p className="tk-label">{t('home.streakNone')}</p>
      </header>

      <h1 className="tk-display text-3xl font-semibold">
        {t('home.greeting', { naam: profile.naam })}
      </h1>

      <section className="tk-card rounded-control p-6">
        <p className="tk-label">{t('home.continueTitle')}</p>
        <h2 className="tk-display mb-4 text-2xl font-semibold">Provincies van Nederland</h2>

        {/* The forecast, and what one round protects. Shown only once there is
            something to forecast — before the first round the honest answer is
            "nothing yet", and a 0% would read as failure rather than a start. */}
        {started && (
          <div className="mb-5">
            <p className="tk-display text-3xl font-bold tabular-nums text-topo-text">{retention}%</p>
            <p className="text-ink-2">{t('home.retention')}</p>
            {/* Only shown when a round today would actually change the number.
                When the scheduler says come back later it changes nothing, and
                claiming otherwise is how a figure stops being believed. */}
            {afterRound > retention && (
              <p className="mt-1">{t('home.retentionAfter', { procent: afterRound })}</p>
            )}
          </div>
        )}

        <button type="button" className="tk-button tk-button-big" onClick={onStart}>
          {t('home.continueAction', { aantal: ROUND_SIZE })}
        </button>
      </section>

      <section>
        <h2 className="tk-label mb-2">{t('home.chooseOther')}</h2>
        <div className="tk-card flex items-center justify-between rounded-control px-4 py-3">
          <p className="tk-display text-xl font-semibold">Provincies</p>
          <p className="text-ink-2">
            {started
              ? t('home.setMastered', { goed: mastered, totaal: itemIds.length })
              : t('home.setNew')}
          </p>
        </div>
      </section>

      <p className="mt-auto text-center text-ink-2">{t('home.privacy')}</p>
    </main>
  );
}

