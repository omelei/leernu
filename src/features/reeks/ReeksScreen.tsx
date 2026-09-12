import type { ReactNode } from 'react';
import { dagenInMaand, dayKey, kalenderWeken, laatsteZevenDagen, type Oefendag } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { dagKort, dagLang, ReeksGetal, WeekRij } from './WeekRij';
import { useReeks } from './useReeks';

/** How many weeks the calendar holds: a month, and the week it began in. */
const WEKEN = 5;

/** Monday first, as a Dutch school calendar is drawn. */
const WEEKDAGEN = [1, 2, 3, 4, 5, 6, 0];

/** The rules of the streak, in the order a child meets them. */
const REGELS = ['reeks.regel1', 'reeks.regel2', 'reeks.regel3', 'reeks.regel4'] as const;

/**
 * The streak's own page: the number, the days behind it, and how it works
 * (ADR-110). Reached from the streak block in the child's own column and by its
 * address, never from the tab bar — like the collection, it is the long view of
 * one block rather than a section of the product.
 *
 * **It opens on what the block says**, larger: days in a row and the last
 * seven. Under it, what a round today would do. Then the numbers a child or a
 * parent asks after, each one a count of something that happened: the longest
 * streak, the days practised, this month's, the rounds, the questions, and the
 * rest days in hand.
 *
 * **The calendar is the last five weeks**, Monday to Sunday, with a practised
 * day in ink. It is a table because it is one: a screen reader can walk it by
 * weekday and hear which dates had a round.
 *
 * **The rules are written out.** A streak a child cannot predict feels unfair
 * the first time it does something they did not expect, so the four rules
 * `streak.ts` works by are here in words: a day counts once, weekends and
 * holidays never break it, a missed school day spends a rest day, and a week
 * of practice earns one.
 *
 * What it does not do is compare. There is no other child here, no average and
 * no "beter dan vorige week" — the only streak on the page is this one.
 */
export function ReeksScreen({ aside }: { readonly aside: ReactNode }) {
  const reeks = useReeks();

  // Nothing until it is known. A page that says nought and then twelve has
  // told a child they had none.
  if (reeks === null) return null;

  const vandaagGeoefend = reeks.geoefend.has(dayKey(reeks.vandaag));
  const cijfers: readonly (readonly [TranslationKey, number])[] = [
    ['reeks.cijferLangste', reeks.langste],
    ['reeks.cijferDagen', reeks.geoefend.size],
    ['reeks.cijferMaand', dagenInMaand(reeks.geoefend, reeks.vandaag)],
    ['reeks.cijferRondes', reeks.rondes],
    ['reeks.cijferVragen', reeks.vragen],
    ['reeks.cijferRustdagen', reeks.rustdagen],
  ];

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-display tk-titel">{t('reeks.titel')}</h1>

        {/* Its own name rather than the block's: two landmarks with one label
            are two places called the same thing. */}
        <section className="tk-card flex flex-col gap-4" aria-label={t('reeks.nuTitel')}>
          <ReeksGetal dagen={reeks.dagen} />
          <WeekRij dagen={laatsteZevenDagen(reeks.geoefend, reeks.vandaag)} />
          <p className="text-tekst-secundair">{vandaagZin(reeks.dagen, vandaagGeoefend)}</p>
        </section>

        <section className="flex flex-col gap-3" aria-label={t('reeks.cijfersTitel')}>
          <h2 className="tk-label">{t('reeks.cijfersTitel')}</h2>
          <dl className="tk-cijfers">
            {cijfers.map(([label, waarde]) => (
              <div key={label} className="tk-cijfer">
                <dt className="text-bijschrift text-tekst-secundair">{t(label)}</dt>
                <dd className="tk-cijfer-getal">{waarde}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Kalender weken={kalenderWeken(reeks.geoefend, reeks.vandaag, WEKEN)} />

        <section className="flex flex-col gap-2" aria-label={t('reeks.regelsTitel')}>
          <h2 className="tk-label">{t('reeks.regelsTitel')}</h2>
          <ul className="tk-regels">
            {REGELS.map((regel) => (
              <li key={regel}>{t(regel)}</li>
            ))}
          </ul>
        </section>
      </div>

      {aside}
    </div>
  );
}

/**
 * What a round today would do. Said as what happens, never as what is lost: at
 * the weekend not practising costs nothing, and this line must not suggest
 * otherwise.
 */
function vandaagZin(dagen: number, geoefend: boolean): string {
  if (geoefend) return t('reeks.vandaagKlaar');
  if (dagen === 0) return t('reeks.vandaagBegin');
  return t('reeks.vandaagErbij', { aantal: dagen + 1 });
}

/**
 * The last five weeks as a table: a row a week, a column a weekday, and the
 * date in every cell. A practised day is ink with its date in paper, today has
 * a ring, and the days still to come this week are only a hairline.
 */
function Kalender({ weken }: { readonly weken: readonly (readonly Oefendag[])[] }) {
  return (
    <section className="flex flex-col gap-3" aria-label={t('reeks.kalenderTitel')}>
      <h2 className="tk-label">{t('reeks.kalenderTitel')}</h2>
      <table className="tk-kalender">
        <thead>
          <tr>
            {WEEKDAGEN.map((weekdag) => (
              <th key={weekdag} scope="col" abbr={dagLang(weekdag)}>
                {dagKort(weekdag)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weken.map((week) => (
            <tr key={week[0]?.dag}>
              {week.map((dag) => (
                <td key={dag.dag}>
                  <span
                    className="tk-kal-dag"
                    data-geoefend={dag.geoefend ? 'ja' : undefined}
                    data-vandaag={dag.vandaag ? 'ja' : undefined}
                    data-later={dag.later ? 'ja' : undefined}
                  >
                    {dag.dagVanDeMaand}
                  </span>
                  <KalenderZin dag={dag} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** What the cell's colour says, in words. Nothing for an ordinary day. */
function KalenderZin({ dag }: { readonly dag: Oefendag }) {
  const zin = dag.vandaag
    ? dag.geoefend
      ? t('reeks.kalVandaagGeoefend')
      : t('reeks.kalVandaag')
    : dag.geoefend
      ? t('reeks.kalGeoefend')
      : null;

  return zin === null ? null : <span className="tk-sr-only">{zin}</span>;
}
