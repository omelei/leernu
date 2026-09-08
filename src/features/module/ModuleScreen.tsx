import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { countMastered, type ItemState, type ModeId } from '@/game-core';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { usePreferences } from '@/features/player/settings';
import { useTestPlan } from '@/features/home/testPlan';
import { naamVan, onderdelenVan, opDeRol, type Onderdeel } from './onderdelen';
import { formsFor, minutesFor, offeredForms, questionCount, startLabel } from './forms';

/**
 * A module's own page — leer.nu/topografie, leer.nu/rekenen — and the one flow
 * on it.
 *
 * K2 draws this as a column under "Wat wil je oefenen?": first **waarover**,
 * then **hoe**, then a start button carrying the two answers in words. This is
 * that column, and the same one for every module. Topography and the tables had
 * a screen each before, alike in shape and separately maintained, which is two
 * places to fix a chooser and two chances for them to drift apart. What differs
 * between two modules is the list of sets and the list of ways — data — and
 * neither is a reason for a second screen.
 *
 * Three things it does that the two screens it replaces did not.
 *
 * **Every way of practising is in step 2, with a face.** Six at most; see
 * `forms.ts` for why the clock and the lives are in the list now rather than
 * beside it.
 *
 * **A set has an address.** leer.nu/topografie/provincies is a place a parent
 * can send a child, and the page opens on it.
 *
 * **The start button says how long it takes.** "Ongeveer 4 minuten" is the
 * design's own line and the one thing on this page aimed at the adult in the
 * room as much as at the child.
 *
 * The frame around it is K1's: the rail on the left, the app bar above, and the
 * child's own column on the right. A module page is not a different application
 * and should not look like one.
 */
export function ModuleScreen({
  module,
  setId,
  onSet,
  onStart,
  aside,
}: {
  readonly module: Module;
  /** Which set the address names, or null for the module's own way in. */
  readonly setId: string | null;
  readonly onSet: (setId: string) => void;
  readonly onStart: (deel: Onderdeel, mode: ModeId) => void;
  /** The child's own column, the same one the front door carries. */
  readonly aside: ReactNode;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [formId, setFormId] = useState<ModeId | null>(null);
  const prefs = usePreferences();
  const plan = useTestPlan();

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const sets = onderdelenVan(module.id);
  // An address that names a set nobody has heard of opens the module rather
  // than an error: the child asked for topography and got topography.
  const chosen = sets.find((deel) => deel.setId === setId) ?? sets[0] ?? null;

  const forms = offeredForms(formsFor(module.id), prefs.timer);
  const form = forms.find((candidate) => candidate.id === formId) ?? forms[0] ?? null;

  const ModuleIcon = MODULE_ICON[module.id];

  // Twelve tables are a grid and five named sets are a list. The same card
  // either way — what changes is how many fit on a line, and twelve rows of
  // one is a page a child scrolls past rather than reads.
  const dense = sets.length > 6;

  const setSize = chosen?.items.length ?? 0;
  const vragen = form === null ? null : questionCount(form, setSize);
  const minuten = form === null ? null : minutesFor(form, vragen);

  return (
    <div className="tk-page" data-module={module.id}>
      <div className="tk-page-main">
        <div className="flex flex-col gap-2">
          {/* Which module this is. The rail says it too, and the rail is absent
              on a phone — where this line is the only thing that does. */}
          <p className="tk-eyebrow">
            <ModuleIcon size={20} />
            {t(module.name)}
          </p>

          <h1 className="tk-display text-h1 font-semibold">{t('choose.title')}</h1>

          {/* The reason this week has a reason, but only on the page it is
              about. K2 stamps "toets" on the set; we know the subject and not
              the set, so it is stamped on the module. */}
          {plan.subject === module.id ? (
            <p className="flex flex-wrap items-center gap-3">
              <span className="tk-badge">{t('home.testLabel')}</span>
              <span className="text-ink-2">{t('choose.testSubject')}</span>
            </p>
          ) : null}

          <Rol sets={sets} chosen={chosen} known={known} now={now} onSet={onSet} />
        </div>

        <section className="flex flex-col gap-3" aria-label={t('choose.stepWhat')}>
          <h2 className="tk-label">{t('choose.stepWhat')}</h2>

          <div className={dense ? 'tk-sets' : 'flex flex-col gap-3'}>
            {sets.map((deel) => {
              const ids = deel.items.map((item) => item.id);
              const mastered = countMastered(known, ids);
              const due = opDeRol(deel, known, now);

              return (
                <button
                  key={deel.setId}
                  type="button"
                  className="tk-module-card w-full"
                  aria-pressed={deel.setId === chosen?.setId}
                  onClick={() => onSet(deel.setId)}
                >
                  <Dot size={24} fill={ids.length === 0 ? 0 : mastered / ids.length} />
                  {/* One line where it fits, which is what K2 draws: the name
                      and how it is going share a baseline. Stacked, five sets
                      filled the fold on a laptop and step 2 — the part with
                      the six ways on it — was never on screen without
                      scrolling, on the page whose whole argument is that the
                      two steps are one flow. It wraps back to two lines on a
                      phone, where the name alone is most of the width. */}
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold">{naamVan(deel)}</span>
                    <span className="text-ink-2">
                      {mastered === 0 && due === 0
                        ? t('home.setNew')
                        : t('home.setMastered', { goed: mastered, totaal: ids.length })}
                      {due > 0 ? ` · ${t('choose.dueToday', { aantal: due })}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-label={t('choose.stepHow')}>
          {/* The order is the argument, so it is written down rather than left
              to be inferred from the sequence. */}
          <h2 className="tk-label">{t('choose.stepHow')}</h2>

          <div className="tk-forms">
            {forms.map((candidate) => {
              const FormIcon = candidate.icon;

              return (
                <button
                  key={candidate.id}
                  type="button"
                  className="tk-form"
                  aria-pressed={candidate.id === form?.id}
                  onClick={() => setFormId(candidate.id)}
                >
                  <FormIcon size={24} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t(candidate.name)}</span>
                    <span className="block text-ink-2">{t(candidate.reason)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Full width on a phone, a button with the estimate beside it
            everywhere else — see .tk-choose-start. The combination is spelled
            out on it, which is what K2 asks for: a child reads what the round
            is at the moment they start it. */}
        {chosen && form ? (
          <div className="tk-choose-start flex flex-wrap items-center gap-4">
            <Button onClick={() => onStart(chosen, form.id)}>
              {startLabel(form, naamVan(chosen), setSize)}
            </Button>
            {minuten === null ? null : (
              <span className="text-ink-2">
                {minuten === 1 ? t('choose.minuteOne') : t('choose.minutes', { aantal: minuten })}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {aside}
    </div>
  );
}

/**
 * What the scheduler has put on today's list, when it is waiting somewhere
 * other than where the child is standing.
 *
 * The set cards each say "3 vandaag op de rol" already. What they cannot say is
 * which of twelve to look at, and on a page of twelve tables the one that needs
 * doing is as likely to be row nine as row one. So this names it and selects
 * it, and then gets out of the way — it does not start a round, because
 * choosing how is still the child's to make.
 *
 * A line under the heading and not a card of its own, and above the two steps
 * rather than inside them: the flow begins at "1 · Waarover", and a block that
 * pushed that down the page would be answering a question before it was asked.
 *
 * Absent when the busiest set is the one already open. Telling a child to go
 * where they are is furniture.
 */
function Rol({
  sets,
  chosen,
  known,
  now,
  onSet,
}: {
  readonly sets: readonly Onderdeel[];
  readonly chosen: Onderdeel | null;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly onSet: (setId: string) => void;
}) {
  const drukste = sets.reduce<{ deel: Onderdeel; due: number } | null>((best, deel) => {
    const due = opDeRol(deel, known, now);
    return best === null || due > best.due ? { deel, due } : best;
  }, null);

  if (drukste === null || drukste.due === 0) return null;
  if (drukste.deel.setId === chosen?.setId) return null;

  const naam = naamVan(drukste.deel);

  return (
    <p className="flex flex-wrap items-center gap-3 text-ink-2">
      {t('choose.dueBody', { aantal: drukste.due, set: naam })}
      <Button variant="tertiary" onClick={() => onSet(drukste.deel.setId)}>
        {t('choose.dueAction', { set: naam })}
      </Button>
    </p>
  );
}
