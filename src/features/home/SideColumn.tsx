import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Dot } from '@/components/Dot';
import type { IconProps } from '@/components/Icon';
import { STICKERS, stickerById } from '@/components/stickerSet';
import type { ModeId } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { t, type TranslationKey } from '@/i18n';
import { loadAccuracy, loadPlayedRounds } from '@/store/progress';
import type { Accuracy } from '@/store/progress';
import {
  favorieten,
  geplaatst,
  naamVan,
  onderdelen,
  type Gespeeld,
  type Onderdeel,
} from '@/features/module/onderdelen';

/**
 * The child's own column: how the whole of it is going, where they keep going
 * back to, and the animal they picked.
 *
 * It was inside `HomeScreen` and it is out here because it is no longer the
 * front door's alone — a module page carries the same three blocks, in the same
 * order, on the same side. That is a decision about the product rather than
 * about layout: this column is what the app knows about the child, and what the
 * app knows about the child does not change when they walk into topography.
 *
 * It reads what it needs itself, so it can be dropped on any screen inside the
 * shell without that screen having to know what is in it.
 *
 * "Samen met" belongs at the foot of it. It is three friends, and there are
 * none until ADR-050's backend, so it is absent rather than empty.
 */
export function SideColumn({
  sticker,
  onSticker,
  onBegin,
}: {
  readonly sticker: string | undefined;
  readonly onSticker: (id: string) => void;
  readonly onBegin: (deel: Onderdeel, mode: ModeId) => void;
}) {
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[]>([]);

  useEffect(() => {
    void loadAccuracy().then(setAccuracy);
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, onderdelen())));
  }, []);

  return (
    <aside className="tk-home-aside">
      <Goed accuracy={accuracy} />
      <Favorieten gespeeld={gespeeld} onBegin={onBegin} />
      <Stickerkaart chosen={sticker} onChoose={onSticker} />
    </aside>
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
function Goed({ accuracy }: { readonly accuracy: Accuracy | null }) {
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

/**
 * The sticker, which is the one thing in this column a child chooses.
 *
 * It takes the place of the reisstempels in this corner. Those still exist and
 * are still awarded at the end of a round; what they are not any more is the
 * view from a child's own front door, because a shelf of things you have not
 * got yet is a poor thing to be shown every morning.
 *
 * Nothing here is locked. All six from the first day — the moment one has to be
 * earned this stops being a choice and becomes a scoreboard with animals on it.
 */
function Stickerkaart({
  chosen,
  onChoose,
}: {
  readonly chosen: string | undefined;
  readonly onChoose: (id: string) => void;
}) {
  const current = stickerById(chosen);
  const Big = current.draw;

  return (
    <section className="tk-card flex flex-col gap-3" aria-label={t('home.stickersTitle')}>
      <h2 className="tk-label">{t('home.stickersTitle')}</h2>

      <div className="flex items-center gap-4">
        {/* Decorative: the name is beside it, and the row underneath names all
            six. Hearing the animal three times is worse than hearing it once. */}
        <span className="tk-sticker-big">
          <Big size={56} />
        </span>
        <div className="min-w-0">
          <p className="tk-display text-h3 font-semibold">{t(current.name)}</p>
          <p className="text-ink-2">{t('home.stickersPick')}</p>
        </div>
      </div>

      {/* Three across and two down, rather than a row that fits five of six in
          a column of 320. Six equal squares read as a set; five and a straggler
          read as a mistake. */}
      <div className="tk-sticker-row">
        {STICKERS.map((sticker) => {
          const Draw = sticker.draw;

          return (
            // The name is on the button and not on the drawing inside it. A
            // <title> in an SVG is an accessible name in Chromium and is not
            // one in WebKit, which is where these are read out loud: axe called
            // all six of them buttons with no discernible text, on the browser
            // an iPad in a classroom runs.
            <button
              key={sticker.id}
              type="button"
              className="tk-sticker"
              aria-label={t(sticker.name)}
              aria-pressed={sticker.id === current.id}
              onClick={() => onChoose(sticker.id)}
            >
              <Draw size={28} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
