import { useEffect, useState } from 'react';
import { currentStreak, type StreakState } from '@/game-core';
import { t } from '@/i18n';
import { HOLIDAYS, loadStreak } from '@/store/streakStore';
import { stickerById } from '@/components/stickerSet';
import type { ProfileRecord } from '@/store/db';

/**
 * The right-hand end of the app bar: the streak, and who is practising.
 *
 * K1 puts both here rather than in the page — "profielwissel rechtsboven" — and
 * that is the difference between a number about today and a number about the
 * work. The streak belongs to the frame because it is true on every screen; a
 * child's progress does not restart when they open a different module.
 *
 * Moving it out of the page also stops it competing with the sentence that
 * opens K1. "Vandaag oefen je 10 vragen" is the argument; a run of days is
 * context for it, not a rival headline.
 */
export function TopBar({
  profile,
  onProfile,
}: {
  readonly profile: ProfileRecord;
  readonly onProfile?: (() => void) | undefined;
}) {
  const [streak, setStreak] = useState<StreakState | null>(null);

  useEffect(() => {
    void loadStreak().then(setStreak);
  }, []);

  const sticker = profile.avatarConfig.sticker;
  const Sticker = stickerById(sticker).draw;

  return (
    <div className="ml-auto flex min-w-0 items-center gap-4">
      {/* Only where the rail stands up. The app bar on a phone is a wordmark and
          a name across 393, and from a tablet up it now carries the four
          destinations as well — K1's own frames do not put the streak on
          either. It is context for the work, and navigation costs the width
          first. */}
      <span className="hidden xl:inline">
        <StreakLabel state={streak} />
      </span>

      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label — and it says the name rather than only
          drawing an initial, because a child who cannot yet read a monogram can
          read their own name. */}
      <button type="button" className="tk-pill min-w-0" onClick={onProfile}>
        {/* The animal they chose, where a monogram used to be. A child who
            cannot yet read an initial can recognise a fox, and the choice they
            made on the front door has to be visible somewhere other than the
            card they made it on or it does not look saved. The initial is the
            fallback and nothing more. */}
        <span aria-hidden="true" className="tk-avatar">
          {sticker ? (
            <Sticker size={20} />
          ) : (
            profile.naam.slice(0, 1).toLocaleUpperCase('nl-NL')
          )}
        </span>
        {/* A name a child chose themselves can be long. It shortens rather than
            pushing the bar off the side of a 393 screen. */}
        <span className="truncate">{profile.naam}</span>
      </button>
    </div>
  );
}

/**
 * Days in a row, reported honestly.
 *
 * Recomputed against today rather than read back, so a streak that has quietly
 * lapsed says so instead of showing yesterday's number (ADR-031 lets a rest
 * day bridge a gap; it does not let the label lie about one).
 */
function StreakLabel({ state }: { readonly state: StreakState | null }) {
  if (state === null) return null;

  const days = currentStreak(state, new Date(), HOLIDAYS);
  if (days === 0) return <span className="tk-label">{t('home.streakNone')}</span>;

  return (
    <span className="tk-label">
      {days === 1 ? t('home.streakOne') : t('home.streakMany', { aantal: days })}
    </span>
  );
}
