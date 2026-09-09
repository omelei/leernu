import { MysteryIcon } from '@/components/Icon';
import { STICKERS } from '@/components/stickerSet';
import { levelForEarned, PER_REEKS, REEKSEN, type Plek } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * The parcel, opened.
 *
 * The collection stopped saying what is inside a cell before it is earned
 * (ADR-081), which bought a surprise and cost the moment it should arrive in: an
 * animal used to appear quietly on a page a child had to go and look at, and now
 * it appears quietly on a page where they cannot even read the name in advance.
 * So it is handed over where the work was done — on the screen at the end of the
 * round — and it is handed over as an unwrapping (ADR-084).
 *
 * Three things it says, and no more. **What it is**, drawn at the size the
 * result screen gives its own heading. **Which reeks**, because that is what
 * makes one animal rarer than another and it is the half a child says out loud.
 * And **what earned it** — the level — because a reward nobody can explain is a
 * riddle, which is the rule the reisstempels have followed since ADR-040.
 *
 * What it never says is "well done". The product does not tell a child what to
 * feel about their own work; it tells them what happened.
 *
 * Absent rather than empty when a round earned nothing, which is almost every
 * round. That is the point of it: a card that appeared every time would be
 * furniture within a week.
 */
export function NieuweDieren({ plekken }: { readonly plekken: readonly Plek[] }) {
  if (plekken.length === 0) return null;

  return (
    <section className="tk-card flex flex-col gap-4" aria-label={t('result.newAnimalTitle')}>
      <h2 className="tk-display text-h2 font-bold">
        {plekken.length === 1
          ? t('result.newAnimalOne')
          : t('result.newAnimalMany', { aantal: plekken.length })}
      </h2>

      <ul className="tk-unwraps">
        {plekken.map((plek) => (
          <NieuwDier key={`${plek.reeks}-${plek.plek}`} plek={plek} />
        ))}
      </ul>
    </section>
  );
}

function NieuwDier({ plek }: { readonly plek: Plek }) {
  const sticker = STICKERS[plek.plek];
  if (!sticker) return null;

  const Draw = sticker.draw;
  const reeks = t(`reeks.${plek.reeks}` as TranslationKey);
  // Where this one sits in the whole sixty, counted from one, and therefore
  // which level handed it over. The same sum the collection page does.
  const niveau = levelForEarned(REEKSEN.indexOf(plek.reeks) * PER_REEKS + plek.plek + 1);

  return (
    <li className="tk-unwrap-row" data-reeks={plek.reeks}>
      {/* The parcel goes, the animal arrives. Both are decorative: the two
          lines beside them say which animal and which reeks in words, and a
          screen reader that heard the drawing as well would hear it twice. */}
      <span className="tk-unwrap" aria-hidden="true">
        <span className="tk-unwrap-parcel">
          <MysteryIcon size={56} />
        </span>
        <span className="tk-unwrap-dier">
          <Draw size={56} />
        </span>
      </span>

      <span className="min-w-0">
        <span className="tk-display block text-h3 font-semibold">
          {t('result.newAnimalIn', { dier: t(sticker.name), reeks })}
        </span>
        <span className="block text-ink-2">{t('result.newAnimalLevel', { niveau })}</span>
      </span>
    </li>
  );
}
