import type { VlagGroep, VlagItem, Werelddeel } from '@/game-core';
import bestand from '../../content/vlaggen/vlaggen.json';

/**
 * The flags, at build time: 196 countries, twelve provinces, and the groups of
 * flags that look alike.
 *
 * Bundled like the clock and the sums, and unlike the pictures, which are
 * files under `public/vlaggen` fetched as a round needs them. The chooser has
 * to know how many flags a set holds before anything is fetched.
 *
 * Written by tools/content/build-vlaggen.mjs; `vlaggen.content.test.ts` checks
 * it against the scope in `content/vlaggen/AFBAKENING.md`.
 *
 * **No set is a file.** "Bekende vlaggen van Europa" and "Alle vlaggen van
 * Europa" hold the same items under two names, so the flag of Belgium answered
 * in one moves the same Leitner box as in the other — the rule the mixes follow
 * everywhere else in the product (ADR-062). A set is a werelddeel and a
 * subject, composed here.
 */

interface VlagBestand {
  readonly contentVersie: string;
  readonly landen: readonly VlagItem[];
  readonly provincies: readonly VlagItem[];
  readonly groepen: readonly VlagGroep[];
}

const DATA = bestand as unknown as VlagBestand;

/** Where on the map: the row the page asks first, in /topografie's order. */
export type VlagRegio = 'wereld' | Werelddeel;

/**
 * What about. Three for the world and each werelddeel, a fourth for the world
 * alone, the provinces for home, and the child's own list everywhere.
 */
export type VlagOnderwerp = 'bekend' | 'alle' | 'lijkt' | 'mix' | 'provincies' | 'fouten';

export interface VlagSet {
  readonly id: string;
  readonly regio: VlagRegio;
  readonly onderwerp: VlagOnderwerp;
  readonly items: readonly VlagItem[];
}

export const VLAG_REGIOS: readonly VlagRegio[] = [
  'wereld',
  'afrika',
  'azie',
  'europa',
  'noord-amerika',
  'zuid-amerika',
  'oceanie',
  'nederland',
];

/**
 * The fewest flags a subject may hold. Below it a set is not practice, it is a
 * list: Oceanië has two flags most children know, and a round of "bekende
 * vlaggen" there would ask Australië and Nieuw-Zeeland five times each.
 */
export const MIN_VLAGGEN = 4;

export function vlagSetId(regio: VlagRegio, onderwerp: VlagOnderwerp): string {
  return `vlag-${regio}-${onderwerp}`;
}

export function vlagLanden(): readonly VlagItem[] {
  return DATA.landen;
}

export function vlagProvincies(): readonly VlagItem[] {
  return DATA.provincies;
}

/** Every flag there is: what the wrong answers are drawn from. */
export function alleVlaggen(): readonly VlagItem[] {
  return [...DATA.landen, ...DATA.provincies];
}

export function vlagGroepen(): readonly VlagGroep[] {
  return DATA.groepen;
}

/** Every flag in a region. The world is every country; home is the provinces. */
function inRegio(regio: VlagRegio): readonly VlagItem[] {
  if (regio === 'wereld') return DATA.landen;
  if (regio === 'nederland') return DATA.provincies;
  return DATA.landen.filter((vlag) => vlag.werelddelen.includes(regio));
}

function samengesteld(): VlagSet[] {
  const sets: VlagSet[] = [];
  const set = (regio: VlagRegio, onderwerp: VlagOnderwerp, items: readonly VlagItem[]) =>
    sets.push({ id: vlagSetId(regio, onderwerp), regio, onderwerp, items });

  // Home first, then the row's own order. The page no longer opens on a set
  // when the address names none, and it opens on the world rather than on
  // home (`eersteRegio`, ADR-111); this order is only the order of the list.
  const thuisEerst = ['nederland', ...VLAG_REGIOS.filter((regio) => regio !== 'nederland')];

  for (const regio of thuisEerst as VlagRegio[]) {
    if (regio === 'nederland') {
      set(regio, 'provincies', DATA.provincies);
      set(regio, 'fouten', DATA.provincies);
      continue;
    }

    const alle = inRegio(regio);
    const bekend = alle.filter((vlag) => vlag.klasse === 'bekend');
    const lijkt = alle.filter((vlag) => vlag.groepen.length > 0);

    if (bekend.length >= MIN_VLAGGEN) set(regio, 'bekend', bekend);
    set(regio, 'alle', alle);
    if (lijkt.length >= MIN_VLAGGEN) set(regio, 'lijkt', lijkt);
    // The mix is the world's alone: every country and every province, which is
    // what "the way the test will ask" means on this page.
    if (regio === 'wereld') set(regio, 'mix', alleVlaggen());
    // The child's own list: every flag of the region, narrowed to the ones
    // they have had wrong when a round starts (ADR-078, ADR-102).
    set(regio, 'fouten', regio === 'wereld' ? alleVlaggen() : alle);
  }

  return sets;
}

const SETS = samengesteld();

/** Every set a round can be started on, in the order the page offers them. */
export function loadVlagSets(): readonly VlagSet[] {
  return SETS;
}

export function loadVlagSet(id: string): VlagSet | undefined {
  return SETS.find((set) => set.id === id);
}

export function isVlagMix(id: string): boolean {
  return loadVlagSet(id)?.onderwerp === 'mix';
}

export function isVlagFouten(id: string): boolean {
  return loadVlagSet(id)?.onderwerp === 'fouten';
}

/**
 * What a round that ends on three lives draws from: every flag of the set's
 * region, whatever the subject. Nineteen well-known flags of Europe run out
 * before a child who knows them runs out of lives, and one who reaches for
 * the lives is one who knows them — the reason the clock's lightning round
 * reaches past its step (`klokPool`).
 */
export function vlagPool(id: string): readonly VlagItem[] {
  const set = loadVlagSet(id);
  if (!set) return [];
  if (set.onderwerp === 'mix' || set.onderwerp === 'fouten') return set.items;
  return set.regio === 'wereld' ? DATA.landen : inRegio(set.regio);
}
