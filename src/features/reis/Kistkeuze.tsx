import { useCallback, useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { MysteryIcon } from '@/components/Icon';
import { STICKERS } from '@/components/stickerSet';
import {
  aanbod,
  DUBBELEN_PER_REEKS,
  volgendeReeks,
  vorigeReeks,
  watKistDoet,
  type HeldenStand,
  type KistUitkomst,
} from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { kiesHeld, kistenOpenstaand, loadHelden } from '@/store/heldenStore';

/**
 * A chest, opened where the work was done (ADR-084, ADR-097).
 *
 * Three heroes face up, and the child turns one over. While any of the twelve
 * is missing all three are heroes they do not have, so there is no wrong card
 * and no wasted chest — what the choice changes is when a hero arrives, never
 * whether. Once the twelve are held the three are heroes that can still climb,
 * and choosing is deciding who does.
 *
 * Each card says what it would do before it is pressed. Three cards that do not
 * say what they are is not a choice, it is three buttons.
 *
 * It is on the screen after a round, where the answers were given, and on the
 * collection page, so a chest earned by a round that was closed too early is
 * never stranded. Both render the same component and both read the same row.
 *
 * Absent almost every time: fifty correct answers buy one.
 */
export function Kistkeuze({
  kaart = false,
}: {
  /**
   * On its own on /voortgang, where it is a card of its own under the top of
   * the page. On the result screen it sits inside the reward card instead.
   */
  readonly kaart?: boolean;
} = {}) {
  const [stand, setStand] = useState<HeldenStand | null>(null);
  const [teGaan, setTeGaan] = useState<number | null>(null);
  const [gedaan, setGedaan] = useState<readonly KistUitkomst[]>([]);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    let afgebroken = false;

    void (async () => {
      const [nu, open] = await Promise.all([loadHelden(), kistenOpenstaand()]);
      if (afgebroken) return;
      setStand(nu);
      setTeGaan(open);
    })();

    return () => {
      afgebroken = true;
    };
  }, []);

  const kies = useCallback(
    async (plek: number) => {
      // One press per chest. A second one while the first is still being
      // written would spend a chest that is no longer owed.
      if (bezig) return;
      setBezig(true);

      const uitkomst = await kiesHeld(plek);
      if (uitkomst !== null) {
        setGedaan((eerder) => [...eerder, uitkomst]);
        setStand(await loadHelden());
        setTeGaan(await kistenOpenstaand());
      }

      setBezig(false);
    },
    [bezig],
  );

  // Nothing until the row is read: three cards that appear and then change are
  // three cards a child may have already decided between.
  if (stand === null || teGaan === null) return null;
  if (teGaan === 0 && gedaan.length === 0) return null;

  const drie = aanbod(stand);
  // A card of its own on a page whose sections are h2; inside the reward card,
  // under that card's own h2.
  const Kop = kaart ? 'h2' : 'h3';

  const inhoud = (
    <>
      {gedaan.length > 0 ? (
        <ul className="tk-unwraps">
          {gedaan.map((kist) => (
            <KistRij key={kist.kist} kist={kist} />
          ))}
        </ul>
      ) : null}

      {teGaan > 0 && drie.length > 0 ? (
        <div className="flex flex-col gap-3">
          <Kop className="tk-label">
            {teGaan === 1 ? t('kist.kiesTitel') : t('kist.kiesTitelVeel', { aantal: teGaan })}
          </Kop>

          <div className="tk-helden">
            {drie.map((plek) => (
              <Kaart key={plek} stand={stand} plek={plek} bezig={bezig} onKies={kies} />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );

  return kaart ? (
    <section className="tk-card flex flex-col gap-4" aria-label={t('kist.titel')}>
      {inhoud}
    </section>
  ) : (
    inhoud
  );
}

/** One of the three on offer, with what pressing it would do written on it. */
function Kaart({
  stand,
  plek,
  bezig,
  onKies,
}: {
  readonly stand: HeldenStand;
  readonly plek: number;
  readonly bezig: boolean;
  readonly onKies: (plek: number) => void;
}) {
  const dier = STICKERS[plek];
  if (!dier) return null;

  const straks = watKistDoet(stand, plek);
  const held = t(dier.name);
  const reeks = t(`reeks.${straks.reeks}` as TranslationKey);

  // A duplicate does not change the reeks a hero stands in, it counts towards
  // the next one — so that is the reeks the card has to name, or the card is
  // telling a child what they already have.
  const naar = t(`reeks.${volgendeReeks(straks.reeks) ?? straks.reeks}` as TranslationKey);

  const wat =
    straks.soort === 'nieuw'
      ? t('kist.kaartNieuw', { held, reeks })
      : straks.soort === 'hoger'
        ? t('kist.kaartHoger', { held, reeks })
        : t('kist.kaartDubbel', {
            held,
            aantal: straks.dubbelen,
            totaal: DUBBELEN_PER_REEKS,
            reeks: naar,
          });

  const onder =
    straks.soort === 'nieuw'
      ? reeks
      : straks.soort === 'hoger'
        ? t('kist.kaartKort', { reeks })
        : t('reis.heldDubbel', {
            reeks: naar,
            aantal: straks.dubbelen,
            totaal: DUBBELEN_PER_REEKS,
          });

  return (
    <button
      type="button"
      className="tk-held-cel"
      disabled={bezig}
      aria-label={wat}
      onClick={() => onKies(plek)}
    >
      {/* Large enough for the rings, so a card that moves a hero up shows the
          reeks it would stand in by count as well as by tone. */}
      <Heldplaat sticker={dier.id} reeks={straks.reeks} size={76} />
      <span aria-hidden="true" className="tk-held-naam">
        {held}
      </span>
      <span aria-hidden="true" className="tk-reeksnaam" data-reeks={straks.reeks}>
        {onder}
      </span>
    </button>
  );
}

/** One chest that has been opened: the wrapping going, the hero arriving. */
function KistRij({ kist }: { readonly kist: KistUitkomst }) {
  const dier = STICKERS[kist.plek];
  if (!dier) return null;

  const held = t(dier.name);
  const reeks = t(`reeks.${kist.reeks}` as TranslationKey);
  const vorige = t(`reeks.${vorigeReeks(kist.reeks) ?? kist.reeks}` as TranslationKey);
  // A duplicate counts towards the reeks above the one the hero is in.
  const naar = t(`reeks.${volgendeReeks(kist.reeks) ?? kist.reeks}` as TranslationKey);

  const zin =
    kist.soort === 'nieuw'
      ? t('result.heldNieuw', { held, reeks, kist: kist.kist })
      : kist.soort === 'hoger'
        ? t('result.heldHoger', { held, vorige, reeks, kist: kist.kist })
        : kist.soort === 'dubbel'
          ? t('result.heldDubbel', {
              held,
              aantal: kist.dubbelen,
              totaal: DUBBELEN_PER_REEKS,
              reeks: naar,
              kist: kist.kist,
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

      <span className="tk-display text-kaartkop font-semibold">{zin}</span>
    </li>
  );
}
