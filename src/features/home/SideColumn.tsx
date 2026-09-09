import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Dot } from '@/components/Dot';
import type { IconProps } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { stickerById } from '@/components/stickerSet';
import { MysteryIcon, NextIcon, RankIcon } from '@/components/Icon';
import {
  correctToNextLevel,
  earnedAt,
  huidigeReeks,
  levelFor,
  levelProgress,
  nextPlek,
  COLLECTION_SIZE,
  type FlawlessRun,
  type ModeId,
} from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
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

/**
 * The child's own column: how far along the journey is, how the whole of it is
 * going, and where they keep going back to.
 *
 * It was inside `HomeScreen` and it is out here because it is no longer the
 * front door's alone — a module page carries the same blocks, in the same
 * order, on the same side. That is a decision about the product rather than
 * about layout: this column is what the app knows about the child, and what the
 * app knows about the child does not change when they walk into topography.
 *
 * It reads what it needs itself, so it can be dropped on any screen inside the
 * shell without that screen having to know what is in it.
 *
 * **The journey is first, above the figures.** It replaces the sticker picker,
 * which was six animals to choose between and nothing else, and which sat under
 * two numbers about how a child was doing. What is at the top of a child's own
 * column should be the thing that says where they are going, not the thing that
 * reports on where they have been (ADR-067). The picking itself moved to
 * "Jij", where the rest of what a child owns already lives.
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
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[]>([]);
  const [run, setRun] = useState<FlawlessRun | null>(null);

  useEffect(() => {
    void loadAccuracy().then(setAccuracy);
    void loadRun().then(setRun);
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, startbareOnderdelen())));
  }, []);

  return (
    <aside className="tk-home-aside">
      <Reis goed={accuracy?.correct ?? null} sticker={sticker} onReis={onReis} />
      <Goed accuracy={accuracy} run={run} />
      <Favorieten gespeeld={gespeeld} onBegin={onBegin} />
    </aside>
  );
}

/**
 * Progress: which level, which rung of the ladder, and what is still wrapped up.
 *
 * Everything on this card is worked out from one number the product has been
 * keeping since the first release and has never once shown: ten XP for a
 * correct answer, five more for each answer given while five in a row were
 * already right. A level was computed, a curve was tuned, and a child could
 * see none of it (ADR-065).
 *
 * The line that matters is the middle one. "Nog 340 XP" is a currency nobody
 * counts in; **"nog 6 goede antwoorden"** is a thing a child can decide to do
 * this afternoon, and it is exact rather than rounded — a combo can only make
 * it arrive sooner.
 *
 * What it never says is how many days, how long, or how often. Nothing here
 * moves by waiting, and a card that mentioned time would be inviting a child
 * to come back for the coming back rather than for the work.
 */
function Reis({
  goed,
  sticker,
  onReis,
}: {
  /** Correct answers over everything, ever. What the ladder runs on. */
  readonly goed: number | null;
  readonly sticker: string | undefined;
  readonly onReis: () => void;
}) {
  // Nothing until it is known. A card that says level one and then changes its
  // mind has told a child something about themselves that was not true.
  if (goed === null) return null;

  const level = levelFor(goed);
  // Theirs, not the newest one the ladder handed out. Three arrive at level one
  // and a child picks between them; drawing whichever the list happens to end
  // on would be this card telling them they are somebody else.
  const nu = stickerById(sticker);
  const reeks = huidigeReeks(level);
  const volgende = nextPlek(level);
  const teGaan = correctToNextLevel(goed);
  const Nu = nu.draw;

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.journeyTitle')}>
      <h2 className="tk-label">{t('home.journeyTitle')}</h2>

      <div className="flex items-center gap-4">
        {/* Decorative: the level and the animal's name are both beside it. */}
        <span className="tk-sticker-big">
          <Nu size={56} />
        </span>
        <div className="min-w-0">
          {/* Not the score size the fraction below it uses: "Niveau 1" is two
              words in a 320 column beside a 72px animal, and at that size it
              broke mid-word — "Nivea / u 1". A number that has to be read as a
              word is not a number that gets the biggest type on the page. */}
          <p className="tk-display text-h2 font-bold">
            {t('home.journeyLevel', { niveau: level })}
          </p>
          <p className="text-ink-2">
            {t('home.journeyHave', { aantal: earnedAt(level), totaal: COLLECTION_SIZE })}
          </p>
        </div>
      </div>

      {/* Which rung of the ladder this is, as the chevrons every game a child
          plays uses for a tier, in that material's own colour. The word is
          beside it and not instead of it: §A never lets a colour carry a
          meaning on its own, and "platina" is also the half a child says out
          loud to a friend. */}
      <p className="tk-reeks" data-reeks={reeks}>
        <RankIcon size={20} />
        <span className="tk-reeks-name">{t(`reeks.${reeks}` as TranslationKey)}</span>
      </p>

      <ProgressBar
        value={levelProgress(goed)}
        showDot={false}
        label={t('home.journeyBar', { niveau: level + 1 })}
      />

      {volgende === null ? (
        <p className="text-ink-2">{t('home.journeyComplete')}</p>
      ) : (
        <>
          <p className="text-body">
            {teGaan === 1
              ? t('home.journeyOneToGo', { niveau: level + 1 })
              : t('home.journeyToGo', { aantal: teGaan, niveau: level + 1 })}
          </p>

          {/* What is coming, wrapped. It used to name the animal — "Hierna: vos
              in zwart" — which is a ladder with the answers printed on it: by
              the time a child got there they had known for a week what it was.
              A parcel in the next material's colour says exactly as much as a
              child needs to aim at it, and not one word more (ADR-081).

              The parcel is a drawing and the sentence beside it is the label,
              so the two together are one line rather than two things saying
              the same thing twice. */}
          <p className="flex items-center gap-3 text-ink-2">
            <span className="tk-sticker-next" data-reeks={volgende.reeks} aria-hidden="true">
              <MysteryIcon size={28} />
            </span>
            {t('home.journeyNext', {
              reeks: t(`reeks.${volgende.reeks}` as TranslationKey),
            })}
          </p>
        </>
      )}

      {/* The way to the whole of it. The card can only ever show the animal a
          child has and the parcel arriving next; sixty of them, twelve diplomas
          and ten stamps need a page (ADR-076). */}
      <button type="button" className="tk-card-link" onClick={onReis}>
        {t('home.journeyAll')}
        <NextIcon size={20} />
      </button>
    </section>
  );
}

/**
 * Everything answered, ever, as one fraction.
 *
 * Deliberately not a retention figure, and worded so the two cannot be
 * confused: this is what has been answered correctly, over every round there
 * has been. It moves slowly, it never resets, and it is the only number in this
 * column about the whole of the work rather than about this week.
 */
function Goed({
  accuracy,
  run,
}: {
  readonly accuracy: Accuracy | null;
  readonly run: FlawlessRun | null;
}) {
  // Nothing until it is known. A card that says nought percent and then changes
  // its mind has told a child something about themselves that was not true.
  if (accuracy === null) return null;

  const procent =
    accuracy.answered === 0 ? 0 : Math.round((accuracy.correct / accuracy.answered) * 100);

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.accuracyTitle')}>
      <h2 className="tk-label">{t('home.accuracyTitle')}</h2>

      {accuracy.answered === 0 ? (
        <p className="text-ink-2">{t('home.accuracyNone')}</p>
      ) : (
        <div className="flex items-center gap-4">
          <Dot size={64} fill={procent / 100} />
          <div className="min-w-0">
            <p className="tk-display text-score font-bold tabular-nums">{`${procent}%`}</p>
            <p className="text-ink-2">
              {t('home.accuracyOf', { goed: accuracy.correct, totaal: accuracy.answered })}
            </p>
          </div>
        </div>
      )}

      {/* The other streak: correct answers in a row, with no day in it. Under
          the fraction and not above it, because it is the one number in this
          product a single wrong answer takes away, and a child should meet the
          slow one first (ADR-072). Absent until there is a run to report. */}
      {run !== null && run.beste > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-3 border-t border-line pt-3">
          <span className="tk-label">{t('home.runLabel')}</span>
          <span className="tk-display font-bold tabular-nums">{run.nu}</span>
          <span className="text-ink-2">{t('home.runBest', { aantal: run.beste })}</span>
        </p>
      ) : null}
    </section>
  );
}

/** Where a child keeps going back to, one press away. */
function Favorieten({
  gespeeld,
  onBegin,
}: {
  readonly gespeeld: readonly Gespeeld[];
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const lijst = favorieten(gespeeld);

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.favouritesTitle')}>
      <h2 className="tk-label">{t('home.favouritesTitle')}</h2>

      {lijst.length === 0 ? (
        <p className="text-ink-2">{t('home.favouritesNone')}</p>
      ) : (
        <ul className="flex flex-col gap-2 p-0">
          {lijst.map((favoriet) => {
            const ModuleIcon: ComponentType<Omit<IconProps, 'children'>> =
              MODULE_ICON[favoriet.deel.moduleId];

            return (
              <li key={`${favoriet.deel.setId}-${favoriet.mode}`}>
                <button
                  type="button"
                  data-module={favoriet.deel.moduleId}
                  className="tk-favourite"
                  onClick={() => onBegin(favoriet.deel, favoriet.mode)}
                >
                  <ModuleIcon size={24} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{naamVan(favoriet.deel)}</span>
                    <span className="block truncate text-ink-2">
                      {t(`mode.${favoriet.mode}` as TranslationKey)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
