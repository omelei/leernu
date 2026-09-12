import { REEKSEN, type Reeks } from '@/game-core';
import { t } from '@/i18n';
import { Heldplaat } from '../Heldplaat';
import { stickerById } from '../stickerSet';
import { Chip } from './Tekst';
import { materiaalNaam } from './woorden';

/**
 * heldkaart, kist, lege plek en de materialen (S11): the other side of the
 * line, where the product has volume. A hero and a chest stand on their card
 * with a shadow of their own; the card never has one. What a hero is made of
 * is written beside it in ink, never as a coloured word.
 */

/**
 * A hero a child has. Pressing it makes it the one they wear, and the one worn
 * carries the double ink rule and says so in its label.
 */
export function HeldTegel({
  sticker,
  reeks,
  gedragen,
  onKies,
}: {
  readonly sticker: string;
  readonly reeks: Reeks;
  readonly gedragen: boolean;
  readonly onKies?: (() => void) | undefined;
}) {
  const naam = t(stickerById(sticker).name);
  const inhoud = (
    <>
      <Heldplaat sticker={sticker} reeks={reeks} size={56} className="ln-object" />
      <span className="ln-titel">{naam}</span>
      <Chip toon={gedragen ? 'sterk' : 'rustig'}>
        {gedragen ? `${materiaalNaam(reeks)} · ${t('ds.gedragen')}` : materiaalNaam(reeks)}
      </Chip>
    </>
  );

  return onKies ? (
    <button type="button" className="ln-held" aria-pressed={gedragen} onClick={onKies}>
      {inhoud}
    </button>
  ) : (
    <div className="ln-held">{inhoud}</div>
  );
}

/** A chest that is owed: it opens where the child is (S11). */
export function KistTegel({ onOpen }: { readonly onOpen: () => void }) {
  return (
    <button type="button" className="ln-held" onClick={onOpen}>
      <span className="ln-kist-blok ln-object" aria-hidden="true" />
      <span className="ln-titel">{t('ds.kist')}</span>
      <Chip toon="accent">{t('ds.kistOpenNu')}</Chip>
    </button>
  );
}

/**
 * A place not filled yet: a dashed outline the same size as a hero, and no
 * silhouette and no question mark (S11). Not a control — there is nothing to
 * do with it.
 */
export function LegePlek() {
  return (
    <div className="ln-held ln-held-leeg">
      <span className="ln-held-cirkel" aria-hidden="true" />
      <span className="ln-titel">{t('ds.leeg')}</span>
      <span className="ln-sub">{t('ds.nogTeVinden')}</span>
    </div>
  );
}

/** The five materials, in the order of the ladder. */
export function Materialen() {
  return (
    <ul className="ln-materialen">
      {REEKSEN.map((reeks) => (
        <li key={reeks} className="ln-materiaal">
          <span className="ln-materiaal-rond ln-object" data-reeks={reeks} aria-hidden="true" />
          {materiaalNaam(reeks)}
        </li>
      ))}
    </ul>
  );
}
