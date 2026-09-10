import { useEffect, useState, type CSSProperties } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { MysteryIcon, NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import {
  correctToNextLevel,
  earnedAt,
  huidigeReeks,
  levelFor,
  levelProgress,
  nextPlek,
  COLLECTION_SIZE,
  REEKSEN,
  type FlawlessRun,
  type ModeId,
  type Reeks,
} from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { useDesk } from '@/features/shell/useSmallScreen';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy, loadPlayedRounds } from '@/store/progress';
import type { Accuracy } from '@/store/progress';
import { loadRun } from '@/store/streakStore';
import {
  favorieten,
  geplaatst,
  naamVan,
  startbareOnderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';
import { Blok } from './Blok';
import { ToetsenBlok } from './ToetsenBlok';

/**
 * The child's own column: the tests that are coming, how far along the journey
 * is, how the whole of it is going, and where they keep going back to.
 *
 * It is the same column on every page inside the shell, because it is what the
 * app knows about the child, and that does not change when they walk into
 * topography. The front door lays the same four blocks out itself — it puts
 * them in the flow of its own page below 1200 — so each block is exported on
 * its own as well as in this column (ADR-094).
 *
 * **The order follows the width.** From 1200 the tests are first: the column is
 * beside the work and the test is the reason for it this week. Below 1200 the
 * column is under the work, and the handoff puts the level first there, where a
 * child scrolling down meets what they are working towards before a date. It
 * is decided in React rather than with CSS `order`, so a keyboard and a screen
 * reader meet the blocks in the order the eye does.
 *
 * "Samen met" belongs at the foot of it. It is three friends, and there are
 * none until ADR-050's backend, so it is absent rather than empty.
 */
export function SideColumn({
  sticker,
  onReis,
  onBegin,
}: {
  /** Which animal this child chose, so the journey shows theirs. */
  readonly sticker: string | undefined;
  /** The way to the collection, which is what the journey card leads to. */
  readonly onReis: () => void;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const desk = useDesk();
  const toetsen = <ToetsenBlok key="toetsen" />;
  const voortgang = <VoortgangBlok key="voortgang" sticker={sticker} onReis={onReis} />;

  return (
    <aside className="tk-home-aside">
      {desk ? [toetsen, voortgang] : [voortgang, toetsen]}
      <GoedBlok />
      <FavorietenBlok onBegin={onBegin} />
    </aside>
  );
}

/**
 * Which reeks the animal a child wears is in.
 *
 * Always the first: the collection lets only that row be worn (`ReisScreen`),
 * because it is the row whose drawings are the avatar. It stays a name here
 * rather than a literal so the day heroes have reeksen of their own is a change
 * to one line.
 */
const GEDRAGEN: Reeks = REEKSEN[0];

/**
 * Progress: which level, which reeks is filling, and how far to the next.
 *
 * Everything on it is worked out from one number — correct answers, ever
 * (ADR-070). The line that matters is "nog 6 goede antwoorden": a thing a child
 * can decide to do this afternoon, and exact rather than rounded.
 *
 * Two sizes. From 1200 it is the whole card: the plate, the level, the bar, the
 * sentence, what is still wrapped up, and the way to all of it. Below 1200 the
 * handoff draws one row with an arrow at the end, and that row is the way to
 * the collection — the whole block is the button.
 *
 * What it never says is how many days, how long, or how often. Nothing here
 * moves by waiting.
 */
export function VoortgangBlok({
  sticker,
  onReis,
}: {
  readonly sticker: string | undefined;
  readonly onReis: () => void;
}) {
  const [goed, setGoed] = useState<number | null>(null);
  const desk = useDesk();

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
  }, []);

  // Nothing in it until it is known: a card that says level one and then
  // changes its mind has told a child something about themselves that was not
  // true. The card itself is drawn at once, so the page does not move when the
  // level arrives.
  if (goed === null) return <Blok titel={t('home.journeyTitle')} bezig />;

  const level = levelFor(goed);
  const reeks = huidigeReeks(level);
  const volgende = nextPlek(level);
  const teGaan = correctToNextLevel(goed);
  const reeksNaam = t(`reeks.${reeks}` as TranslationKey);
  const naarNiveau =
    volgende === null
      ? t('home.journeyComplete')
      : teGaan === 1
        ? t('home.journeyOneToGo', { niveau: level + 1 })
        : t('home.journeyToGo', { aantal: teGaan, niveau: level + 1 });

  // The bar in the material of the reeks being filled, on that material's own
  // soft tone. It is the one place a reeks colours a figure, and the figure is
  // the reward's own: how far to the next one.
  const balk = (klasse: string) => (
    <span className={klasse} data-reeks={reeks}>
      <ProgressBar
        value={levelProgress(goed)}
        showDot={false}
        label={t('home.journeyBar', { niveau: level + 1 })}
      />
    </span>
  );

  if (!desk) {
    return (
      <Blok titel={t('home.journeyTitle')}>
        <button type="button" className="tk-voortgang-kort" onClick={onReis}>
          <Heldplaat sticker={sticker} reeks={GEDRAGEN} size={48} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="tk-niveau tk-niveau-klein">
                {t('home.journeyLevel', { niveau: level })}
              </span>
              <span className="tk-reeksnaam" data-reeks={reeks}>
                {reeksNaam}
              </span>
            </span>
            {/* The sentence under it says the same thing in words, and a bar
                inside a button would fold its own name into the button's. */}
            <span aria-hidden="true">{balk('tk-reeksbalk tk-reeksbalk-dun')}</span>
            <span className="tk-hulp">{naarNiveau}</span>
          </span>
          <NextIcon size={20} />
          <span className="tk-sr-only">{t('home.journeyAll')}</span>
        </button>
      </Blok>
    );
  }

  return (
    <Blok titel={t('home.journeyTitle')}>
      <div className="flex items-center gap-4">
        <Heldplaat sticker={sticker} reeks={GEDRAGEN} size={76} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="tk-niveau">{t('home.journeyLevel', { niveau: level })}</span>
            <span className="tk-reeksnaam" data-reeks={reeks}>
              {reeksNaam}
            </span>
          </p>
          <p className="text-label text-ink-2">
            {t('home.journeyHave', { aantal: earnedAt(level), totaal: COLLECTION_SIZE })}
          </p>
        </div>
      </div>

      {balk('tk-reeksbalk')}

      <p className="text-label">{naarNiveau}</p>

      {/* What is coming, wrapped: a parcel in the next material's colour says
          exactly as much as a child needs to aim at it (ADR-081). */}
      {volgende === null ? null : (
        <p className="flex items-center gap-3 text-label text-ink-2">
          <span className="tk-sticker-next" data-reeks={volgende.reeks} aria-hidden="true">
            <MysteryIcon size={24} />
          </span>
          {t('home.journeyNext', { reeks: t(`reeks.${volgende.reeks}` as TranslationKey) })}
        </p>
      )}

      <button type="button" className="tk-blok-knop" onClick={onReis}>
        <NextIcon size={20} />
        {t('home.journeyAll')}
      </button>
    </Blok>
  );
}

/**
 * Everything answered, ever, as one fraction.
 *
 * Deliberately not a retention figure, and worded so the two cannot be
 * confused. The ring is ink on the sunken tone rather than a material: this is
 * how the work is going, and a material is a reward (ADR-071).
 */
export function GoedBlok() {
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [run, setRun] = useState<FlawlessRun | null>(null);

  useEffect(() => {
    void loadAccuracy().then(setAccuracy);
    void loadRun().then(setRun);
  }, []);

  // Empty until it is known, for the reason the progress card gives.
  if (accuracy === null) return <Blok titel={t('home.accuracyTitle')} bezig />;

  const procent =
    accuracy.answered === 0 ? 0 : Math.round((accuracy.correct / accuracy.answered) * 100);

  return (
    <Blok titel={t('home.accuracyTitle')}>
      {accuracy.answered === 0 ? (
        <p className="text-ink-2">{t('home.accuracyNone')}</p>
      ) : (
        <div className="flex items-center gap-4">
          {/* Decorative: the figure beside it is the same number in words. */}
          <span
            className="tk-donut"
            style={{ '--vul': `${procent}%` } as CSSProperties}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="tk-procent">{`${procent}%`}</p>
            <p className="text-label text-ink-2">
              {t('home.accuracyOf', { goed: accuracy.correct, totaal: accuracy.answered })}
            </p>
          </div>
        </div>
      )}

      {/* The other streak: correct answers in a row. Under the fraction, because
          it is the one number a single wrong answer takes away (ADR-072). */}
      {run !== null && run.beste > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-3 border-t border-line pt-3">
          <span className="tk-label">{t('home.runLabel')}</span>
          <span className="tk-display font-bold tabular-nums">{run.nu}</span>
          <span className="text-ink-2">{t('home.runBest', { aantal: run.beste })}</span>
        </p>
      ) : null}
    </Blok>
  );
}

/** Where a child keeps going back to, one press away. */
export function FavorietenBlok({
  onBegin,
}: {
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[]>([]);

  useEffect(() => {
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, startbareOnderdelen())));
  }, []);

  const lijst = favorieten(gespeeld);

  return (
    <Blok titel={t('home.favouritesTitle')}>
      {lijst.length === 0 ? (
        <p className="text-ink-2">{t('home.favouritesNone')}</p>
      ) : (
        <ul className="tk-favorieten">
          {lijst.map((favoriet) => {
            const ModuleIcon = MODULE_ICON[favoriet.deel.moduleId];

            return (
              <li key={`${favoriet.deel.setId}-${favoriet.mode}`}>
                <button
                  type="button"
                  data-module={favoriet.deel.moduleId}
                  className="tk-favoriet"
                  onClick={() => onBegin(favoriet.deel, favoriet.mode)}
                >
                  <span className="tk-plaat tk-plaat-klein">
                    <ModuleIcon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-label font-semibold">
                      {naamVan(favoriet.deel)}
                    </span>
                    <span className="block truncate text-label text-ink-2">
                      {t(`mode.${favoriet.mode}` as TranslationKey)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Blok>
  );
}
