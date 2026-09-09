import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { GoIcon, PaperIcon } from '@/components/Icon';
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
import { eersteRegio, regiosVan } from './regios';
import { onderwerpIcon, regioIcon } from './tegelIcons';
import {
  formsFor,
  minutesFor,
  offeredForms,
  questionChoices,
  questionCount,
  startLabel,
  teDrukOmAanTeWijzen,
} from './forms';
import { useSmallScreen } from '@/features/shell/useSmallScreen';

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
 * Five things it does that the two screens it replaces did not.
 *
 * **Every question on it is a row of tiles, and a tile is a mark and a name.**
 * An icon and a word or two, sized to what it says, wrapping onto the next
 * line when the row runs out — the shape the region row has always had, now
 * the shape of all of them (ADR-089). Nothing carries a second line: the
 * sublines are gone, the marks are unique, and the answer already given wears
 * the module's own colour, which is the one place on this page an accent
 * earns its keep.
 *
 * **Topography asks where before it asks what.** Wereld, the six werelddelen,
 * Nederland, and then one word per subject underneath — Provincies, Steden,
 * Wateren, Waddeneilanden, Topo-mix. Five cards that each ended in "van
 * Nederland" said the same thing five times and left no room for the countries
 * of Europe to arrive beside them; the region row says it once and the tiles
 * get their word back (ADR-083). Rekenen has no region and draws no row, which
 * is why the steps are numbered by the page rather than written into the copy.
 *
 * **Step 1 offers subjects, not sets, and which one is a step of its own.**
 * Twelve tables were twelve cards, and with division, plus and minus beside
 * them rekenen would have had thirty-six. So a subject is a tile and the sets
 * under it are a row of chips — one decision, then a smaller one, instead of
 * thirty-six of equal weight (ADR-062). "Welke tafel?" used to be a mono
 * caption under the subjects, which is the size a label gets; on rekenen it is
 * the press that decides what the round contains, so it is numbered like the
 * questions either side of it.
 *
 * **Every way of practising is a tile too.** Six at most; see `forms.ts` for
 * why the clock and the lives are in the list now rather than beside it, and
 * why a diploma is offered on a table and not on a mix.
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
  readonly onStart: (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null,
    toetsstand: boolean,
  ) => void;
  /** The child's own column, the same one the front door carries. */
  readonly aside: ReactNode;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [formId, setFormId] = useState<ModeId | null>(null);
  /** Where on the map, for the module that has a where. Null follows the set. */
  const [regio, setRegio] = useState<string | null>(null);
  /** How long the child wants the round, or null for the round's own length. */
  const [aantal, setAantal] = useState<number | null>(null);
  /** Whether the round should keep its answers until the end (ADR-085). */
  const [toetsstand, setToetsstand] = useState(false);
  const prefs = usePreferences();
  const plan = useTestPlan();
  const kleinScherm = useSmallScreen();

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const known = states ?? new Map<string, ItemState>();
  const now = new Date();

  const alleOnderwerpen = onderwerpenVan(module.id, known);
  const alleSets = alleOnderwerpen.flatMap((vak) => vak.sets);

  // An address that names a set nobody has heard of opens the module rather
  // than an error: the child asked for topography and got topography.
  const chosen = alleSets.find((deel) => deel.setId === setId) ?? alleSets[0] ?? null;
  const onderwerp = chosen ? onderwerpVan(alleOnderwerpen, chosen.setId) : null;

  // The region follows the open set unless the child has said otherwise, so
  // leer.nu/topografie/provincies opens on Nederland without the address
  // having to carry the word.
  const regios = regiosVan(module.id);
  const hier = regio ?? onderwerp?.regio ?? eersteRegio(regios);
  const onderwerpen =
    regios.length === 0 ? alleOnderwerpen : alleOnderwerpen.filter((vak) => vak.regio === hier);

  /** How many steps this page has, so the numbers are the page's own. */
  const heeftRegio = regios.length >= 2;
  const heeftKeuze = onderwerp?.keuze != null && onderwerp.sets.length > 1;
  const regioStap = heeftRegio ? 1 : 0;
  const watStap = regioStap + 1;
  const keuzeStap = heeftKeuze ? watStap + 1 : 0;
  const stap = {
    regio: regioStap,
    wat: watStap,
    keuze: keuzeStap,
    hoe: (keuzeStap === 0 ? watStap : keuzeStap) + 1,
  };

  // A map of a hundred and sixty-seven countries is not something a child can
  // point at, and on a phone neither is a map of forty-six. Where that is true
  // the way in becomes multiple choice — the map lights a country up and the
  // child answers in words, which is also what a Dutch topografietoets asks
  // (ADR-087). Pointing is still on the page, at the end of the row.
  const krap = teDrukOmAanTeWijzen(chosen?.setId ?? null, chosen?.items.length ?? 0, kleinScherm);
  const forms = offeredForms(formsFor(module.id), prefs.timer, chosen?.setId ?? null, krap);
  const form = forms.find((candidate) => candidate.id === formId) ?? forms[0] ?? null;

  const ModuleIcon = MODULE_ICON[module.id];

  const setSize = chosen?.items.length ?? 0;
  const lengtes = form === null ? [] : questionChoices(form, setSize);
  // A length that no longer fits — twenty-five questions of the table of seven,
  // after the child moved from the Rekenmix to a table — falls back to the
  // round's own rather than quietly asking for something impossible.
  const gekozen = aantal !== null && lengtes.includes(aantal) ? aantal : null;
  const vragen = form === null ? null : questionCount(form, setSize, gekozen);
  const minuten = form === null ? null : minutesFor(form, vragen);
  // Not offered where there is nothing to withhold. Exploring asks no
  // questions, and a tafeldiploma already stops at the first mistake — hiding
  // the answers there would hide nothing and take away the one thing that
  // makes the wall of diplomas legible.
  const toetsbaar = form !== null && form.rule !== null && form.id !== 'tafeldiploma';
  /** Everything this module holds, under one name. What a test asks about. */
  const mix = mixVan(alleOnderwerpen);
  const zin =
    chosen === null || form === null
      ? ''
      : toetsstand && toetsbaar
        ? t('choose.startTest', { wat: startLabel(form, naamVan(chosen), setSize, gekozen) })
        : startLabel(form, naamVan(chosen), setSize, gekozen);

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
              {/* One press that answers this page the way the test will ask it:
                  everything the subject holds, and no answers until the end.
                  It chooses rather than starts — the same thing the line about
                  today's list does, and for the same reason. How is still the
                  child's to say, and the start button still says what it is
                  about to do (ADR-085). */}
              {mix === null ? null : (
                <Button
                  variant="tertiary"
                  onClick={() => {
                    onSet(mix);
                    setToetsstand(true);
                  }}
                >
                  {t('choose.likeTheTest')}
                </Button>
              )}
            </p>
          ) : null}

          <Rol onderwerpen={onderwerpen} chosen={chosen} known={known} now={now} onSet={onSet} />
        </div>

        {/* Where on the map, and only where there is more than one answer. A
            row of one region is a label a child cannot press, which is the
            same rule the tab bar and the rail already follow. */}
        {regios.length >= 2 ? (
          <section className="flex flex-col gap-3" aria-label={t('regio.title')}>
            <Stap nummer={stap.regio} label={t('regio.title')} />

            <div className="tk-regios">
              {regios.map((kandidaat) => {
                const RegioIcon = regioIcon(kandidaat.id);

                return (
                  <button
                    key={kandidaat.id}
                    type="button"
                    className="tk-regio"
                    aria-pressed={kandidaat.built ? kandidaat.id === hier : undefined}
                    disabled={!kandidaat.built}
                    data-soon={kandidaat.built ? undefined : 'ja'}
                    onClick={() => setRegio(kandidaat.id)}
                  >
                    <RegioIcon size={20} />
                    {t(kandidaat.naam)}
                    {/* A region the plan has and the product does not says so on
                      its own face rather than opening onto nothing (ADR-051). */}
                    {kandidaat.built ? null : <span className="tk-label">{t('regio.soon')}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-3" aria-label={t('choose.stepWhat')}>
          <Stap nummer={stap.wat} label={t('choose.stepWhat')} />

          <div className="tk-sets">
            {onderwerpen.map((vak) => {
              const open = vak.id === onderwerp?.id;
              const VakIcon = onderwerpIcon(vak.id);

              return (
                <button
                  key={vak.id}
                  type="button"
                  className="tk-subject"
                  // The tile shows a mark and a word. How the subject is going
                  // is not on it any more, and it is still here: a label that
                  // is deliberately shorter than what it means carries the long
                  // version, which is the trade .tk-variant-chip has always
                  // made. The right-hand column is where a child reads
                  // progress; this row is where they choose.
                  aria-label={`${t(vak.naam)}. ${vorderingVan(vak, known, now)}`}
                  aria-pressed={open}
                  // The subject's first set, and only when the subject is not
                  // already the open one: a child who has chosen the table of
                  // seven and then presses "Tafels" again should not be sent
                  // back to the table of one for pressing the heading.
                  onClick={() => {
                    if (!open) onSet(vak.sets[0]?.setId ?? '');
                  }}
                >
                  <VakIcon size={20} />
                  {t(vak.naam)}
                </button>
              );
            })}
          </div>
        </section>

        {/* The second, smaller decision, and only where there is one — but a
            question of its own, numbered like the others. "Welke tafel?" was a
            mono caption tucked under the subjects, which is the size a label
            gets, and it is not a label: on rekenen it is the press that decides
            what the round actually contains.

            Chips rather than a dropdown. A menu hides eleven of twelve tables
            behind a control a child has to open, and the whole point of this
            block is that the one they want is already on the screen. */}
        {onderwerp && onderwerp.keuze && onderwerp.sets.length > 1 ? (
          <section className="flex flex-col gap-3" aria-label={t(onderwerp.keuze)}>
            <Stap nummer={stap.keuze} label={t(onderwerp.keuze)} />

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
          </section>
        ) : null}

        <section className="flex flex-col gap-3" aria-label={t('choose.stepHow')}>
          {/* The order of the six is the argument, and the tile is the name.
              The line each one used to carry — "tik het gebied aan, voor de
              eerste keer" — is off the page now and still in the label, so a
              screen reader keeps the thing that tells the six apart (ADR-061).
              The heading used to carry "van makkelijk naar moeilijk" as well,
              which was a caption on a question. */}
          <Stap nummer={stap.hoe} label={t('choose.stepHow')} />

          <div className="tk-forms">
            {forms.map((candidate) => {
              const FormIcon = candidate.icon;

              return (
                <button
                  key={candidate.id}
                  type="button"
                  className="tk-form"
                  // The reason follows the name here as well as under the row,
                  // so tabbing the six never costs a child the thing that
                  // tells them apart (ADR-061).
                  aria-label={`${t(candidate.name)}. ${t(candidate.reason)}`}
                  aria-pressed={candidate.id === form?.id}
                  onClick={() => setFormId(candidate.id)}
                >
                  <FormIcon size={20} />
                  {t(candidate.name)}
                </button>
              );
            })}
          </div>
        </section>

        {/* What was chosen, in words, and then the way on. Full width and
            stacked on a phone; one line ending in the button everywhere else.
            See .tk-choose-start. */}
        {/* How long, where there is more than one honest answer. Not a numbered
            step: it is a property of the round the two steps above have already
            chosen, and it sits against the line that reports how long that
            round will take — which is the thing it changes (ADR-074). */}
        {chosen && form && lengtes.length > 0 ? (
          <div className="tk-variant">
            <p className="tk-label">{t('choose.howMany')}</p>
            <div className="tk-variant-row">
              {lengtes.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="tk-variant-chip"
                  aria-label={t('choose.howManyOne', { aantal: count })}
                  aria-pressed={count === vragen}
                  onClick={() => setAantal(count)}
                >
                  <span aria-hidden="true" className="tabular-nums">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Whether the answers wait. Not a numbered step and not a seventh way
            of practising: it is a property of the round the steps above have
            already chosen, which is exactly where "hoeveel vragen" sits and for
            the same reason (ADR-074, ADR-085). */}
        {chosen && toetsbaar ? (
          <div className="tk-variant">
            <p className="tk-label">{t('choose.testModeLabel')}</p>
            <button
              type="button"
              className="tk-switch"
              aria-label={`${t('choose.testMode')}. ${t('choose.testModeWhy')}`}
              aria-pressed={toetsstand}
              onClick={() => setToetsstand(!toetsstand)}
            >
              <PaperIcon size={20} />
              {t('choose.testMode')}
            </button>
          </div>
        ) : null}

        {chosen && form ? (
          <div className="tk-choose-start">
            {/* The sentence carries the switch as well as the two steps. A
                child who turned the answers off and then read a button that
                said nothing about it would find out by playing. */}
            <p className="tk-choose-said">
              <span className="font-semibold">{zin}</span>
              {minuten === null ? null : (
                <span className="block text-ink-2">
                  {minuten === 1 ? t('choose.minuteOne') : t('choose.minutes', { aantal: minuten })}
                </span>
              )}
            </p>

            <Button
              className="tk-button-go"
              aria-label={t('choose.goLabel', { wat: zin })}
              onClick={() => onStart(chosen, form.id, gekozen, toetsstand && toetsbaar)}
            >
              {t('choose.go')}
              <GoIcon size={24} />
            </Button>
          </div>
        ) : null}

        {/* Twelve diplomas, under the tables and nowhere else — not under
            deelsommen, not under plussommen, and not on the page as a whole.
            It is the tafeltoets, it is only that, and a child looking at
            plussommen has no use for a wall about tables (ADR-075).

            Pressing a gap answers both steps at once: that table, and the
            diploma. A child who presses "9" on a wall of diplomas has said
            what they want to do, and making them go back up the page to say it
            again in two more presses is the product not listening. */}
        {onderwerp?.id === 'tafels' ? (
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
 * How a subject is going, in the words the tile no longer has room for.
 *
 * One string, built once and used twice: it is the line under the row for the
 * chosen subject, and it is the tail of every tile's accessible name. Two
 * copies of this sentence would be two places for it to drift, and the whole
 * point of moving it off the tile is that it says the same thing in both.
 */
function vorderingVan(vak: Onderwerp, known: ReadonlyMap<string, ItemState>, now: Date): string {
  const ids = itemsVan(vak);
  const mastered = countMastered(known, ids);
  // Never over a mix on its own: a mix holds every item there is, so it is due
  // more often than anything else by definition.
  const due = vak.sets
    .filter((deel) => !deel.mix || vak.sets.length === 1)
    .reduce((most, deel) => Math.max(most, opDeRol(deel, known, now)), 0);
  const stand =
    mastered === 0 && due === 0
      ? t('home.setNew')
      : t('home.setMastered', { goed: mastered, totaal: ids.length });

  return due > 0 ? `${stand} · ${t('choose.dueToday', { aantal: due })}` : stand;
}

/**
 * The subject that holds everything this module has, if it has one.
 *
 * The mix, in both modules. It is what "the way the test will ask" means: a
 * test does not come one set at a time, and neither should the round that
 * practises for it.
 */
function mixVan(onderwerpen: readonly Onderwerp[]): string | null {
  const mix = onderwerpen.find((vak) => vak.sets.length === 1 && vak.sets[0]?.mix === true);
  return mix?.sets[0]?.setId ?? null;
}

/**
 * One of the page's numbered questions.
 *
 * The number is drawn here rather than written into the copy, because the two
 * modules do not have the same number of them: topography asks where before it
 * asks what, and rekenen does not. A "1 ·" baked into "Kies een onderwerp"
 * would be right on one page and wrong on the other.
 *
 * It is the display face at h3 — bigger than everything under it, smaller than
 * the one heading the page has. See .tk-step.
 */
function Stap({ nummer, label }: { readonly nummer: number; readonly label: string }) {
  return (
    <h2 className="tk-step">
      <span className="tabular-nums">{nummer}</span> · {label}
    </h2>
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
