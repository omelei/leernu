import { useEffect, useState, type CSSProperties } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { NextIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Sterren } from '@/components/Sterren';
import { stickerById } from '@/components/stickerSet';
import {
  levelFor,
  levelProgress,
  STERREN_PER_KIST,
  sterrenInKist,
  type FlawlessRun,
  type ModeId,
} from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { useDesk } from '@/features/shell/useSmallScreen';
import { heldVan, reeksVan, useHelden } from '@/features/reis/useHelden';
import { kistZin, niveauZin, reeksRegel } from '@/features/reis/voortgangTekst';
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
  /** Which hero this child wears, so the journey shows theirs. */
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
 * Progress: the hero a child wears, how full the next chest is, and how far to
 * the next level — in that order, because that is the order of how soon.
 *
 * **The chest weighs most.** It is the nearest reward and the only one with
 * something in it, so it gets the five stars and the large sentence: "Nog 24
 * goede antwoorden tot je volgende kist." The level stays under it as one thin
 * bar and one line, so the two do not compete and a child sees in one look what
 * the next round is worth (ADR-099, as the design draws it). Before the first
 * star the sentence names that star instead: ten is this afternoon, fifty is not.
 *
 * "5 van de 12 helden" is not here. It counts what a child already has and says
 * nothing about the next round; it is on /voortgang, above the heroes.
 *
 * The hero stands on its own reeks with its rings, and the level's bar is drawn
 * in that reeks too — the only colours in the block are the material and the
 * gold of the stars.
 *
 * Two sizes. From 1200 it is the whole card. Below 1200 it is one row, one
 * touch target of at least 44 that leads to /voortgang: the plate, "Niveau 3"
 * with the five stars beside it, and the chest sentence under them.
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
  const helden = useHelden();
  const desk = useDesk();

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
  }, []);

  // Nothing in it until it is known: a card that says level one, or a bronze
  // hero, and then changes its mind has told a child something that was not
  // true. The card is drawn at once, with its parts at their own heights, so
  // the column does not move when they arrive.
  if (goed === null || helden === null) {
    return (
      <Blok titel={t('home.journeyTitle')} bezig>
        <VoortgangLeeg desk={desk} />
      </Blok>
    );
  }

  const level = levelFor(goed);
  const reeks = reeksVan(helden, sticker);
  const sterren = sterrenInKist(goed);
  const naarKist = kistZin(goed);

  if (!desk) {
    return (
      <Blok titel={t('home.journeyTitle')}>
        <button type="button" className="tk-voortgang-kort" onClick={onReis}>
          <Heldplaat sticker={sticker} reeks={reeks} size={48} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="tk-niveau tk-niveau-klein">
                {t('home.journeyLevel', { niveau: level })}
              </span>
              <Sterren inKist={sterren} grootte={15} zin="geen" />
            </span>
            <span className="tk-hulp">{naarKist}</span>
          </span>
          <NextIcon size={20} />
          {/* The stars in words, since the stars themselves are drawn only. */}
          <span className="tk-sr-only">
            {t('reis.sterrenStand', { aantal: sterren, totaal: STERREN_PER_KIST })}
          </span>
          <span className="tk-sr-only">{t('home.journeyAll')}</span>
        </button>
      </Blok>
    );
  }

  const held = heldVan(helden, sticker);

  return (
    <Blok titel={t('home.journeyTitle')}>
      <div className="flex items-center gap-4">
        <Heldplaat sticker={sticker} reeks={reeks} size={76} />
        <div className="min-w-0">
          <p className="tk-vg-naam">{t(stickerById(sticker).name)}</p>
          <p className="tk-reeksnaam" data-reeks={reeks}>
            {reeksRegel(reeks, held?.dubbelen ?? 0)}
          </p>
        </div>
      </div>

      <div className="tk-vg-kist">
        <Sterren inKist={sterren} grootte={20} zin="kort" />
        <p className="tk-vg-kistzin">{naarKist}</p>
      </div>

      <div className="tk-vg-niveau">
        <p className="tk-vg-niveaukop">{t('home.journeyLevel', { niveau: level })}</p>
        <span className="tk-reeksbalk tk-reeksbalk-dun" data-reeks={reeks}>
          <ProgressBar
            value={levelProgress(goed)}
            showDot={false}
            label={t('home.journeyBar', { niveau: level + 1 })}
          />
        </span>
        <p className="tk-hulp">{niveauZin(goed)}</p>
      </div>

      <button type="button" className="tk-blok-knop" onClick={onReis}>
        <NextIcon size={20} />
        {t('home.journeyAll')}
      </button>
    </Blok>
  );
}

/**
 * The progress card before it knows anything: the same parts at the same
 * heights, and empty. Decorative, because "still reading" is already said by
 * the card's `aria-busy`.
 */
function VoortgangLeeg({ desk }: { readonly desk: boolean }) {
  if (!desk) {
    return (
      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="tk-leeg tk-leeg-rond" style={{ width: 48, height: 48 }} />
        <span className="flex flex-1 flex-col gap-2">
          <span className="tk-leeg" style={{ width: '60%', height: 28 }} />
          <span className="tk-leeg" style={{ width: '90%', height: 20 }} />
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="flex items-center gap-4">
        <span className="tk-leeg tk-leeg-rond" style={{ width: 76, height: 76 }} />
        <span className="flex flex-1 flex-col gap-2">
          <span className="tk-leeg" style={{ width: '70%', height: 28 }} />
          <span className="tk-leeg" style={{ width: '50%', height: 16 }} />
        </span>
      </div>
      <span className="tk-leeg" style={{ height: 92 }} />
      <span className="tk-leeg" style={{ height: 56 }} />
      <span className="tk-leeg" style={{ width: '80%', height: 44 }} />
    </div>
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
        <p className="text-tekst-secundair">{t('home.accuracyNone')}</p>
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
            <p className="text-knop text-tekst-secundair">
              {t('home.accuracyOf', { goed: accuracy.correct, totaal: accuracy.answered })}
            </p>
          </div>
        </div>
      )}

      {/* The other streak: correct answers in a row. Under the fraction, because
          it is the one number a single wrong answer takes away (ADR-072). */}
      {run !== null && run.beste > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-3 border-t border-rand-licht pt-3">
          <span className="tk-label">{t('home.runLabel')}</span>
          <span className="tk-display font-bold tabular-nums">{run.nu}</span>
          <span className="text-tekst-secundair">{t('home.runBest', { aantal: run.beste })}</span>
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
        <p className="text-tekst-secundair">{t('home.favouritesNone')}</p>
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
                    <span className="block truncate text-knop font-semibold">
                      {naamVan(favoriet.deel)}
                    </span>
                    <span className="block truncate text-knop text-tekst-secundair">
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
