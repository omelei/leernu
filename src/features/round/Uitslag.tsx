import { useEffect, useRef, type ReactNode } from 'react';
import { rondeUitslag, type ItemState, type Schedulable } from '@/game-core';
import { Button } from '@/components/Button';
import { Lijst, PaginaKop, Rij } from '@/components/ds';
import { RoundMark } from '@/components/RoundMark';
import { telwoord } from '@/features/home/dagen';
import { Beloning } from '@/features/reis/Beloning';
import { STAMP_NAME } from '@/features/reis/stampNames';
import { t, type TranslationKey } from '@/i18n';
import type { RoundOutcome } from '@/store/rewardStore';
import type { RondeKern } from './useRoundCore';
import { useUitslagKader } from './UitslagKader';

type StreakChange = NonNullable<RondeKern<unknown, unknown, Schedulable, unknown>['streak']>;

/**
 * De uitslag (S10), the same for every round.
 *
 * Here the child steps out of the round: the kopbalk and the rail come back,
 * the ground comes back, and the accent goes — outside a module it does not
 * exist. The first heading is a title, because this is about one round, and
 * the score is in the meta line, where a fact belongs.
 *
 * **One card of three rows instead of four paragraphs**: what is newly
 * remembered, what was refreshed, what keeps changing. Each row counts and
 * names the first two; six loose lines would be a log, not a result. What
 * changed is worked out from the boxes before and after the round (ADR-107),
 * over the items the round actually answered.
 *
 * One primary action, another round, and focus on it when the screen appears.
 * No minutes: time is not part of the learning core.
 */
export function Uitslag({
  voor,
  na,
  naamVan,
  goed,
  beantwoord,
  totaal,
  fouten,
  toetsstand,
  reward,
  streak,
  extra,
  module,
  onAgain,
  onHome,
}: {
  readonly voor: ReadonlyMap<string, ItemState>;
  readonly na: ReadonlyMap<string, ItemState>;
  /** An item's name, or undefined for one this screen cannot name. */
  readonly naamVan: (id: string) => string | undefined;
  readonly goed: number;
  readonly beantwoord: number;
  /** How many the round was going to ask, or null for a round without a total. */
  readonly totaal: number | null;
  /** How many answers were wrong: none is "alles goed". */
  readonly fouten: number;
  readonly toetsstand: boolean;
  readonly reward: RoundOutcome | null;
  readonly streak: StreakChange | null;
  /** What only this module says: a diploma earned or missed. */
  readonly extra?: ReactNode;
  readonly module?: string | undefined;
  readonly onAgain: () => void;
  readonly onHome: () => void;
}) {
  const kader = useUitslagKader();
  const opnieuw = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    opnieuw.current?.focus();
  }, []);

  // What the round answered: the items whose box it wrote. An item's state is
  // replaced when it is answered and kept as it was otherwise.
  const gevraagd = [...na.keys()].filter((id) => na.get(id) !== voor.get(id));
  const uitslag = rondeUitslag(voor, na, gevraagd, new Date());

  const gestopt = totaal !== null && beantwoord < totaal;
  const meta = [
    totaal === null
      ? null
      : gestopt
        ? t('uitslag.metaGestopt', { gedaan: beantwoord, totaal })
        : t('uitslag.meta', { aantal: totaal }),
    t('result.score', { goed, totaal: beantwoord }),
  ]
    .filter(Boolean)
    .join(' · ');

  const rijen = [
    uitslag.nieuwOnthouden.length > 0 ? (
      <Rij
        key="nieuw"
        titel={t('uitslag.nieuw', { namen: namen(uitslag.nieuwOnthouden, naamVan) })}
        sub={t('uitslag.nieuwSub')}
        einde={<span className="ln-getal">{`+${uitslag.nieuwOnthouden.length}`}</span>}
      />
    ) : null,
    uitslag.opgefrist.length > 0 ? (
      <Rij
        key="opgefrist"
        titel={t('uitslag.opgefrist', { namen: namen(uitslag.opgefrist, naamVan) })}
        sub={
          uitslag.opgefrist.length === 1
            ? t('uitslag.opgefristSubEen')
            : t('uitslag.opgefristSubVeel')
        }
        einde={<span className="ln-getal">{uitslag.opgefrist.length}</span>}
      />
    ) : null,
    uitslag.wisselen.length > 0 ? (
      <Rij
        key="wisselen"
        titel={
          uitslag.wisselen.length === 1
            ? t('uitslag.wisselenEen', { namen: namen(uitslag.wisselen, naamVan) })
            : t('uitslag.wisselenVeel', { namen: namen(uitslag.wisselen, naamVan) })
        }
        sub={
          uitslag.wisselen.length === 1
            ? t('uitslag.wisselenSubEen')
            : t('uitslag.wisselenSubVeel')
        }
        einde={<span className="ln-getal">{uitslag.wisselen.length}</span>}
      />
    ) : null,
  ].filter(Boolean);

  const pagina = (
    <div className="ln-pagina" data-module={module}>
      <PaginaKop titel={t('result.changed')} meta={meta} soort="ding" />

      <div className="ln-uitslag">
        <div className="ln-uitslag-hoofd">
          {rijen.length > 0 ? <Lijst aria-label={t('result.changed')}>{rijen}</Lijst> : null}
          {fouten === 0 && beantwoord > 0 ? (
            <p className="ln-tekst">{t('result.allCorrect')}</p>
          ) : rijen.length === 0 ? (
            <p className="ln-tekst">{t('result.gainedNone')}</p>
          ) : null}
        </div>

        <div className="ln-uitslag-zij">
          {/* The mark, on the one round that has earned one: a toetsstand is the
              only round where nothing helped on the way (ADR-085). */}
          {toetsstand ? <RoundMark goed={goed} totaal={beantwoord} /> : null}
          {extra}
          <Beloning reward={reward} />
          <StreakLine streak={streak} />
          <RewardLine reward={reward} />
        </div>
      </div>

      <div className="ln-start">
        <button ref={opnieuw} type="button" className="ln-knop" onClick={onAgain}>
          <span className="ln-knop-label">{t('result.again')}</span>
        </button>
        <Button variant="tertiary" onClick={onHome}>
          {t('result.home')}
        </Button>
      </div>
    </div>
  );

  return <>{kader(pagina)}</>;
}

/** "Zeeland en Flevoland", or "Zeeland, Flevoland en vier andere". */
function namen(ids: readonly string[], naamVan: (id: string) => string | undefined): string {
  const bekend = ids.map(naamVan).filter((naam): naam is string => naam !== undefined);
  if (bekend.length === 0) return telwoord(ids.length);
  if (bekend.length === 1) return bekend[0] ?? '';
  if (ids.length === 2) return `${bekend[0] ?? ''} en ${bekend[1] ?? ''}`;
  return t('uitslag.andere', {
    namen: `${bekend[0] ?? ''}, ${bekend[1] ?? ''}`,
    aantal: telwoord(ids.length - 2),
  });
}

/**
 * What today did to the streak. Told after the round, never before it, and
 * silent when nothing happened — a second round on the same day changes
 * nothing.
 */
function StreakLine({ streak }: { readonly streak: StreakChange | null }) {
  if (streak === null || !streak.counted) return null;

  const days = streak.state.huidigeStreak;

  return (
    <p className="ln-tekst">
      {days === 1
        ? streak.broken
          ? t('result.streakGrewOne')
          : t('result.streakStarted')
        : t('result.streakGrew', { aantal: days })}
      {/* Said out loud rather than silently spent. */}
      {streak.rustdagenGebruikt > 0 && ` ${t('result.streakSaved')}`}
      {streak.rustdagVerdiend && ` ${t('result.restDayEarned')}`}
    </p>
  );
}

/**
 * A stamp the round earned, with its criterion beside it: a reward you cannot
 * explain is a riddle. Unknown ids are skipped — stored rows outlive the code
 * that wrote them.
 */
function RewardLine({ reward }: { readonly reward: RoundOutcome | null }) {
  if (reward === null || reward.stamps.length === 0) return null;
  const named = reward.stamps.filter((stamp) => stamp in STAMP_NAME);
  if (named.length === 0) return null;

  return (
    <>
      {named.map((stamp) => (
        <p key={stamp} className="ln-tekst">
          <span className="ln-titel">{t('result.newStamp', { naam: t(STAMP_NAME[stamp]) })}</span>
          <span className="ln-sub block">
            {t(`${STAMP_NAME[stamp]}.criterion` as TranslationKey)}
          </span>
        </p>
      ))}
    </>
  );
}
