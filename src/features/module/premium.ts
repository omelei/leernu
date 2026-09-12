import type { ModeId } from '@/game-core';
import { t } from '@/i18n';

/**
 * What will need an account, marked before there is one (ADR-111).
 *
 * Four things: the bliksemronde, the diplomas, the oefentoets, and every way of
 * going back over your own mistakes — the "Oefen je fouten" subject and
 * "Herhaal je fouten" after a round. There is no sign-in yet, so nothing here
 * is locked: the label says what is coming, and the day accounts arrive this
 * file is the one list of what they gate.
 */
const PREMIUM_VORMEN: ReadonlySet<ModeId> = new Set<ModeId>([
  'bliksemronde',
  'tafeldiploma',
  'vlag-diploma',
]);

/** A way of practising that will need an account. The oefentoets is its own tile. */
export function isPremiumVorm(id: ModeId): boolean {
  return PREMIUM_VORMEN.has(id);
}

/** A child's own list of mistakes, in any module: rekenen's `fouten`, and `*-fouten`. */
export function isPremiumOnderwerp(id: string): boolean {
  return id === 'fouten' || id.endsWith('-fouten');
}

/**
 * An accessible name with the label on the end, so a screen reader hears it
 * after what the tile is — the name still leads, and a query anchored on it
 * still finds it.
 */
export function metPremium(label: string, premium: boolean): string {
  return premium ? `${label}. ${t('premium.label')}` : label;
}
