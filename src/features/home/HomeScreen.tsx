import { useEffect, useState } from 'react';
import { countMastered, retentionAfterRound, setRetention, type ItemState } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { t } from '@/i18n';
import { brand } from '@/config/brand';
import { loadItemStates } from '@/store/progress';
import { SET_IDS, type SetId } from '@/features/practice/useRound';
import type { ProfileRecord } from '@/store/db';

const THREE_WEEKS_DAYS = 21;

/**
 * The home screen, following the app design.
 *
 * Its one job is a single obvious action. Everything else on the screen argues
 * for pressing it, and the argument is a forecast rather than a score — "69%,
 * weet je hier over drie weken nog van" is the only number that says why
 * practising today is worth anything. A mastery percentage says where you are;
 * this says what happens if you stop.
 *
 * Only topography exists as content today. The design shows a Rekenen module
 * beside it, and it is deliberately not drawn: a tile that leads nowhere is a
 * promise the product cannot keep, and children notice that faster than adults.
 */

/** Explicit rather than a template literal, so a missing key is a type error. */
const SET_NAME_KEY = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
} as const;

export function HomeScreen({
  profile,
  onStart,
}: {
  readonly profile: ProfileRecord;
  readonly onStart: (setId: SetId) => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const sets = loadItemSets();
  const known = states ?? new Map<string, ItemState>();

  const now = new Date();
  const inThreeWeeks = new Date(now.getTime() + THREE_WEEKS_DAYS * 86_400_000);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <header className="flex items-baseline gap-4">
        <p className="tk-display text-2xl font-bold">{brand.name}</p>
        <p className="tk-label">{t('home.streakNone')}</p>
      </header>

      <h1 className="tk-display text-3xl font-semibold">
        {t('home.greeting', { naam: profile.naam })}
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="tk-label">{t('home.continueTitle')}</h2>

        {SET_IDS.map((setId) => {
          const set = sets.find((candidate) => candidate.id === setId);
          if (!set) return null;

          const ids = set.items.map((item) => item.id);
          const retention = setRetention(known, ids, inThreeWeeks);
          const afterRound = retentionAfterRound(known, ids, inThreeWeeks, now);
          const mastered = countMastered(known, ids);
          const started = ids.some((id) => known.get(id)?.laatsteReview != null);

          return (
            <article key={setId} className="tk-card rounded-control p-6">
              <h3 className="tk-display mb-1 text-2xl font-semibold">{t(SET_NAME_KEY[setId])}</h3>
              <p className="mb-4 text-ink-2">
                {started
                  ? t('home.setMastered', { goed: mastered, totaal: ids.length })
                  : t('home.setNew')}
              </p>

              {/* The forecast, and what one round protects. Shown only once
                  there is something to forecast: before the first round the
                  honest answer is "nothing yet", and a 0% reads as failure
                  rather than as a start. */}
              {started && (
                <div className="mb-5">
                  <p className="tk-display text-3xl font-bold tabular-nums text-topo-text">
                    {retention}%
                  </p>
                  <p className="text-ink-2">{t('home.retention')}</p>
                  {/* Only when a round today would actually move the number.
                      When the scheduler says come back later it changes
                      nothing, and claiming otherwise is how a figure stops
                      being believed. */}
                  {afterRound > retention && (
                    <p className="mt-1">{t('home.retentionAfter', { procent: afterRound })}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                className="tk-button tk-button-big"
                onClick={() => onStart(setId)}
              >
                {t('home.continueAction', { aantal: ids.length })}
              </button>
            </article>
          );
        })}
      </section>

      <p className="mt-auto text-center text-ink-2">{t('home.privacy')}</p>
    </main>
  );
}
