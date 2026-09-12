import type { VlagItem } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import type { VlagRegio, VlagSet } from '@/content/loadVlaggen';

/**
 * What a set of flags is called: the subject and the werelddeel in one phrase,
 * which is what the start bar, the cards on the front door and the favourites
 * all show — "Bekende vlaggen van Europa".
 */
export function vlagSetNaam(set: Pick<VlagSet, 'regio' | 'onderwerp'>): string {
  const regio = regioNaam(set.regio);

  switch (set.onderwerp) {
    case 'bekend':
      return t('vlag.set.bekend', { regio });
    case 'alle':
      return t('vlag.set.alle', { regio });
    case 'lijkt':
      return t('vlag.set.lijkt', { regio });
    case 'mix':
      return t('vlag.set.mix');
    case 'provincies':
      return t('vlag.set.provincies');
    case 'fouten':
      if (set.regio === 'wereld') return t('vlag.set.foutenWereld');
      if (set.regio === 'nederland') return t('vlag.set.foutenNederland');
      return t('vlag.set.fouten', { regio });
  }
}

/** "de wereld" in a sentence, and the region row's own word everywhere else. */
function regioNaam(regio: VlagRegio): string {
  return regio === 'wereld' ? t('vlag.regio.wereld') : t(`regio.${regio}` as TranslationKey);
}

/** Where a flag belongs, in words: "Europa en Azië" for Cyprus. */
export function werelddelenVan(vlag: VlagItem): string {
  return vlag.werelddelen
    .map((deel) => t(`regio.${deel}` as TranslationKey))
    .join(` ${t('vlag.en')} `);
}
