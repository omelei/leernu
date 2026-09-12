import { VinkjeIcon } from '@/components/Icon';
import {
  dagSleutel,
  isoWeek,
  plusDagen,
  vakantieAan,
  weekdag,
  type StreakState,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { telwoord } from './dagen';

/**
 * Jouw week (S2, under the fold): Monday to Sunday of this week, a tick on
 * every day a round was finished, and what the freezer holds.
 *
 * A tick and not a dot: the dot shows retention and nothing else, and a
 * diamond counts the questions of a round. A day practised is a thing done,
 * which is what a tick says everywhere else in the product.
 *
 * The freezer is the handoff's word for a rest day: one earned per week of
 * practice, two at most, spent on a school day missed (streak.ts). Holiday mode
 * says itself here too, because a child who switched it on should see that it
 * is on.
 */
const DAGNAAM: readonly TranslationKey[] = [
  'week.zo',
  'week.ma',
  'week.di',
  'week.wo',
  'week.do',
  'week.vr',
  'week.za',
];

export function JouwWeek({
  geoefend,
  streak,
  nu = new Date(),
}: {
  /** Day keys (Amsterdam) on which a round was finished. */
  readonly geoefend: ReadonlySet<string>;
  readonly streak: StreakState | null;
  readonly nu?: Date;
}) {
  const vandaag = dagSleutel(nu);
  const week = isoWeek(vandaag);
  // Back from today to this week's Monday, then seven days on.
  const maandag = plusDagen(vandaag, -((weekdag(vandaag) + 6) % 7));
  const dagen = Array.from({ length: 7 }, (_, i) => plusDagen(maandag, i));

  const vriezers = streak?.rustdagen ?? 0;

  return (
    <div className="ln-kaart flex flex-col gap-4" data-week={week}>
      <ol className="ln-week">
        {dagen.map((dag) => {
          const gedaan = geoefend.has(dag);
          const naam = t(DAGNAAM[weekdag(dag)] ?? 'week.ma');
          return (
            <li
              key={dag}
              className="ln-week-dag"
              aria-current={dag === vandaag ? 'date' : undefined}
            >
              <span className="ln-sub" aria-hidden="true">
                {naam}
              </span>
              <span className="ln-week-teken" aria-hidden="true">
                {gedaan ? <VinkjeIcon size={20} /> : null}
              </span>
              <span className="ln-sr-only">
                {t(gedaan ? 'week.geoefend' : 'week.nietGeoefend', { dag: naam })}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="ln-sub">
        {vriezers === 0
          ? t('week.geenVriezer')
          : vriezers === 1
            ? t('week.vriezer')
            : t('week.vriezers', { aantal: telwoord(vriezers) })}
      </p>
      {streak && vakantieAan(streak) ? <p className="ln-sub">{t('week.vakantie')}</p> : null}
    </div>
  );
}
