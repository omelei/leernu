import { Heldplaat } from '@/components/Heldplaat';
import { MysteryIcon, StarIcon } from '@/components/Icon';
import { STICKERS } from '@/components/stickerSet';
import {
  DUBBELEN_PER_REEKS,
  STERREN_PER_KIST,
  volgendeReeks,
  type KistUitkomst,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import type { RoundOutcome } from '@/store/rewardStore';

/**
 * What a round earned, on the screen at the end of it (ADR-096).
 *
 * The stars it added and how full the next chest is; and when a chest opened,
 * what came out of it — a new hero, a duplicate towards the next reeks, or a
 * hero going up. The chest opens the way the parcel always has (ADR-084): the
 * wrapping goes and the hero is there, and where a reader has asked for less
 * movement the hero is simply there.
 *
 * Absent when the round earned nothing, which is most short rounds. What it
 * never says is "well done": the product says what happened, not what to feel
 * about it. And it never says what is in the next chest, because that is the
 * one thing nobody knows.
 */
export function Beloning({ reward }: { readonly reward: RoundOutcome | null }) {
  if (reward === null) return null;

  const { sterren, kisten } = reward;
  if (sterren.erbij === 0 && kisten.length === 0) return null;

  const kop =
    kisten.length === 1
      ? t('result.kistEen')
      : kisten.length > 1
        ? t('result.kistVeel', { aantal: kisten.length })
        : sterren.erbij === 1
          ? t('result.sterEen')
          : t('result.sterVeel', { aantal: sterren.erbij });

  return (
    <section className="tk-card flex flex-col gap-4" aria-label={t('result.beloningTitle')}>
      <h2 className="tk-display text-h2 font-bold">{kop}</h2>

      {kisten.length > 0 ? (
        <ul className="tk-unwraps">
          {kisten.map((kist, volgorde) => (
            <KistRij key={volgorde} kist={kist} />
          ))}
        </ul>
      ) : null}

      <Sterren inKist={sterren.inKist} />
    </section>
  );
}

/**
 * Five stars, as many filled as the next chest has. Drawn in gold because it is
 * a reward, and hidden from the accessibility tree because the sentence beside
 * it says the same thing in words.
 */
export function Sterren({ inKist }: { readonly inKist: number }) {
  return (
    <p className="tk-sterren">
      <span className="tk-sterren-rij" aria-hidden="true">
        {Array.from({ length: STERREN_PER_KIST }, (_, ster) => (
          <span key={ster} className={ster < inKist ? 'tk-ster tk-ster-vol' : 'tk-ster'}>
            <StarIcon size={24} />
          </span>
        ))}
      </span>
      <span>{t('result.sterStand', { aantal: inKist, totaal: STERREN_PER_KIST })}</span>
    </p>
  );
}

/** One chest: the wrapping going, the hero arriving, and a sentence about which. */
function KistRij({ kist }: { readonly kist: KistUitkomst }) {
  const dier = STICKERS[kist.plek];
  if (!dier) return null;

  const held = t(dier.name);
  const reeks = t(`reeks.${kist.reeks}` as TranslationKey);
  const volgende = volgendeReeks(kist.reeks) ?? kist.reeks;

  const zin =
    kist.soort === 'nieuw'
      ? t('result.heldNieuw', { held, reeks })
      : kist.soort === 'hoger'
        ? t('result.heldHoger', { held, reeks })
        : kist.soort === 'dubbel'
          ? t('result.heldDubbel', {
              held,
              aantal: kist.dubbelen,
              totaal: DUBBELEN_PER_REEKS,
              reeks: t(`reeks.${volgende}` as TranslationKey),
            })
          : t('result.heldVol', { held });

  return (
    <li className="tk-unwrap-row" data-reeks={kist.reeks}>
      {/* The chest goes, the hero arrives. Both are decorative: the sentence
          beside them says which hero and which reeks in words. */}
      <span className="tk-unwrap" aria-hidden="true">
        <span className="tk-unwrap-parcel">
          <MysteryIcon size={56} />
        </span>
        <span className="tk-unwrap-dier">
          <Heldplaat sticker={dier.id} reeks={kist.reeks} size={60} />
        </span>
      </span>

      <span className="tk-display text-h3 font-semibold">{zin}</span>
    </li>
  );
}
