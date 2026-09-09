import type { StampId } from '@/game-core';
import type { TranslationKey } from '@/i18n';

/**
 * What each travel stamp is called.
 *
 * It lived inside `ResultScreen`, which was the only screen that named one.
 * The collection page names all ten — including the ones a child has not got —
 * so the map is shared rather than copied, and a stamp added to `game-core`
 * fails to compile in one place instead of appearing nameless in another.
 *
 * The criterion is always `${key}.criterion`, by convention rather than by a
 * second map: a reward nobody can explain is a riddle, so every stamp has to
 * have both, and a convention that is checked by the type of the key is worth
 * more than a table that can be half filled in.
 */
export const STAMP_NAME: Record<StampId, TranslationKey> = {
  'provincies-foutloos': 'stamp.provincies-foutloos',
  'hoofdsteden-foutloos': 'stamp.hoofdsteden-foutloos',
  'eilanden-foutloos': 'stamp.eilanden-foutloos',
  'week-op-rij': 'stamp.week-op-rij',
  'set-onthouden': 'stamp.set-onthouden',
  'wateren-foutloos': 'stamp.wateren-foutloos',
  'steden-foutloos': 'stamp.steden-foutloos',
  'tafel-foutloos': 'stamp.tafel-foutloos',
  'bliksem-tien': 'stamp.bliksem-tien',
  'overleven-vijftien': 'stamp.overleven-vijftien',
};
