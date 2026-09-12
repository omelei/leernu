import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { PaginaKop, SectieKop, Tegel } from '@/components/ds';
import { aantalOnthouden, isAangeraakt, type ItemState, type ModeId } from '@/game-core';
import { t } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import type { Module } from '@/features/shell/modules';
import { telwoord } from '@/features/home/dagen';
import { Tafeldiplomas } from './Tafeldiplomas';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
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
  offeredForms,
  questionChoices,
  questionCount,
  startLabel,
  teDrukOmAanTeWijzen,
  toetsVormVan,
} from './forms';
import { useSmallScreen } from '@/features/shell/useSmallScreen';

/**
 * A module's own page (S4, "Kies je ronde") — leer.nu/topografie,
 * leer.nu/rekenen, leer.nu/klokkijken, leer.nu/vlaggen.
 *
 * **One idiom of choosing.** Every answer on this page is a tile: where on the
 * map, what about, which one, how, how many. Chosen, a tile wears the accent's
 * double rule and tint and a diamond in its plate — never a tick, and never a
 * chip beside it. Two columns on a phone and a tablet, three from 1366 where
 * the list is long enough to need it.
 *
 * **One tinted area**, behind the steps. The steps are numbered by the page,
 * because topography has one more than rekenen.
 *
 * **One primary action**, in ink, with the combination in its label: "Start ·
 * Provincies aanwijzen · 12 vragen". No minutes: time is not part of the
 * learning core. Beside it, the oefentoets as a tertiary switch whose state is
 * in its words (ADR-100 kept the toets as a way of its own; S4 moves it here,
 * out of the ways, so the grid of ways is only ways).
 *
 * On a phone the start row is fixed to the foot of the glass above the tab bar,
 * and it is the last thing in the page, after the diplomas, so it never lies
 * over its own button (ADR-052).
 *
 * What S4 draws and this leaves out: the orientation image beside the steps at
 * 1366 (the map belongs to phase 6), and the "Alle vijf sets" way out on a
 * phone — every tile is on the page, so there is nothing to open.
 *
 * **A set has an address.** leer.nu/topografie/provincies opens on it — on the
 * tile and on the region above it.
 */
export function ModuleScreen({
  module,
  setId,
  onSet,
  onStart,
}: {
  readonly module: Module;
  /** Which set the address names, or null for the module's own way in. */
  readonly setId: string | null;
  readonly onSet: (setId: string) => void;
  readonly onStart: (
    deel: Onderdeel,
    mode: ModeId,
    aantal: number | null,
    toetsstand: boolean,
  ) => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [formId, setFormId] = useState<ModeId | null>(null);
  /** Where on the map, for the module that has a where. Null follows the set. */
  const [regio, setRegio] = useState<string | null>(null);
  /** How long the child wants the round, or null for the round's own length. */
  const [aantal, setAantal] = useState<number | null>(null);
  /** Whether the round should keep its answers until the end (ADR-085). */
  const [toetsstand, setToetsstand] = useState(false);
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
  const hoeStap = (keuzeStap === 0 ? watStap : keuzeStap) + 1;

  // A map of a hundred and sixty-seven countries is not something a child can
  // point at, and on a phone neither is a map of forty-six. Where that is true
  // the way in becomes multiple choice (ADR-087). Pointing is still on the
  // page, at the end of the row.
  const krap = teDrukOmAanTeWijzen(chosen?.setId ?? null, chosen?.items.length ?? 0, kleinScherm);
  const forms = offeredForms(formsFor(module.id), false, chosen?.setId ?? null, krap);
  // The ways that are tiles. A way only the oefentoets asks in is reached by
  // switching the oefentoets on, and never offered beside it (ADR-102).
  const tegels = forms.filter((candidate) => !candidate.alleenToets);
  const gekozenManier = tegels.find((candidate) => candidate.id === formId) ?? tegels[0] ?? null;
  // The oefentoets answers the way a test asks, by typing, and hears back only
  // at the end — so switching it on chooses the way as well (ADR-100).
  const toetsVorm = toetsVormVan(module.id, forms);
  const alsToets = toetsstand && toetsVorm !== null;
  const form = alsToets ? toetsVorm : gekozenManier;

  const setSize = chosen?.items.length ?? 0;
  const lengtes = form === null ? [] : questionChoices(form, setSize);
  // A length that no longer fits — twenty-five questions of the table of seven,
  // after the child moved from the Rekenmix to a table — falls back to the
  // round's own rather than quietly asking for something impossible.
  const gekozen = aantal !== null && lengtes.includes(aantal) ? aantal : null;
  const vragen = form === null ? null : questionCount(form, setSize, gekozen);
  const zin =
    chosen === null || form === null
      ? ''
      : alsToets
        ? t('choose.startTest', { wat: startLabel(form, naamVan(chosen), setSize, gekozen) })
        : startLabel(form, naamVan(chosen), setSize, gekozen);

  const regioNaam = heeftRegio ? regios.find((kandidaat) => kandidaat.id === hier) : undefined;
  const meta = [
    regioNaam ? t(regioNaam.naam) : null,
    onderwerpen.length === 1
      ? t('choose.metaEen')
      : t('choose.meta', { aantal: telwoord(onderwerpen.length) }),
  ]
    .filter(Boolean)
    .join(' · ');

  const startRij =
    chosen && form ? (
      <div className="ln-start">
        <Button
          className="ln-start-knop"
          onClick={() => onStart(chosen, form.id, gekozen, alsToets)}
        >
          {t('choose.goZin', { wat: zin })}
        </Button>
        {toetsVorm ? (
          <Button variant="tertiary" onClick={() => setToetsstand(!alsToets)}>
            {alsToets ? t('choose.toetsAan') : t('choose.toetsUit')}
          </Button>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="ln-pagina" data-module={module.id}>
      <PaginaKop titel={t('choose.title')} meta={meta} soort="ding" />

      <div className="ln-modulevlak ln-kiesstappen">
        {/* Where on the map, and only where there is more than one answer. A
            region the plan has and the product does not says so on its own
            face rather than opening onto nothing. */}
        {heeftRegio ? (
          <section aria-label={t('regio.title')}>
            <SectieKop titel={stapKop(regioStap, t('regio.title'))} />
            <div className="ln-tegels ln-tegels-drie">
              {regios.map((kandidaat) => (
                <Tegel
                  key={kandidaat.id}
                  titel={t(kandidaat.naam)}
                  sub={kandidaat.built ? undefined : t('regio.soon')}
                  Icoon={regioIcon(kandidaat.id)}
                  gekozen={kandidaat.built && kandidaat.id === hier}
                  disabled={!kandidaat.built}
                  onClick={() => setRegio(kandidaat.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-label={t('choose.stepWhat')}>
          <SectieKop titel={stapKop(watStap, t('choose.stepWhat'))} />
          <div className="ln-tegels">
            {onderwerpen.map((vak) => {
              const open = vak.id === onderwerp?.id;
              const aantalItems = itemsVan(vak).length;

              return (
                <Tegel
                  key={vak.id}
                  titel={t(vak.naam)}
                  sub={
                    open
                      ? t('choose.itemsGekozen', { aantal: aantalItems })
                      : t('choose.items', { aantal: aantalItems })
                  }
                  Icoon={onderwerpIcon(vak.id)}
                  gekozen={open}
                  // How the subject is going is in its name as well (ADR-089).
                  aria-label={`${t(vak.naam)}. ${vorderingVan(vak, known, now)}`}
                  // The subject's first set, and only when the subject is not
                  // already open: a child who has chosen the table of seven and
                  // presses "Tafels" again should not be sent back to one.
                  onClick={() => {
                    if (!open) onSet(vak.sets[0]?.setId ?? '');
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Which one, where a subject holds more than one set: the tables and
            the divisions, a range, a level, which cities. A tile each, with the
            short name on its face and the whole name in its label. */}
        {onderwerp && onderwerp.keuze && heeftKeuze ? (
          <section aria-label={t(onderwerp.keuze)}>
            <SectieKop titel={stapKop(keuzeStap, t(onderwerp.keuze))} />
            <div className="ln-tegels ln-tegels-drie">
              {onderwerp.sets.map((deel) => (
                <Tegel
                  key={deel.setId}
                  titel={deel.kortNaam ?? naamVan(deel)}
                  gekozen={deel.setId === chosen?.setId}
                  aria-label={naamVan(deel)}
                  onClick={() => onSet(deel.setId)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* The order of the ways is the argument, and the tile is the name.
            What each is for is on its face and in its label (ADR-061). */}
        <section aria-label={t('choose.stepHow')}>
          <SectieKop titel={stapKop(hoeStap, t('choose.stepHow'))} />
          <div className="ln-tegels ln-tegels-drie">
            {tegels.map((candidate) => (
              <Tegel
                key={candidate.id}
                titel={t(candidate.name)}
                sub={t(candidate.reason)}
                Icoon={candidate.icon}
                gekozen={!alsToets && candidate.id === form?.id}
                aria-label={`${t(candidate.name)}. ${t(candidate.reason)}`}
                onClick={() => {
                  setFormId(candidate.id);
                  setToetsstand(false);
                }}
              />
            ))}
          </div>
        </section>

        {/* How long, and only after a way that has a length. A diploma is the
            whole table and exploring has none, so for those the step is not
            there rather than empty (ADR-100, amending ADR-074). */}
        {chosen && form && lengtes.length > 0 ? (
          <section aria-label={t('choose.howMany')}>
            <SectieKop titel={stapKop(hoeStap + 1, t('choose.howMany'))} />
            <div className="ln-tegels ln-tegels-drie">
              {lengtes.map((count) => {
                const heel = count === setSize;

                return (
                  <Tegel
                    key={count}
                    titel={heel ? t('choose.howManyAll', { aantal: count }) : String(count)}
                    gekozen={count === vragen}
                    aria-label={t(heel ? 'choose.howManyAllLabel' : 'choose.howManyOne', {
                      aantal: count,
                    })}
                    onClick={() => setAantal(count)}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {kleinScherm ? null : startRij}

      {/* Twelve diplomas, under the tables and nowhere else (ADR-075). Pressing
          a gap answers both steps at once: that table, and the diploma. */}
      {onderwerp?.id === 'tafels' ? (
        <Tafeldiplomas
          onKies={(tafel) => {
            onSet(tafel);
            setFormId('tafeldiploma');
            setToetsstand(false);
          }}
        />
      ) : null}

      {/* Six vlaggendiploma's on the flags page (ADR-104). Pressing one answers
          every step at once: that werelddeel, all its flags, the diploma. */}
      {module.id === 'vlaggen' ? (
        <VlagDiplomas
          onKies={(deel) => {
            setRegio(deel);
            onSet(`vlag-${deel}-alle`);
            setFormId('vlag-diploma');
            setToetsstand(false);
          }}
        />
      ) : null}

      {kleinScherm ? startRij : null}
    </div>
  );
}

/** "1 · Waarover": the number is the page's, the words are the step's. */
function stapKop(nummer: number, label: string): string {
  return `${nummer} · ${label}`;
}

/**
 * How a subject is going, in the words the tile has no room for.
 *
 * It is the tail of every subject's accessible name.
 */
function vorderingVan(vak: Onderwerp, known: ReadonlyMap<string, ItemState>, now: Date): string {
  const ids = itemsVan(vak);
  // Never over a mix on its own: a mix holds every item there is, so it is due
  // more often than anything else by definition.
  const due = vak.sets
    .filter((deel) => !deel.mix || vak.sets.length === 1)
    .reduce((most, deel) => Math.max(most, opDeRol(deel, known, now)), 0);
  // "Nog niet geoefend" means no answer at all (ADR-107): an item answered
  // today is not due today any more (ADR-106), so "nothing due" says nothing.
  const stand = isAangeraakt(known, ids)
    ? t('home.setMastered', { goed: aantalOnthouden(known, ids, now), totaal: ids.length })
    : t('home.setNew');

  return due > 0 ? `${stand} · ${t('choose.dueToday', { aantal: due })}` : stand;
}
