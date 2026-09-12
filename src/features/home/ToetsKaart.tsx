import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Punt } from '@/components/ds';
import { PlusIcon } from '@/components/Icon';
import { aantalOnthouden, dayKey, retentieHorizon, type ItemState } from '@/game-core';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { MODULES } from '@/features/shell/modules';
import { t } from '@/i18n';
import { datumLang, nogTot } from './dagen';
import { TEST_SUBJECTS, useTestPlan, type Toets } from './testPlan';

/**
 * The test card (S2): when the soonest test is, what it is about, and how much
 * of it the child will still remember — now, in a week and in three weeks —
 * if they do nothing. That horizon is three dots, because what it shows is
 * retention and the dot is the only thing that may show it (README).
 *
 * One target, as S2 asks: the whole card is a button, and pressing it opens
 * the list of tests under it — every test the child told us about, a way to
 * add one and a way to take one off (ADR-077).
 *
 * With no test there is nothing to count down to, and the card says what a
 * date would give: a dashed card, one sentence, and "Datum kiezen". S2's own
 * sentence promised that the product would spread the work over the days
 * before; it does not, so this one says what the card will show instead.
 */
export function ToetsKaart({
  states,
  setVoor,
  nu = new Date(),
}: {
  readonly states: ReadonlyMap<string, ItemState>;
  /** The set a test in this module is about: the one last practised in it. */
  readonly setVoor: (module: Toets['subject']) => Onderdeel | null;
  readonly nu?: Date;
}) {
  const plan = useTestPlan(nu);
  const [open, setOpen] = useState(false);
  const toets = plan.toetsen[0] ?? null;

  const lijst = open ? (
    <ToetsLijst
      toetsen={plan.toetsen}
      nu={nu}
      onRemove={plan.remove}
      onAdd={(date, subject) => plan.add(date, subject)}
    />
  ) : null;

  if (toets === null) {
    return (
      <section aria-label={t('home.testTitle')} className="flex flex-col gap-4">
        <div className="ln-kaart ln-toetskaart-leeg">
          <span className="ln-held-cirkel ln-toetskaart-cirkel" aria-hidden="true" />
          <p className="ln-titel">{t('vandaag.geenToets')}</p>
          <p className="ln-tekst">{t('vandaag.geenToetsUitleg')}</p>
          <Button variant="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>
            {t('vandaag.datumKiezen')}
          </Button>
        </div>
        {lijst}
      </section>
    );
  }

  const module = MODULES.find((kandidaat) => kandidaat.id === toets.subject) ?? null;
  const deel = setVoor(toets.subject);
  const ids = deel ? deel.items.map((item) => item.id) : [];
  const horizon = retentieHorizon(states, ids, nu);
  const onthouden = aantalOnthouden(states, ids, nu);

  const titel = module
    ? t('vandaag.toets', {
        vak: t(module.naam).toLocaleLowerCase('nl-NL'),
        datum: datumLang(toets.date),
      })
    : t('vandaag.toetsZonderVak', { datum: datumLang(toets.date) });
  const sub = deel
    ? t('vandaag.toetsSub', { set: naamVan(deel), nog: nogTot(toets.date, nu) })
    : nogTot(toets.date, nu);

  return (
    <section aria-label={t('home.testTitle')} data-module={module?.id} className="flex flex-col gap-4">
      <button
        type="button"
        className="ln-kaart ln-toetskaart"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="ln-toetskaart-tekst">
          <span className="ln-titel">{titel}</span>
          <span className="ln-sub">{sub}</span>
        </span>

        {ids.length > 0 && horizon.nu !== null ? (
          <span className="ln-horizon">
            {(
              [
                ['nu', horizon.nu, t('vandaag.horizonNu')],
                ['week', horizon.week, t('vandaag.horizonWeek')],
                ['drie', horizon.drieWeken, t('vandaag.horizonDrieWeken')],
              ] as const
            ).map(([sleutel, procent, woord]) => (
              <span key={sleutel} className="ln-horizon-stap">
                <Punt
                  procent={procent}
                  maat={28}
                  label={t('vandaag.horizonLabel', { wanneer: woord, procent: procent ?? 0 })}
                />
                <span className="ln-sub" aria-hidden="true">
                  {woord}
                </span>
              </span>
            ))}
          </span>
        ) : null}

        {ids.length > 0 ? (
          <span className="ln-toetskaart-telling">
            <span className="ln-getal">{`${onthouden} / ${ids.length}`}</span>
            <span className="ln-sub">{t('vandaag.onthouden')}</span>
          </span>
        ) : null}
        <span className="ln-sr-only">{t('home.testsChange')}</span>
      </button>
      {lijst}
    </section>
  );
}

/** Every test still to come, soonest first, and a form to add one. */
function ToetsLijst({
  toetsen,
  nu,
  onRemove,
  onAdd,
}: {
  readonly toetsen: readonly Toets[];
  readonly nu: Date;
  readonly onRemove: (id: string) => void;
  readonly onAdd: (date: string, subject: string) => void;
}) {
  const [adding, setAdding] = useState(toetsen.length === 0);
  const [date, setDate] = useState(dayKey(nu));
  const [subject, setSubject] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (date === '') return;
    onAdd(date, subject);
    setAdding(false);
  }

  return (
    <div className="ln-kaart flex flex-col gap-4">
      {toetsen.length > 0 ? (
        <ul className="ln-lijst">
          {toetsen.map((toets) => {
            const vak = TEST_SUBJECTS.find((module) => module.id === toets.subject) ?? null;
            const wanneer = datumLang(toets.date);
            return (
              <li key={toets.id} className="ln-rij">
                <span className="ln-rij-tekst">
                  <span className="ln-titel">{vak ? t(vak.naam) : t('home.testSubjectNone')}</span>
                  <span className="ln-sub">{wanneer}</span>
                </span>
                <Button
                  variant="tertiary"
                  aria-label={t('home.testRemoveOne', { wanneer })}
                  onClick={() => onRemove(toets.id)}
                >
                  {t('home.testRemove')}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div>
        <Button variant="secondary" aria-expanded={adding} onClick={() => setAdding(!adding)}>
          <PlusIcon size={20} />
          {t('home.testAdd')}
        </Button>
      </div>

      {adding ? (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <label className="ln-veld-groep">
            <span className="ln-label">{t('home.testPick')}</span>
            <input
              type="date"
              className="ln-veld"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="ln-veld-groep">
            <span className="ln-label">{t('home.testSubjectPick')}</span>
            <select
              className="ln-veld"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              <option value="">{t('home.testSubjectNone')}</option>
              {TEST_SUBJECTS.map((module) => (
                <option key={module.id} value={module.id}>
                  {t(module.naam)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Button type="submit">{t('home.testSave')}</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
