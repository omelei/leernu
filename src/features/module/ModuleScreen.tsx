import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { GoIcon } from '@/components/Icon';
import { countMastered, type ItemState, type ModeId } from '@/game-core';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { usePreferences } from '@/features/player/settings';
import { useTestPlan } from '@/features/home/testPlan';
import { Tafeldiplomas } from './Tafeldiplomas';
import {
  itemsVan,
  naamVan,
  onderwerpenVan,
  onderwerpVan,
  opDeRol,
  type Onderdeel,
  type Onderwerp,
} from './onderdelen';
import { formsFor, minutesFor, offeredForms, questionCount, startLabel } from './forms';

/**
 * A module's own page — leer.nu/topografie, leer.nu/rekenen — and the one flow
 * on it.
 *
 * K2 draws this as a column under "Wat wil je oefenen?": first **what about**,
 * then **how**, then a start button carrying the two answers in words. This is
 * that column, and the same one for every module. Topography and the tables had
 * a screen each before, alike in shape and separately maintained, which is two
 * places to fix a chooser and two chances for them to drift apart. What differs
 * between two modules is the list of subjects and the list of ways — data — and
 * neither is a reason for a second screen.
 *
 * Four things it does that the two screens it replaces did not.
 *
 * **Step 1 offers subjects, not sets.** Twelve tables were twelve cards, and
 * with division, plus and minus beside them rekenen would have had thirty-six.
 * So a subject is a card and the sets under it are a row of chips that appears
 * once the subject is chosen — one decision, then a smaller one, instead of
 * thirty-six of equal weight (ADR-062). Six subjects at most in a section, the
 * same ceiling step 2 has had since ADR-061.
 *
 * **Every way of practising is in step 2, with a face.** Six at most; see
 * `forms.ts` for why the clock and the lives are in the list now rather than
 * beside it, and why a diploma is offered on a table and not on a mix.
 *
 * **A set has an address.** leer.nu/topografie/provincies is a place a parent
 * can send a child, and the page opens on it — on the chip and on the subject
 * card above it.
 *
 * **The start button is a start button.** It used to be the sentence itself —
 * "Provincies aanwijzen · 15 vragen" — which is what a child needs to read and
 * not what a child recognises as the way on. The sentence stayed and moved
 * beside it; the button says Start, has an arrow on it, and sits at the end of
 * the line where the eye finishes rather than at the beginning where it started
 * (ADR-066). What a screen reader hears is still the whole thing.
 *
 * The frame around it is K1's: the rail on the left, the app bar above, and the
 * child's own column on the right. A module page is not a different application
 * and should not look like one.
 */
export function ModuleScreen({
  module,
  naam,
  setId,
  onSet,
  onStart,
  aside,
}: {
  readonly module: Module;
  /** Whose page this is. The heading asks them by name. */
  readonly naam: string;
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

  const onderwerpen = onderwerpenVan(module.id);
  const alleSets = onderwerpen.flatMap((vak) => vak.sets);

  // An address that names a set nobody has heard of opens the module rather
  // than an error: the child asked for topography and got topography.
  const chosen = alleSets.find((deel) => deel.setId === setId) ?? alleSets[0] ?? null;
  const onderwerp = chosen ? onderwerpVan(onderwerpen, chosen.setId) : null;

  const forms = offeredForms(formsFor(module.id), prefs.timer, chosen?.setId ?? null);
  const form = forms.find((candidate) => candidate.id === formId) ?? forms[0] ?? null;

  const ModuleIcon = MODULE_ICON[module.id];

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

          {/* By name, the way the front door greets them. A chooser that asks
              "wat wil je oefenen?" of nobody in particular is a form; asked of
              Fem it is a question, and she is the one answering it. */}
          <h1 className="tk-display text-h1 font-semibold">{t('choose.title', { naam })}</h1>

          {/* The reason this week has a reason, but only on the page it is
              about. K2 stamps "toets" on the set; we know the subject and not
              the set, so it is stamped on the module. */}
          {plan.subject === module.id ? (
            <p className="flex flex-wrap items-center gap-3">
              <span className="tk-badge">{t('home.testLabel')}</span>
              <span className="text-ink-2">{t('choose.testSubject')}</span>
            </p>
          ) : null}

          <Rol onderwerpen={onderwerpen} chosen={chosen} known={known} now={now} onSet={onSet} />
        </div>

        <section className="flex flex-col gap-3" aria-label={t('choose.stepWhat')}>
          <h2 className="tk-label">{t('choose.stepWhat')}</h2>

          <div className="tk-sets">
            {onderwerpen.map((vak) => {
              const ids = itemsVan(vak);
              const mastered = countMastered(known, ids);
              const due = vak.sets
                .filter((deel) => !deel.mix || vak.sets.length === 1)
                .reduce((most, deel) => Math.max(most, opDeRol(deel, known, now)), 0);
              const open = vak.id === onderwerp?.id;

              return (
                <button
                  key={vak.id}
                  type="button"
                  className="tk-module-card w-full"
                  aria-pressed={open}
                  // The subject's first set, and only when the subject is not
                  // already the open one: a child who has chosen the table of
                  // seven and then presses "Tafels" again should not be sent
                  // back to the table of one for pressing the heading.
                  onClick={() => {
                    if (!open) onSet(vak.sets[0]?.setId ?? '');
                  }}
                >
                  <Dot size={24} fill={ids.length === 0 ? 0 : mastered / ids.length} />
                  <span className="flex min-w-0 flex-col">
                    {/* The name and how it is going share a baseline, which is
                        what K2 draws. They wrap to two lines on a phone, where
                        the name alone is most of the width. */}
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
                      <span className="font-semibold">{t(vak.naam)}</span>
                      <span className="text-ink-2">
                        {mastered === 0 && due === 0
                          ? t('home.setNew')
                          : t('home.setMastered', { goed: mastered, totaal: ids.length })}
                        {due > 0 ? ` · ${t('choose.dueToday', { aantal: due })}` : ''}
                      </span>
                    </span>

                    {/* What is in it, where the name does not say. "Deelsommen"
                        is a word a child may not have met; "de tafels
                        andersom: 56 : 7" is the same thing with an example on
                        it, and an example is what makes a subject choosable. */}
                    {vak.uitleg ? <span className="text-ink-2">{t(vak.uitleg)}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The second, smaller decision, and only where there is one. Chips
              rather than a dropdown: a menu hides eleven of twelve tables
              behind a control a child has to open, and the whole point of this
              block is that the one they want is already on the screen. */}
          {onderwerp && onderwerp.keuze && onderwerp.sets.length > 1 ? (
            <div className="tk-variant">
              <p className="tk-label">{t(onderwerp.keuze)}</p>
              <div className="tk-variant-row">
                {onderwerp.sets.map((deel) => {
                  const ids = deel.items.map((item) => item.id);
                  const mastered = countMastered(known, ids);

                  return (
                    <button
                      key={deel.setId}
                      type="button"
                      className="tk-variant-chip"
                      // The full name, because "7" is not a sentence and this
                      // is the one control on the page whose visible label is
                      // deliberately shorter than what it means.
                      aria-label={naamVan(deel)}
                      aria-pressed={deel.setId === chosen?.setId}
                      onClick={() => onSet(deel.setId)}
                    >
                      <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
                      <Dot
                        size={10}
                        fill={ids.length === 0 ? 0 : mastered / ids.length}
                        className="tk-variant-dot"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
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

        {/* What was chosen, in words, and then the way on. Full width and
            stacked on a phone; one line ending in the button everywhere else.
            See .tk-choose-start. */}
        {chosen && form ? (
          <div className="tk-choose-start">
            <p className="tk-choose-said">
              <span className="font-semibold">{startLabel(form, naamVan(chosen), setSize)}</span>
              {minuten === null ? null : (
                <span className="block text-ink-2">
                  {minuten === 1 ? t('choose.minuteOne') : t('choose.minutes', { aantal: minuten })}
                </span>
              )}
            </p>

            <Button
              className="tk-button-go"
              aria-label={t('choose.goLabel', { wat: startLabel(form, naamVan(chosen), setSize) })}
              onClick={() => onStart(chosen, form.id)}
            >
              {t('choose.go')}
              <GoIcon size={24} />
            </Button>
          </div>
        ) : null}

        {/* Twelve diplomas, on the page the tables live on and nowhere else.
            Absent for every other module, because it is not a general idea
            about progress — it is the tafeltoets, and it is only that.

            Pressing a gap answers both steps at once: that table, and the
            diploma. A child who presses "9" on a wall of diplomas has said
            what they want to do, and making them go back up the page to say it
            again in two more presses is the product not listening. */}
        {module.id === 'tafels' ? (
          <Tafeldiplomas
            onKies={(gekozen) => {
              onSet(gekozen);
              setFormId('tafeldiploma');
            }}
          />
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
 * The subject cards each say "3 vandaag op de rol" already. What they cannot
 * say is which of twelve tables to look at, and on a page where a subject holds
 * thirteen sets the one that needs doing is as likely to be the ninth chip as
 * the first. So this names it and selects it, and then gets out of the way — it
 * does not start a round, because choosing how is still the child's to make.
 *
 * A line under the heading and not a card of its own, and above the two steps
 * rather than inside them: the flow begins at step 1, and a block that pushed
 * that down the page would be answering a question before it was asked.
 *
 * Absent when the busiest set is the one already open. Telling a child to go
 * where they are is furniture.
 */
function Rol({
  onderwerpen,
  chosen,
  known,
  now,
  onSet,
}: {
  readonly onderwerpen: readonly Onderwerp[];
  readonly chosen: Onderdeel | null;
  readonly known: ReadonlyMap<string, ItemState>;
  readonly now: Date;
  readonly onSet: (setId: string) => void;
}) {
  // Over the sets rather than the subjects, and never over a mix: a mix holds
  // every item there is, so it is due more often than anything else by
  // definition and would be the answer every time.
  const sets = onderwerpen.flatMap((vak) => vak.sets).filter((deel) => !deel.mix);

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
