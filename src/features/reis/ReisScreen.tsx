import { useEffect, useState, type ReactNode } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { DiplomaIcon, MysteryIcon, StampIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { STICKERS, stickerById } from '@/components/stickerSet';
import {
  AANTAL_HELDEN,
  correctToNextLevel,
  DUBBELEN_PER_REEKS,
  goedTotKist,
  levelFor,
  levelProgress,
  sterrenInKist,
  STAMPS,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy } from '@/store/progress';
import { loadDiplomas, loadStamps } from '@/store/rewardStore';
import { Sterren } from './Beloning';
import { STAMP_NAME } from './stampNames';
import { useHelden } from './useHelden';

/** One to twelve, which is every table the product has a diploma for. */
const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** The rules of the chests, in the order a child needs them. */
const REGELS = ['reis.regel1', 'reis.regel2', 'reis.regel3', 'reis.regel4'] as const;

/**
 * The whole of what a child has collected, and how the rest arrives.
 *
 * The card in the right-hand column says where the journey is; this is the
 * journey (ADR-076). Since ADR-096 it holds the level, the stars towards the
 * next chest, the twelve heroes — each in its own reeks, the unfound ones as
 * chests — and the diplomas and the stamps, which are unchanged.
 *
 * **The rules are written out, here.** Which hero is in a chest is chance, and
 * the one thing a product owes a child about a chance is to say plainly how it
 * works: ten answers a star, five stars a chest, every hero equally likely,
 * three duplicates up a reeks, and nothing to buy and nothing for waiting.
 *
 * **It never says when.** No dates, no "kom morgen terug", no counter that moves
 * by waiting. Everything on this page is bought with correct answers.
 */
export function ReisScreen({
  sticker,
  onSticker,
  aside,
}: {
  readonly sticker: string | undefined;
  readonly onSticker: (id: string) => void;
  readonly aside: ReactNode;
}) {
  const [goed, setGoed] = useState<number | null>(null);
  const [diplomas, setDiplomas] = useState<ReadonlySet<number>>(new Set());
  const [stamps, setStamps] = useState<ReadonlySet<string>>(new Set());
  const helden = useHelden();

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
    void loadDiplomas().then(setDiplomas);
    void loadStamps().then(setStamps);
  }, []);

  // Nothing until it is known. A page that shows an empty collection and then
  // fills it in has told a child they had none.
  if (goed === null || helden === null) return null;

  const level = levelFor(goed);
  const teGaan = correctToNextLevel(goed);
  const gekozen = stickerById(sticker);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div>
          <h1 className="tk-display tk-titel font-semibold">{t('reis.title')}</h1>
          <p className="mt-1 text-ink-2">{t('reis.intro')}</p>
        </div>

        {/* Its own name rather than the card's in the column beside it: two
            landmarks with one label is two places called the same thing. */}
        <section className="tk-card flex flex-col gap-3" aria-label={t('reis.level')}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="tk-display text-h2 font-bold">
              {t('home.journeyLevel', { niveau: level })}
            </p>
            <p className="text-ink-2">{t('reis.answered', { aantal: goed })}</p>
          </div>

          <ProgressBar
            value={levelProgress(goed)}
            showDot={false}
            label={t('home.journeyBar', { niveau: level + 1 })}
          />

          <p className="text-body">
            {teGaan === 1
              ? t('home.journeyOneToGo', { niveau: level + 1 })
              : t('home.journeyToGo', { aantal: teGaan, niveau: level + 1 })}
          </p>
        </section>

        {/* The stars towards the next chest, and what is still to go. */}
        <section className="tk-card flex flex-col gap-3" aria-label={t('reis.sterrenTitel')}>
          <h2 className="tk-label">{t('reis.sterrenTitel')}</h2>
          <Sterren inKist={sterrenInKist(goed)} />
          <p className="text-ink-2">{t('reis.totKist', { aantal: goedTotKist(goed) })}</p>
        </section>

        {/* The twelve, in the order they are drawn. A hero this child has is a
            button that makes it the one they wear; one they have not found is a
            chest, which says so and cannot be pressed. */}
        <section className="flex flex-col gap-4" aria-label={t('reis.animals')}>
          <div>
            <h2 className="tk-label">{t('reis.animals')}</h2>
            <p className="text-ink-2">
              {t('reis.animalsHave', { aantal: helden.helden.length, totaal: AANTAL_HELDEN })}
            </p>
          </div>

          <div className="tk-helden">
            {STICKERS.map((dier, plek) => {
              const held = helden.helden.find((kandidaat) => kandidaat.plek === plek);

              if (!held) {
                return (
                  <span
                    key={dier.id}
                    className="tk-held-cel"
                    role="img"
                    aria-label={t('reis.heldWant')}
                  >
                    <span className="tk-held-pakje">
                      <MysteryIcon size={28} />
                    </span>
                    <span aria-hidden="true" className="tk-held-naam">
                      {t('reis.heldWant')}
                    </span>
                  </span>
                );
              }

              const reeks = t(`reeks.${held.reeks}` as TranslationKey);

              return (
                <button
                  key={dier.id}
                  type="button"
                  className="tk-held-cel"
                  aria-label={t('reis.heldHave', { dier: t(dier.name), reeks })}
                  aria-pressed={dier.id === gekozen.id}
                  onClick={() => onSticker(dier.id)}
                >
                  <Heldplaat sticker={dier.id} reeks={held.reeks} size={48} />
                  <span aria-hidden="true" className="tk-held-naam">
                    {t(dier.name)}
                  </span>
                  <span aria-hidden="true" className="tk-reeksnaam" data-reeks={held.reeks}>
                    {held.dubbelen > 0
                      ? t('reis.heldDubbel', {
                          reeks,
                          aantal: held.dubbelen,
                          totaal: DUBBELEN_PER_REEKS,
                        })
                      : reeks}
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
            <p className="text-ink-2">
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

        {/* The ten stamps, with the criterion beside every one of them — a child
            who cannot say what earned it cannot earn another one on purpose. */}
        <section className="flex flex-col gap-3" aria-label={t('reis.stamps')}>
          <div>
            <h2 className="tk-label">{t('reis.stamps')}</h2>
            <p className="text-ink-2">
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
                    <span className="block text-ink-2">
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
