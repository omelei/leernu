import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Heldplaat } from '@/components/Heldplaat';
import { DiplomaIcon, StampIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Sterren } from '@/components/Sterren';
import { STICKERS, stickerById } from '@/components/stickerSet';
import { AANTAL_HELDEN, levelFor, levelProgress, sterrenInKist, STAMPS } from '@/game-core';
import { geplaatst, startbareOnderdelen } from '@/features/module/onderdelen';
import type { Module } from '@/features/shell/modules';
import { useSmallScreen } from '@/features/shell/useSmallScreen';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy, loadPlayedRounds } from '@/store/progress';
import { loadDiplomas, loadStamps } from '@/store/rewardStore';
import { VlagDiplomas } from '@/features/vlaggen/VlagDiplomas';
import { Kistkeuze } from './Kistkeuze';
import { STAMP_NAME } from './stampNames';
import { heldVan, reeksVan, useHelden } from './useHelden';
import { kistZin, niveauZin, reeksRegel, verderZin } from './voortgangTekst';

/** One to twelve, which is every table the product has a diploma for. */
const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** The rules of the chests, in the order a child needs them. */
const REGELS = ['reis.regel1', 'reis.regel2', 'reis.regel3', 'reis.regel4'] as const;

/**
 * The whole of what a child has collected, and how the rest arrives.
 *
 * The card in the right-hand column says where the journey is; this is the
 * journey (ADR-076).
 *
 * **It opens on the nearest reward.** The page used to begin with a title, an
 * introduction and then the level. Now the top is the hero a child wears, large
 * and in its rings, beside the five stars and the sentence that says how far the
 * next chest is — and a way back to practising next to it, so the decision to
 * do another round is made above the fold rather than at the bottom of a list.
 * The level is under the stars, one thin bar and one line, as in the column.
 *
 * **The block and the top of the page do not say the same thing twice.** The
 * block names the next chest and the next level. The top adds the hero at full
 * size, the stars in full, and the way back; the collection is under it.
 *
 * **A chest is opened here too.** One earned by a round that was closed before
 * the result screen was read is still owed, and this is the other place a child
 * can come and open it.
 *
 * **The rules are written out.** Ten answers a star, five stars a chest, a chest
 * that always holds a hero you do not have, three of them to choose between,
 * three duplicates up a reeks, and nothing to buy and nothing for waiting
 * (ADR-097).
 *
 * **It never says when.** No dates, no "kom morgen terug", no counter that moves
 * by waiting. Every number on this page is a correct answer, a star, a chest or
 * a level.
 */
export function ReisScreen({
  sticker,
  onSticker,
  onVerder,
  aside,
}: {
  readonly sticker: string | undefined;
  readonly onSticker: (id: string) => void;
  /** Back to practising: the subject last practised, or null for none yet. */
  readonly onVerder: (vak: Module['id'] | null) => void;
  readonly aside: ReactNode;
}) {
  const [goed, setGoed] = useState<number | null>(null);
  const [vak, setVak] = useState<Module['id'] | null | undefined>(undefined);
  const [diplomas, setDiplomas] = useState<ReadonlySet<number>>(new Set());
  const [stamps, setStamps] = useState<ReadonlySet<string>>(new Set());
  const helden = useHelden();
  const telefoon = useSmallScreen();

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
    void loadDiplomas().then(setDiplomas);
    void loadStamps().then(setStamps);
    // The rounds arrive newest first, so the first one placed is the subject
    // the child was last in.
    void loadPlayedRounds().then((rondes) =>
      setVak(geplaatst(rondes, startbareOnderdelen())[0]?.deel.moduleId ?? null),
    );
  }, []);

  // Nothing until it is known. A page that shows an empty collection and then
  // fills it in has told a child they had none.
  if (goed === null || helden === null || vak === undefined) return null;

  const level = levelFor(goed);
  const gekozen = stickerById(sticker);
  const reeks = reeksVan(helden, sticker);
  const gedragen = heldVan(helden, sticker);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-display tk-titel">{t('reis.title')}</h1>

        {/* The nearest reward, beside the hero it is for. Its own name rather
            than the card's in the column: two landmarks with one label is two
            places called the same thing. */}
        <section className="tk-card tk-vg-top" aria-label={t('reis.kistTitel')}>
          <Heldplaat sticker={sticker} reeks={reeks} size={telefoon ? 112 : 152} />

          <div className="tk-vg-top-tekst">
            <div>
              <p className="tk-vg-naam tk-vg-naam-groot">{t(gekozen.name)}</p>
              <p className="tk-reeksnaam" data-reeks={reeks}>
                {reeksRegel(reeks, gedragen?.dubbelen ?? 0)}
              </p>
            </div>

            <Sterren inKist={sterrenInKist(goed)} grootte={32} zin="kort" />
            <p className="tk-display text-sectiekop">{kistZin(goed)}</p>

            <div className="tk-vg-niveau">
              <p className="tk-vg-niveaukop">
                <span>{t('home.journeyLevel', { niveau: level })}</span>
                <span className="font-normal text-tekst-secundair">
                  {t('reis.answered', { aantal: goed })}
                </span>
              </p>
              <span className="tk-reeksbalk tk-reeksbalk-dun" data-reeks={reeks}>
                <ProgressBar
                  value={levelProgress(goed)}
                  showDot={false}
                  label={t('home.journeyBar', { niveau: level + 1 })}
                />
              </span>
              <p className="tk-hulp">{niveauZin(goed)}</p>
            </div>
          </div>

          <div className="tk-vg-top-knop">
            <Button onClick={() => onVerder(vak)}>{verderZin(vak)}</Button>
          </div>
        </section>

        {/* A chest still owed, when there is one: three heroes face up. Absent
            almost every time. */}
        <Kistkeuze kaart />

        {/* The twelve, in their places. A hero this child has is a button that
            makes it the one they wear; one they have not found is a chest, which
            says so and what it costs, and cannot be pressed. */}
        <section className="flex flex-col gap-4" aria-label={t('reis.animals')}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="tk-label">{t('reis.animals')}</h2>
            <p className="text-tekst-secundair">
              {t('home.journeyHave', { aantal: helden.helden.length, totaal: AANTAL_HELDEN })}
            </p>
          </div>

          <div className="tk-heldenraster">
            {STICKERS.map((dier, plek) => {
              const held = helden.helden.find((kandidaat) => kandidaat.plek === plek);

              if (!held) {
                return (
                  <div
                    key={dier.id}
                    className="tk-heldkaart tk-heldkaart-kist"
                    role="img"
                    aria-label={t('reis.heldWantLabel')}
                  >
                    <Heldplaat sticker={dier.id} reeks="brons" size={112} gevonden={false} />
                    <span className="tk-heldkaart-tekst" aria-hidden="true">
                      <span className="tk-heldkaart-naam">{t('reis.heldWant')}</span>
                      <span className="tk-heldkaart-meta">{t('reis.heldPrijs')}</span>
                    </span>
                  </div>
                );
              }

              const draagt = dier.id === gekozen.id;

              return (
                <button
                  key={dier.id}
                  type="button"
                  className="tk-heldkaart"
                  aria-label={t('reis.heldHave', {
                    dier: t(dier.name),
                    reeks: t(`reeks.${held.reeks}` as TranslationKey),
                  })}
                  aria-pressed={draagt}
                  onClick={() => onSticker(dier.id)}
                >
                  <Heldplaat sticker={dier.id} reeks={held.reeks} size={112} />
                  <span className="tk-heldkaart-tekst" aria-hidden="true">
                    <span className="tk-heldkaart-naam">{t(dier.name)}</span>
                    <span className="tk-heldkaart-meta">
                      {reeksRegel(held.reeks, held.dubbelen)}
                    </span>
                    <span className="tk-heldkaart-pil">
                      {draagt ? t('reis.heldDraagt') : t('reis.heldDragen')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="tk-label">{t('reis.regelsTitel')}</h3>
            <ul className="tk-regels">
              {REGELS.map((regel) => (
                <li key={regel}>{t(regel)}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* The twelve diplomas, listed here as well as on the rekenen page.
            There they are a way in to a table; here they are one of the things
            there are to collect. */}
        <section className="flex flex-col gap-3" aria-label={t('rekenen.diplomasTitle')}>
          <div>
            <h2 className="tk-label">{t('rekenen.diplomasTitle')}</h2>
            <p className="text-tekst-secundair">
              {t('rekenen.diplomasCount', { aantal: diplomas.size, totaal: TAFELS.length })}
            </p>
          </div>

          <div className="tk-diplomas">
            {TAFELS.map((tafel) => (
              <span
                key={tafel}
                className="tk-diploma"
                data-gehaald={diplomas.has(tafel) ? 'ja' : undefined}
                role="img"
                aria-label={
                  diplomas.has(tafel)
                    ? t('rekenen.diplomaHave', { tafel })
                    : t('rekenen.diplomaWant', { tafel })
                }
              >
                <DiplomaIcon size={24} />
                <span aria-hidden="true" className="tabular-nums">
                  {tafel}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* The six vlaggendiploma's, as the twelve tafeldiploma's above: on the
            flags page a way in, here one of the things there are (ADR-104). */}
        <VlagDiplomas />

        {/* The ten stamps, with the criterion beside every one of them — a child
            who cannot say what earned it cannot earn another one on purpose. */}
        <section className="flex flex-col gap-3" aria-label={t('reis.stamps')}>
          <div>
            <h2 className="tk-label">{t('reis.stamps')}</h2>
            <p className="text-tekst-secundair">
              {t('reis.stampsHave', {
                aantal: STAMPS.filter((stamp) => stamps.has(stamp.id)).length,
                totaal: STAMPS.length,
              })}
            </p>
          </div>

          <ul className="tk-stamps">
            {STAMPS.map((stamp) => {
              const behaald = stamps.has(stamp.id);

              return (
                <li key={stamp.id} className="tk-stamp" data-gehaald={behaald ? 'ja' : undefined}>
                  <StampIcon size={24} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t(STAMP_NAME[stamp.id])}</span>
                    <span className="block text-tekst-secundair">
                      {t(`${STAMP_NAME[stamp.id]}.criterion` as TranslationKey)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {aside}
    </div>
  );
}
