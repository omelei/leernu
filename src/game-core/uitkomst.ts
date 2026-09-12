import { isOnthouden } from './retention';
import type { ItemState } from './types';

/**
 * What an answer does to the screen and to the result, as data (README, "De
 * vier vormregels"; S7, S10).
 */

/**
 * The three states an answer can leave behind. "Bijna" is not a fourth: a near
 * miss is wrong and looks wrong, and the copy says "Bijna".
 */
export type AntwoordToestand = 'goed' | 'fout' | 'gemist';

/**
 * Which state each thing on the screen takes after one answer.
 *
 * Right: the right answer is `goed` and nothing else changes. Wrong: what was
 * pointed at is `fout` and the right answer is `gemist` — shown, open, with its
 * double rule and its dot, so a child sees where it was without being told
 * they found it. No answer at all ("ik weet het niet", a stopped clock): only
 * `gemist`.
 */
export function antwoordToestanden(
  gekozen: string | null,
  juist: string,
): ReadonlyMap<string, AntwoordToestand> {
  if (gekozen === juist) return new Map([[juist, 'goed']]);
  const toestanden = new Map<string, AntwoordToestand>([[juist, 'gemist']]);
  if (gekozen !== null) toestanden.set(gekozen, 'fout');
  return toestanden;
}

/** The three rows of a result (S10). */
export interface RondeUitslag {
  /** Not remembered before the round, remembered after it: "nieuw onthouden". */
  readonly nieuwOnthouden: readonly string[];
  /** Learned once and due again, and right this round: "opgefrist". */
  readonly opgefrist: readonly string[];
  /** Asked this round and still not remembered: "blijven wisselen". */
  readonly wisselen: readonly string[];
}

function geleerd(state: ItemState | undefined): boolean {
  return state !== undefined && state.laatsteReview !== null && state.box >= 2;
}

/**
 * What changed, from the boxes before a round and after it. Each item asked is
 * in at most one row, in the order it was first asked. An item remembered
 * before and after that was not due — the tenth of a round that is revision —
 * is in none: nothing changed about it.
 */
export function rondeUitslag(
  voor: ReadonlyMap<string, ItemState>,
  na: ReadonlyMap<string, ItemState>,
  gevraagd: readonly string[],
  nu: Date,
): RondeUitslag {
  const nieuwOnthouden: string[] = [];
  const opgefrist: string[] = [];
  const wisselen: string[] = [];

  for (const id of new Set(gevraagd)) {
    const was = voor.get(id);
    if (!isOnthouden(na.get(id), nu)) {
      wisselen.push(id);
    } else if (!geleerd(was)) {
      nieuwOnthouden.push(id);
    } else if (!isOnthouden(was, nu)) {
      opgefrist.push(id);
    }
  }

  return { nieuwOnthouden, opgefrist, wisselen };
}
