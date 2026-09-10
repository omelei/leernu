import { useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { StreakIcon } from '@/components/Icon';
import { currentStreak, REEKSEN, type StreakState } from '@/game-core';
import { t } from '@/i18n';
import { HOLIDAYS, loadStreak } from '@/store/streakStore';
import type { ProfileRecord } from '@/store/db';

/**
 * The right-hand end of the app bar: the streak, and who is practising.
 *
 * Both belong to the frame rather than the page, because both are true on every
 * screen. The streak is a pill now, at every size (ADR-093): the handoff draws
 * it on a phone too, where it used to be left out for width — the mark on its
 * own gave that width back.
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

  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      <Streak state={streak} />

      {/* The profile switch. It is the way to a sibling's turn (ADR-046), so it
          is a control and not a label. On a phone it is the avatar alone and
          the name is said rather than shown — the button keeps it as its
          accessible name, so it is still the child's own button. */}
      <button type="button" className="tk-profiel" onClick={onProfile}>
        {/* The animal they chose, on the round plate the handoff draws for the
            avatar. The initial is the fallback and nothing more. */}
        {sticker ? (
          <Heldplaat sticker={sticker} reeks={REEKSEN[0]} size={30} vorm="rond" />
        ) : (
          <span aria-hidden="true" className="tk-avatar">
            {profile.naam.slice(0, 1).toLocaleUpperCase('nl-NL')}
          </span>
        )}
        <span className="tk-profiel-naam">{profile.naam}</span>
      </button>
    </div>
  );
}

/**
 * Days in a row, reported honestly.
 *
 * Recomputed against today rather than read back, so a streak that has quietly
 * lapsed says so instead of showing yesterday's number (ADR-031 lets a rest day
 * bridge a gap; it does not let the label lie about one).
 */
function Streak({ state }: { readonly state: StreakState | null }) {
  if (state === null) return null;

  const days = currentStreak(state, new Date(), HOLIDAYS);

  return (
    <span className="tk-streak">
      <StreakIcon size={16} />
      <span className="tk-label">
        {days === 0
          ? t('home.streakNone')
          : days === 1
            ? t('home.streakOne')
            : t('home.streakMany', { aantal: days })}
      </span>
    </span>
  );
}
