import { useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { StreakIcon } from '@/components/Icon';
import { currentStreak, type StreakState } from '@/game-core';
import { reeksVan, useHelden } from '@/features/reis/useHelden';
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
  const helden = useHelden();

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
        {/* The hero they chose, on its plate — or, until they choose, the
            first one, which is also what their progress card shows. A child
            always has one (ADR-067), and an initial in the bar beside a hero in
            the column was two answers to who you are. At this size there are
            no rings; the plate's tone carries the reeks. */}
        <Heldplaat sticker={sticker} reeks={reeksVan(helden, sticker)} size={30} />
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
