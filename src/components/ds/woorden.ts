import type { Reeks } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';

/**
 * The words the component set says itself, where a component needs one and a
 * caller should not have to pass it in.
 */

const MATERIAAL: Record<Reeks, TranslationKey> = {
  brons: 'materiaal.brons',
  zilver: 'materiaal.zilver',
  goud: 'materiaal.goud',
  platina: 'materiaal.platina',
  ultra: 'materiaal.ultra',
};

/** What a hero is made of, in the word the collection uses (S11). */
export function materiaalNaam(reeks: Reeks): string {
  return t(MATERIAAL[reeks]);
}
