import { useEffect, useState, type ReactNode } from 'react';
import { DiplomaIcon, StampIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { STICKERS, stickerById } from '@/components/stickerSet';
import {
  correctToNextLevel,
  earnedAt,
  isEarned,
  levelFor,
  levelForEarned,
  levelProgress,
  nextPlek,
  PER_REEKS,
  REEKSEN,
  STAMPS,
  COLLECTION_SIZE,
  type Reeks,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy } from '@/store/progress';
import { loadDiplomas, loadStamps } from '@/store/rewardStore';
import { STAMP_NAME } from './stampNames';

/** One to twelve, which is every table the product has a diploma for. */
const TAFELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * The whole of what a child has collected, and the whole of what is left.
 *
 * The card in the right-hand column says where the journey is; this is the
 * journey. It exists because that card could only ever show one thing at a
 * time — the animal you have and the one arriving next — and a child who wants
 * to know *what else is there* had nowhere to look (ADR-076).
 *
 * Three things are collectable and all three are here, in the order of how
 * long they take. The **animals** are a ladder of sixty, one per level, in
 * five materials. The **tafeldiploma's** are twelve, each one a table you can
 * sit today. The **reisstempels** are ten, each with its criterion written
 * next to it — a reward nobody can explain is a riddle.
 *
 * Everything not yet earned is shown rather than hidden, and every one of them
 * says what it costs. That is the difference between a collection and a
 * mystery, and it is the same argument the diploma wall makes on the rekenen
 * page: a gap a child can aim at is worth more than a surprise.
 *
 * **It never says when.** No dates, no "kom morgen terug", no counter that
 * moves by waiting. Everything on this page is bought with correct answers and
 * nothing else, which is the promise ADR-067 makes and the one thing this page
 * could quietly break.
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

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
    void loadDiplomas().then(setDiplomas);
    void loadStamps().then(setStamps);
  }, []);

  // Nothing until it is known. A page that shows an empty collection and then
  // fills it in has told a child they had none.
  if (goed === null) return null;

  const level = levelFor(goed);
  const volgende = nextPlek(level);
  const teGaan = correctToNextLevel(goed);
  const gekozen = stickerById(sticker);

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <div>
          <h1 className="tk-display text-h1 font-semibold">{t('reis.title')}</h1>
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

        {/* The sixty, five rows of twelve. The row a child is filling is the
            one with a gap in it, and the rows above it are done — which is
            what makes a material worth reaching rather than a decoration. */}
        <section className="flex flex-col gap-4" aria-label={t('reis.animals')}>
          <div>
            <h2 className="tk-label">{t('reis.animals')}</h2>
            <p className="text-ink-2">
              {t('reis.animalsHave', { aantal: earnedAt(level), totaal: COLLECTION_SIZE })}
            </p>
          </div>

          {REEKSEN.map((reeks) => (
            <Rij
              key={reeks}
              reeks={reeks}
              level={level}
              chosen={gekozen.id}
              volgend={volgende !== null && volgende.reeks === reeks ? volgende.plek : null}
              onChoose={onSticker}
            />
          ))}
        </section>

        {/* The twelve diplomas, listed here as well as on the rekenen page.
            Not a copy of that wall: there they are a way in to a table, here
            they are one of three things there are to collect. */}
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

        {/* The ten stamps, with the criterion beside every one of them — the
            ones already earned as well as the ones not, because a child who
            cannot say what earned it cannot earn another one on purpose. */}
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

/**
 * One material's twelve.
 *
 * The animals a child has are buttons — pressing one makes it theirs, which is
 * where the picking lives now that there are sixty of them. The ones they have
 * not are not buttons at all: a disabled control is a question a child has to
 * ask somebody about, and a drawing with a level under it answers it.
 */
function Rij({
  reeks,
  level,
  chosen,
  volgend,
  onChoose,
}: {
  readonly reeks: Reeks;
  readonly level: number;
  readonly chosen: string;
  /** Which place in this row arrives next, when it is in this row. */
  readonly volgend: number | null;
  readonly onChoose: (id: string) => void;
}) {
  const naam = t(`reeks.${reeks}` as TranslationKey);
  const held = STICKERS.filter((_, plek) => isEarned(level, { reeks, plek })).length;

  return (
    <div className="flex flex-col gap-2">
      <p className="tk-label">
        {t('reis.reeksHave', { reeks: naam, aantal: held, totaal: PER_REEKS })}
      </p>

      <div className="tk-animals" data-reeks={reeks}>
        {STICKERS.map((sticker, plek) => {
          const Draw = sticker.draw;
          const open = isEarned(level, { reeks, plek });
          // Only the ink row can be worn: it is the one whose drawings are the
          // avatar in the app bar, and an avatar that changed material would
          // need a second drawing in every place the first one is used.
          const kiesbaar = open && reeks === 'inkt';

          // Which level hands this one out: its place in the whole sixty,
          // counted from one.
          const opNiveau = levelForEarned(REEKSEN.indexOf(reeks) * PER_REEKS + plek + 1);

          if (!kiesbaar) {
            return (
              <span
                key={`${reeks}-${sticker.id}`}
                className="tk-animal"
                data-open={open ? 'ja' : undefined}
                data-next={volgend === plek ? 'ja' : undefined}
                // A drawing with a caption under it, which is what an image is.
                // Without a role, `aria-label` on a span is prohibited and is
                // dropped on the floor — the cell would have been announced as
                // its two words of visible text and nothing else.
                role="img"
                aria-label={
                  open
                    ? t('reis.animalHave', { dier: t(sticker.name), reeks: naam })
                    : t('reis.animalWant', { dier: t(sticker.name), reeks: naam, niveau: opNiveau })
                }
              >
                <Draw size={28} />
                {/* What it costs, not "nog niet". Nine cells saying the same
                    two words tell a child nothing; nine saying niveau 4, 5, 6
                    are a ladder they can read off the page. */}
                <span aria-hidden="true" className="tk-animal-name">
                  {open ? t(sticker.name) : t('reis.lockedLevel', { niveau: opNiveau })}
                </span>
              </span>
            );
          }

          return (
            <button
              key={`${reeks}-${sticker.id}`}
              type="button"
              className="tk-animal"
              data-open="ja"
              aria-label={t(sticker.name)}
              aria-pressed={sticker.id === chosen}
              onClick={() => onChoose(sticker.id)}
            >
              <Draw size={28} />
              <span aria-hidden="true" className="tk-animal-name">
                {t(sticker.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
