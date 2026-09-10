import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { CorrectIcon, GoIcon, MixIcon, PaperIcon } from '@/components/Icon';
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
  type PracticeForm,
} from './forms';
import { useSmallScreen } from '@/features/shell/useSmallScreen';

/**
 * A module's own page — leer.nu/topografie, leer.nu/rekenen, leer.nu/klokkijken
 * — and the one flow on it.
 *
 * A column under "Wat wil je oefenen?": first **what about**, then **how**, then
 * a start bar that carries the answers. The same column for every module, and
 * what differs between two modules is data — the list of regions, of subjects,
 * of ways — which is not a reason for a second screen.
 *
 * Redrawn in 2026-09 (ADR-095), with the same questions in the same order. What
 * changed is how each is answered:
 *
 * **A word is a chip, a subject is a tile, a number is a square.** Where on the
 * map, which kind of sum, which range and how many questions are rows of chips:
 * short words, several to a line. A subject and a way of practising are tiles —
 * a plate and a title, two columns from 1200 — because they are what the page
 * is about and a tile a hand's width across is hit first time. The tables and
 * the divisions are a keypad of squares with the mix first. In each of them the
 * answer already given wears the module's colour (ADR-089).
 *
 * **Topography asks where before it asks what** (ADR-083), and rekenen's first
 * question is which kind of sum — so there the subjects are chips, and the
 * second question is the keypad. Klokkijken has no where and one set per
 * subject, so it asks two things. The steps are numbered by the page.
 *
 * **The start bar is the answers, together.** Each choice as a small chip —
 * the map, the subject, which one, the way, how long — and the Start button at
 * the end of the line. What a screen reader hears from the button is still the
 * whole sentence (ADR-066). On a phone it is a bar stuck to the foot of the
 * screen, the last thing in the page, which ADR-052 put off and ADR-095 builds.
 *
 * **A set has an address.** leer.nu/topografie/provincies opens on it — on the
 * tile and on the region above it.
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

  /**
   * Rekenen's subjects are kinds of sum — tafels, delen, plus, min — and the
   * handoff asks that as a row of words, with the keypad under it. The other
   * two modules' subjects are things on a map or a face, and those are tiles.
   */
  const onderwerpAlsChips = module.id === 'tafels';

  // A map of a hundred and sixty-seven countries is not something a child can
  // point at, and on a phone neither is a map of forty-six. Where that is true
  // the way in becomes multiple choice (ADR-087). Pointing is still on the
  // page, at the end of the row.
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
  // questions, and a tafeldiploma already stops at the first mistake.
  const toetsbaar = form !== null && form.rule !== null && form.id !== 'tafeldiploma';
  /** Everything this module holds, under one name. What a test asks about. */
  const mix = mixVan(alleOnderwerpen);
  const zin =
    chosen === null || form === null
      ? ''
      : toetsstand && toetsbaar
        ? t('choose.startTest', { wat: startLabel(form, naamVan(chosen), setSize, gekozen) })
        : startLabel(form, naamVan(chosen), setSize, gekozen);

  // What the start bar lists: one chip per question the page asked, in the
  // order it asked them, and how long the round will be.
  const regioNaam = heeftRegio ? regios.find((kandidaat) => kandidaat.id === hier) : undefined;
  const ronde = rondeVan(form, vragen, minuten);
  const gekozenLijst: readonly { readonly label: string; readonly waarde: string }[] = [
    ...(regioNaam ? [{ label: t('start.kaart'), waarde: t(regioNaam.naam) }] : []),
    ...(onderwerp
      ? [
          {
            label: t(onderwerpAlsChips ? 'start.som' : 'start.onderwerp'),
            waarde: t(onderwerp.naam),
          },
        ]
      : []),
    ...(heeftKeuze && chosen
      ? [{ label: t('start.welke'), waarde: chosen.kortNaam ?? naamVan(chosen) }]
      : []),
    ...(form ? [{ label: t('start.manier'), waarde: t(form.name) }] : []),
    ...(ronde ? [{ label: t('start.ronde'), waarde: ronde }] : []),
    ...(toetsstand && toetsbaar ? [{ label: t('start.stand'), waarde: t('choose.testMode') }] : []),
  ];

  const startKnop =
    chosen && form ? (
      <Button
        className="tk-button-go"
        aria-label={t('choose.goLabel', { wat: zin })}
        onClick={() => onStart(chosen, form.id, gekozen, toetsstand && toetsbaar)}
      >
        {t('choose.go')}
        <GoIcon size={24} />
      </Button>
    ) : null;

  const vink = (
    <span className="tk-tegel-vink">
      <CorrectIcon size={24} />
    </span>
  );

  return (
    <div className="tk-page" data-module={module.id}>
      <div className="tk-page-main">
        <div className="flex flex-col gap-3">
          {/* Which module this is, as a badge in its own tint. On a phone and
              a tablet the rail is not drawn, and the menu above says it too;
              here it is the page saying it about itself. */}
          <p className="tk-modulebadge">
            <ModuleIcon size={16} />
            {t(module.name)}
          </p>

          {/* By name, the way the front door greets them — on every size. The
              handoff drops the name on a phone; a chooser that asks "wat wil
              je oefenen?" of nobody in particular is a form, and asked of Fem
              it is a question (ADR-095). */}
          <h1 className="tk-display tk-titel font-semibold">{t('choose.title', { naam })}</h1>

          {/* The reason this week has a reason, but only on the page it is
              about. */}
          {plan.subject === module.id ? (
            <p className="flex flex-wrap items-center gap-3">
              <span className="tk-badge">{t('home.testLabel')}</span>
              <span className="text-ink-2">{t('choose.testSubject')}</span>
              {/* One press that answers this page the way the test will ask it:
                  everything the subject holds, and no answers until the end.
                  It chooses rather than starts (ADR-085). */}
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

        {/* Where on the map, and only where there is more than one answer. */}
        {heeftRegio ? (
          <section className="tk-kies" aria-label={t('regio.title')}>
            <Stap nummer={stap.regio} label={t('regio.title')} />

            <div className="tk-keuzes">
              {regios.map((kandidaat) => {
                const RegioIcon = regioIcon(kandidaat.id);

                return (
                  <button
                    key={kandidaat.id}
                    type="button"
                    className="tk-keuze"
                    aria-pressed={kandidaat.built ? kandidaat.id === hier : undefined}
                    disabled={!kandidaat.built}
                    data-soon={kandidaat.built ? undefined : 'ja'}
                    onClick={() => setRegio(kandidaat.id)}
                  >
                    <RegioIcon size={20} />
                    {t(kandidaat.naam)}
                    {/* A region the plan has and the product does not says so
                        on its own face rather than opening onto nothing. */}
                    {kandidaat.built ? null : (
                      <span className="tk-label tk-keuze-soon">{t('regio.soon')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="tk-kies" aria-label={t('choose.stepWhat')}>
          <Stap nummer={stap.wat} label={t('choose.stepWhat')} />

          <div className={onderwerpAlsChips ? 'tk-keuzes' : 'tk-tegels'}>
            {onderwerpen.map((vak) => {
              const open = vak.id === onderwerp?.id;
              const VakIcon = onderwerpIcon(vak.id);

              return (
                <button
                  key={vak.id}
                  type="button"
                  className={onderwerpAlsChips ? 'tk-keuze' : 'tk-tegel'}
                  // How the subject is going is not on the face of it; it is in
                  // its name, and in the child's own column (ADR-089).
                  aria-label={`${t(vak.naam)}. ${vorderingVan(vak, known, now)}`}
                  aria-pressed={open}
                  // The subject's first set, and only when the subject is not
                  // already open: a child who has chosen the table of seven and
                  // presses "Tafels" again should not be sent back to one.
                  onClick={() => {
                    if (!open) onSet(vak.sets[0]?.setId ?? '');
                  }}
                >
                  {onderwerpAlsChips ? (
                    <VakIcon size={20} />
                  ) : (
                    <span className="tk-plaat">
                      <VakIcon size={24} />
                    </span>
                  )}
                  <span className="min-w-0">{t(vak.naam)}</span>
                  {!onderwerpAlsChips && open ? vink : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* The second, smaller decision, where there is one — numbered like the
            others, because on rekenen it is the press that decides what the
            round contains. The tables and the divisions are a keypad with the
            mix first; a range, a level or which cities are chips. */}
        {onderwerp && onderwerp.keuze && onderwerp.sets.length > 1 ? (
          <section className="tk-kies" aria-label={t(onderwerp.keuze)}>
            <Stap nummer={stap.keuze} label={t(onderwerp.keuze)} />

            {isKeypad(onderwerp) ? (
              <div className="tk-tafels">
                {mixEerst(onderwerp.sets).map((deel) => (
                  <button
                    key={deel.setId}
                    type="button"
                    className="tk-tafel"
                    // The full name, because "7" is not a sentence: this is the
                    // one control whose visible label is shorter than it means.
                    aria-label={naamVan(deel)}
                    aria-pressed={deel.setId === chosen?.setId}
                    onClick={() => onSet(deel.setId)}
                  >
                    {deel.mix ? (
                      <>
                        <span className="tk-plaat">
                          <MixIcon size={20} />
                        </span>
                        <span aria-hidden="true" className="tk-tafel-mix">
                          {t('choose.mix')}
                        </span>
                      </>
                    ) : (
                      <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="tk-keuzes">
                {onderwerp.sets.map((deel) => (
                  <button
                    key={deel.setId}
                    type="button"
                    className="tk-keuze"
                    aria-label={naamVan(deel)}
                    aria-pressed={deel.setId === chosen?.setId}
                    onClick={() => onSet(deel.setId)}
                  >
                    <span aria-hidden="true">{deel.kortNaam ?? naamVan(deel)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="tk-kies" aria-label={t('choose.stepHow')}>
          {/* The order of the ways is the argument, and the tile is the name.
              What each is for is in its label, so tabbing through them never
              costs a child the thing that tells them apart (ADR-061). */}
          <Stap nummer={stap.hoe} label={t('choose.stepHow')} />

          <div className="tk-tegels">
            {forms.map((candidate) => {
              const FormIcon = candidate.icon;
              const gekozenVorm = candidate.id === form?.id;

              return (
                <button
                  key={candidate.id}
                  type="button"
                  className="tk-tegel"
                  aria-label={`${t(candidate.name)}. ${t(candidate.reason)}`}
                  aria-pressed={gekozenVorm}
                  onClick={() => setFormId(candidate.id)}
                >
                  <span className="tk-plaat">
                    <FormIcon size={24} />
                  </span>
                  <span className="min-w-0">{t(candidate.name)}</span>
                  {gekozenVorm ? vink : null}
                </button>
              );
            })}

            {/* The oefentoets, last among the ways. Still a switch and not a
                seventh way (ADR-085): pressing it does not un-press the way
                that is chosen, and the start bar carries it separately. */}
            {chosen && toetsbaar ? (
              <button
                type="button"
                className="tk-tegel"
                aria-label={`${t('choose.testMode')}. ${t('choose.testModeWhy')}`}
                aria-pressed={toetsstand}
                onClick={() => setToetsstand(!toetsstand)}
              >
                <span className="tk-plaat">
                  <PaperIcon size={24} />
                </span>
                <span className="min-w-0">{t('choose.testMode')}</span>
                {toetsstand ? vink : null}
              </button>
            ) : null}
          </div>
        </section>

        {/* How long, where there is more than one honest answer. Not a numbered
            step: it is a property of the round the steps above have already
            chosen (ADR-074). */}
        {chosen && form && lengtes.length > 0 ? (
          <div className="tk-kies">
            <p className="tk-label">{t('choose.howMany')}</p>
            <div className="tk-keuzes">
              {lengtes.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="tk-keuze"
                  aria-label={t('choose.howManyOne', { aantal: count })}
                  aria-pressed={count === vragen}
                  onClick={() => setAantal(count)}
                >
                  <span aria-hidden="true">{count}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* From a tablet up, the answers together and the way on, closing the
            chooser. On a phone the same bar is at the foot of the page — see
            below. */}
        {chosen && form && !kleinScherm ? (
          <div className="tk-startbalk tk-choose-start">
            <div className="min-w-0">
              <p className="tk-startbalk-label">{t('start.klaar')}</p>
              <ul className="tk-startbalk-keuzes">
                {gekozenLijst.map(({ label, waarde }) => (
                  <li key={label} className="tk-startchip">
                    <span className="tk-startchip-label">{label}</span>
                    {waarde}
                  </li>
                ))}
              </ul>
            </div>
            {startKnop}
          </div>
        ) : null}

        {/* Twelve diplomas, under the tables and nowhere else (ADR-075). Pressing
            a gap answers both steps at once: that table, and the diploma. */}
        {onderwerp?.id === 'tafels' ? (
          <Tafeldiplomas
            onKies={(tafel) => {
              onSet(tafel);
              setFormId('tafeldiploma');
            }}
          />
        ) : null}
      </div>

      {aside}

      {/* On a phone: the sentence and the way on, stuck to the foot of the
          screen. After the child's own column, as the last thing in the page, so
          it is in reach the whole way down and never lies over its own button.
          See .tk-startbalk-mobiel for what ADR-052 taught about building it. */}
      {chosen && form && kleinScherm ? (
        <div className="tk-startbalk-mobiel tk-choose-start">
          <p className="tk-startbalk-zin">
            <span className="block font-semibold">{zin}</span>
            {minuten === null ? null : (
              <span className="tk-hulp block">
                {minuten === 1 ? t('choose.minuteOne') : t('choose.minutes', { aantal: minuten })}
              </span>
            )}
          </p>
          {startKnop}
        </div>
      ) : null}
    </div>
  );
}

/**
 * How long the round will be, in the words the start bar uses: a number of
 * questions and roughly how many minutes, a number of seconds, a number of
 * lives, or no questions at all for exploring. Null where there is no way yet.
 */
function rondeVan(
  form: PracticeForm | null,
  vragen: number | null,
  minuten: number | null,
): string | null {
  if (form === null) return null;
  const rule = form.rule;
  if (rule === null) return t('start.vrij');
  if (rule.kind === 'tijd') return t('start.seconden', { aantal: rule.seconden });
  if (rule.kind === 'levens') return t('start.levens', { aantal: rule.levens });
  if (vragen === null) return null;
  return minuten === null
    ? t('start.vragen', { aantal: vragen })
    : t('start.vragenTijd', { aantal: vragen, minuten });
}

/** The subjects whose sets are numbers: a keypad, not a row of words. */
function isKeypad(onderwerp: Onderwerp): boolean {
  return onderwerp.id === 'tafels' || onderwerp.id === 'delen';
}

/** The mix first, then the rest in their own order — the keypad the handoff draws. */
function mixEerst(sets: readonly Onderdeel[]): Onderdeel[] {
  return [...sets.filter((deel) => deel.mix), ...sets.filter((deel) => !deel.mix)];
}

/**
 * How a subject is going, in the words the tile has no room for.
 *
 * It is the tail of every subject's accessible name. The right-hand column is
 * where a child reads progress; the tiles are where they choose.
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
 * The subject that holds everything this module has, if it has one: what "the
 * way the test will ask" means, because a test does not come one set at a time.
 */
function mixVan(onderwerpen: readonly Onderwerp[]): string | null {
  const mix = onderwerpen.find((vak) => vak.sets.length === 1 && vak.sets[0]?.mix === true);
  return mix?.sets[0]?.setId ?? null;
}

/**
 * One of the page's numbered questions: the number in the module's text colour
 * and the question in ink, on a hairline. The number is drawn here rather than
 * written into the copy, because the modules do not have the same number of
 * questions.
 */
function Stap({ nummer, label }: { readonly nummer: number; readonly label: string }) {
  return (
    <h2 className="tk-stap">
      <span className="tk-stap-nummer">{nummer}</span> · {label}
    </h2>
  );
}

/**
 * What the scheduler has put on today's list, when it is waiting somewhere
 * other than where the child is standing. It names the set and selects it, and
 * then gets out of the way — choosing how is still the child's to make.
 *
 * Absent when the busiest set is the one already open.
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
  // every item there is and would be the answer every time.
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
