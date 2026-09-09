import { klokDigitaal, klokVorm, type KlokItem } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * A time, in words.
 *
 * `game-core/klok.ts` works out *which* words — which shape the sentence has and
 * which hour it names — and stops there, because the pure layer is the one a
 * server has to be able to import and a dictionary is not arithmetic. This is
 * where the Dutch goes on, through `t()` like every other string in the product.
 *
 * It is the same split `onderdelen.ts` already makes for rekenen: the generator
 * writes `tafel-7` and `rekenNaam` turns it into "Tafel van 7".
 */

/**
 * The hour by name, one to twelve.
 *
 * Written out rather than printed as a figure, because the whole exercise is
 * the distance between "7:30" and "half acht" — a card reading "half 8" would
 * be doing the reading for them.
 */
function uurNaam(uur: number): string {
  return t(`klok.uur.${uur}` as TranslationKey);
}

/**
 * Five or ten, by name.
 *
 * Those are the only two the content can produce: it steps in fives, so the
 * distance to a quarter, a half or an hour is five minutes or ten. A finer step
 * would need more words here, and it would need a decision in the generator
 * first — which is where that argument belongs (`tools/content/build-klok.mjs`).
 */
function getalNaam(aantal: number): string {
  return t(`klok.getal.${aantal}` as TranslationKey);
}

export function klokWoorden(item: KlokItem): string {
  const vorm = klokVorm(item);
  const uur = uurNaam(vorm.uur);

  if (vorm.soort === 'uur') return t('klok.zeg.uur', { uur });
  if (vorm.soort === 'kwart-over') return t('klok.zeg.kwartOver', { uur });
  if (vorm.soort === 'half') return t('klok.zeg.half', { uur });
  if (vorm.soort === 'kwart-voor') return t('klok.zeg.kwartVoor', { uur });

  const aantal = getalNaam(vorm.aantal);
  if (vorm.soort === 'over') return t('klok.zeg.over', { aantal, uur });
  if (vorm.soort === 'voor-half') return t('klok.zeg.voorHalf', { aantal, uur });
  if (vorm.soort === 'over-half') return t('klok.zeg.overHalf', { aantal, uur });
  return t('klok.zeg.voor', { aantal, uur });
}

/**
 * Both notations, in the order a child learns them: the words, then the figures.
 *
 * What the result screen lists and what a screen reader hears, because knowing
 * one of the two is knowing half of it — see `game-core/klok.ts`.
 */
export function klokVoluit(item: KlokItem): string {
  return t('klok.beide', { woorden: klokWoorden(item), cijfers: klokDigitaal(item) });
}
