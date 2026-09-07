import { useEffect, useState } from 'react';
import { countMastered, retentionAfterRound, setRetention, type ItemState } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { t, type TranslationKey } from '@/i18n';
import { TestDate } from './TestDate';
import { loadItemStates } from '@/store/progress';
import { loadStreak, HOLIDAYS } from '@/store/streakStore';
import { currentStreak, type StreakState } from '@/game-core';
import { SET_IDS, type PracticeMode, type SetId } from '@/features/practice/useRound';
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

/**
 * Typed as a complete record, so adding a set to `SetId` fails to compile here
 * rather than rendering a blank heading. The islands were added and this was
 * not, which is exactly the mistake the type now prevents — and the reason the
 * annotation belongs on the definition and not on the lookup.
 */
const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
};

const MODE_NAME_KEY: Record<PracticeMode, TranslationKey> = {
  'wijs-aan': 'mode.wijs-aan',
  meerkeuze: 'mode.meerkeuze',
  'hoe-heet-dit': 'mode.hoe-heet-dit',
  bliksemronde: 'mode.bliksemronde',
  overleven: 'mode.overleven',
};

export function HomeScreen({
  profile,
  onStart,
  onChoose,
}: {
  readonly profile: ProfileRecord;
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  /** Every other way of practising, which is K2's job now. */
  readonly onChoose: () => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadStreak().then(setStreak);
  }, []);

  const sets = loadItemSets();
  const known = states ?? new Map<string, ItemState>();

  const now = new Date();
  const inThreeWeeks = new Date(now.getTime() + THREE_WEEKS_DAYS * 86_400_000);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <StreakBadge state={streak} />

      <h1 className="tk-display text-h1 font-semibold">
        {t('home.greeting', { naam: profile.naam })}
      </h1>

      {/* Above the sets, because it is the reason one of them is being opened.
          K1 gives it the only surface-and-border on the screen. */}
      <TestDate />

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
            <article key={setId} className="tk-card">
              <h3 className="tk-display mb-1 text-h2 font-semibold">{t(SET_NAME_KEY[setId])}</h3>
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
                <div className="mb-6">
                  <p className="tk-display text-h1 font-bold tabular-nums">{retention}%</p>
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

              {/* One primary button, which K1 asks for: the shortest way into a
                  round is pointing, and every other choice lives on K2 rather
                  than as five more buttons on a card. */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="tk-button"
                  onClick={() => onStart(setId, 'wijs-aan')}
                >
                  {t(MODE_NAME_KEY['wijs-aan'])}
                </button>
                <button type="button" className="tk-button tk-button-secondary" onClick={onChoose}>
                  {t('home.moreWays')}
                </button>
              </div>

              <p className="mt-2 text-ink-2">{t('home.continueAction', { aantal: ids.length })}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

/**
 * The streak, reported honestly.
 *
 * `currentStreak` rather than the stored number: a child who has already run
 * out of rest days should not be shown a 12 that turns into a 1 the moment they
 * practise. Seeing it drop is worse than never having been told.
 */
function StreakBadge({ state }: { readonly state: StreakState | null }) {
  if (state === null) return <p className="tk-label" />;

  const days = currentStreak(state, new Date(), HOLIDAYS);
  if (days === 0) return <p className="tk-label">{t('home.streakNone')}</p>;

  return (
    <p className="tk-label">
      {days === 1 ? t('home.streakOne') : t('home.streakMany', { aantal: days })}
      {state.rustdagen > 0 &&
        ` · ${
          state.rustdagen === 1
            ? t('home.restDay', { aantal: state.rustdagen })
            : t('home.restDays', { aantal: state.rustdagen })
        }`}
    </p>
  );
}
