import { useCallback, useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import {
  HeldTegel,
  Kaart,
  KistTegel,
  LegePlek,
  Materialen,
  PaginaKop,
  SectieKop,
  materiaalNaam,
} from '@/components/ds';
import { STICKERS, stickerById } from '@/components/stickerSet';
import {
  AANTAL_HELDEN,
  aanbod,
  DUBBELEN_PER_REEKS,
  goedTotKist,
  volgendeReeks,
  watKistDoet,
  type HeldenStand,
  type KistUitkomst,
} from '@/game-core';
import { t } from '@/i18n';
import { kiesHeld, kistenOpenstaand, loadHelden } from '@/store/heldenStore';
import { loadAccuracy } from '@/store/progress';

/**
 * Verzameling (S11): the twelve heroes, and the five materials they come in.
 *
 * The other side of the line: the one page with volume, where a hero and a
 * chest stand on their card with a shadow of their own. A place, so the
 * heading is display, and its one meta line says how many heroes there are and
 * how far off the next chest is. No accent and no primary action: every hero
 * a child has is a button that makes it the one they wear.
 *
 * **The grid** is the heroes held, in the order they are drawn; then a chest
 * when one is owed; then an empty place for every hero still to find — a
 * dashed outline the size of a hero, not a silhouette and not a question mark.
 * Twelve places, always.
 *
 * **A chest opens here**, three heroes face up and the child picks one
 * (ADR-097). S11 draws three cards face down to turn over; this keeps them face
 * up, because the page's own sentence is "geen kans", and choosing between
 * three cards that do not say what they are is chance. No animation: the only
 * movement in the product is the one that explains a mistake (README).
 *
 * Diplomas and stamps are not on this page. S11 is heroes and materials and
 * nothing else; the diplomas stay on the page of the module that gives them.
 */
export function VerzamelingScreen({
  sticker,
  onSticker,
}: {
  readonly sticker: string | undefined;
  readonly onSticker: (id: string) => void;
}) {
  const [stand, setStand] = useState<HeldenStand | null>(null);
  const [goed, setGoed] = useState<number | null>(null);
  const [kisten, setKisten] = useState(0);
  const [kiezen, setKiezen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [uitkomst, setUitkomst] = useState<KistUitkomst | null>(null);

  const lees = useCallback(async () => {
    const [nu, open, accuracy] = await Promise.all([
      loadHelden(),
      kistenOpenstaand(),
      loadAccuracy(),
    ]);
    setStand(nu);
    setKisten(open);
    setGoed(accuracy.correct);
  }, []);

  useEffect(() => {
    void lees();
  }, [lees]);

  const kies = async (plek: number) => {
    // One press per chest: a second one while the first is still being written
    // would spend a chest that is no longer owed.
    if (bezig) return;
    setBezig(true);
    const gekregen = await kiesHeld(plek);
    setUitkomst(gekregen);
    setKiezen(false);
    await lees();
    setBezig(false);
  };

  // Nothing until it is known: a page that shows an empty collection and then
  // fills it in has told a child they had none.
  if (stand === null || goed === null) return null;

  const gekozen = stickerById(sticker);
  const nog = goedTotKist(goed);
  const leeg = AANTAL_HELDEN - stand.helden.length - (kisten > 0 ? 1 : 0);

  return (
    <div className="ln-pagina">
      <PaginaKop
        titel={t('verzameling.titel')}
        meta={
          nog === 1
            ? t('verzameling.metaEen', { aantal: stand.helden.length, totaal: AANTAL_HELDEN })
            : t('verzameling.meta', { aantal: stand.helden.length, totaal: AANTAL_HELDEN, nog })
        }
      />

      {uitkomst ? <Gekregen uitkomst={uitkomst} /> : null}

      {kiezen ? (
        <section className="flex flex-col gap-4" aria-labelledby="kist-kiezen">
          <SectieKop id="kist-kiezen" titel={t('verzameling.kiesTitel')} />
          <ul className="ln-helden">
            {aanbod(stand).map((plek) => (
              <li key={plek}>
                <Aanbod stand={stand} plek={plek} bezig={bezig} onKies={(p) => void kies(p)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="jouw-helden">
        <SectieKop id="jouw-helden" titel={t('verzameling.helden')} />
        <ul className="ln-helden">
          {stand.helden.map((held) => {
            const dier = STICKERS[held.plek];
            if (!dier) return null;
            return (
              <li key={dier.id}>
                <HeldTegel
                  sticker={dier.id}
                  reeks={held.reeks}
                  gedragen={dier.id === gekozen.id}
                  onKies={() => onSticker(dier.id)}
                />
              </li>
            );
          })}
          {kisten > 0 && !kiezen ? (
            <li>
              <KistTegel onOpen={() => setKiezen(true)} />
            </li>
          ) : null}
          {Array.from({ length: Math.max(0, leeg) }, (_, index) => (
            <li key={`leeg-${index}`}>
              <LegePlek />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="materialen">
        <SectieKop id="materialen" titel={t('verzameling.materialen')} />
        <div className="flex flex-wrap items-center gap-6">
          <Materialen />
          <p className="ln-tekst max-w-[32rem]">{t('verzameling.uitleg')}</p>
        </div>
      </section>
    </div>
  );
}

/** One of the three on offer, saying what pressing it would do. */
function Aanbod({
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
  const reeks = materiaalNaam(straks.reeks);
  const naar = materiaalNaam(volgendeReeks(straks.reeks) ?? straks.reeks);
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

  return (
    <button type="button" className="ln-held" disabled={bezig} onClick={() => onKies(plek)}>
      <Heldplaat sticker={dier.id} reeks={straks.reeks} size={56} className="ln-object" />
      <span className="ln-titel">{held}</span>
      <span className="ln-sub">{wat}</span>
    </button>
  );
}

/** What the chest just gave, in one sentence on a card. */
function Gekregen({ uitkomst }: { readonly uitkomst: KistUitkomst }) {
  const dier = STICKERS[uitkomst.plek];
  if (!dier) return null;
  const held = t(dier.name);
  const reeks = materiaalNaam(uitkomst.reeks);

  return (
    <Kaart>
      <div className="flex items-center gap-4" role="status">
        <Heldplaat sticker={dier.id} reeks={uitkomst.reeks} size={56} className="ln-object" />
        <p className="ln-titel">
          {uitkomst.soort === 'nieuw'
            ? t('kist.kaartNieuw', { held, reeks })
            : uitkomst.soort === 'hoger'
              ? t('kist.kaartHoger', { held, reeks })
              : t('kist.kaartDubbel', {
                  held,
                  aantal: uitkomst.dubbelen,
                  totaal: DUBBELEN_PER_REEKS,
                  reeks: materiaalNaam(volgendeReeks(uitkomst.reeks) ?? uitkomst.reeks),
                })}
        </p>
      </div>
    </Kaart>
  );
}
