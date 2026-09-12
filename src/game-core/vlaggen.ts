import type { Schedulable } from './leitner';

/**
 * Flags: what one is, and which others stand beside it as the wrong answers.
 *
 * Pure, like the rest of game-core: no pictures are loaded here, only the facts
 * about them. The pictures are files under `public/vlaggen` and the screen's
 * business.
 */

/** Where a flag belongs. The six werelddelen of /topografie, and home. */
export type Werelddeel =
  'afrika' | 'azie' | 'europa' | 'noord-amerika' | 'zuid-amerika' | 'oceanie' | 'nederland';

/** How well known a flag is. "Bekende vlaggen" is the first of these. */
export type VlagKlasse = 'bekend' | 'normaal' | 'lastig';

export interface VlagItem extends Schedulable {
  readonly id: string;
  /** ISO 3166-1 alpha-2 for a country, ISO 3166-2 for a province. */
  readonly iso: string;
  readonly naam: string;
  readonly aliassen: readonly string[];
  /** One for almost every country; two for Cyprus, as on the map. */
  readonly werelddelen: readonly Werelddeel[];
  readonly klasse: VlagKlasse;
  /** The groups of look-alikes this flag is in, by id. */
  readonly groepen: readonly string[];
  readonly hoofdstad: string;
  /** The United Nations' footnote to the capital, in one sentence, where there is one. */
  readonly hoofdstadNoot?: string;
  /** What a screen reader says instead of the picture. Never the name. */
  readonly beschrijving: string;
  /** One sentence for Ontdekken, about the colours or the signs. */
  readonly weetje: string;
  /** The picture, relative to the site's base: `vlaggen/nl.svg`. */
  readonly beeld: string;
  /** Width over height, read from the file. Nepal is under one, Qatar over two. */
  readonly verhouding: number;
  readonly licentie: 'publiek-domein' | 'vrijgesteld-nationaal';
  /** The items in /topografie this flag belongs to: its country or its province. */
  readonly topo: readonly string[];
}

export interface VlagGroep {
  readonly id: string;
  readonly leden: readonly string[];
  readonly reden: string;
}

/**
 * How hard the wrong answers are, by the question's place in the round.
 *
 * **The first three** stand a flag beside ones from other werelddelen that look
 * nothing like it: a child meeting flags is shown that it can tell them apart.
 * **The next four** come from the same werelddeel, which is the real question.
 * **From the eighth** the look-alikes come first — Tsjaad beside Roemenië —
 * where a group exists; that is the question a child who has learned the
 * others still gets wrong.
 */
export type AfleiderFase = 'ver' | 'werelddeel' | 'groep';

export function afleiderFase(vraagIndex: number): AfleiderFase {
  if (vraagIndex < 3) return 'ver';
  if (vraagIndex < 7) return 'werelddeel';
  return 'groep';
}

/** Four options in a round of a few, six where the round holds a werelddeel whole. */
export const OPTIES = 4;
export const OPTIES_ALLES = 6;

function shuffle<T>(source: readonly T[], rng: () => number): T[] {
  const out = [...source];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

const isProvincie = (vlag: VlagItem) => vlag.werelddelen.includes('nederland');

function zelfdeWerelddeel(a: VlagItem, b: VlagItem): boolean {
  return a.werelddelen.some((deel) => b.werelddelen.includes(deel));
}

function zelfdeGroep(a: VlagItem, b: VlagItem): boolean {
  return a.groepen.some((groep) => b.groepen.includes(groep));
}

export interface VlagAfleiderInput {
  readonly antwoord: VlagItem;
  /** Every flag that may stand beside it: usually all of them. */
  readonly pool: readonly VlagItem[];
  readonly fase: AfleiderFase;
  /** How many wrong answers: three beside four options, five beside six. */
  readonly aantal: number;
  readonly rng?: () => number;
}

/**
 * The wrong answers for one question, most fitting first.
 *
 * Never the answer, never the same flag twice, and never a province beside a
 * country or the other way round: a question about Drenthe with three national
 * flags beside it is answered by knowing which one is not a country. When the
 * phase's own candidates run out the rest of the pool fills the gap, because a
 * question with two options is worse than one whose third option is easy.
 */
export function vlagAfleiders(input: VlagAfleiderInput): VlagItem[] {
  const { antwoord, fase, aantal } = input;
  const rng = input.rng ?? Math.random;

  const gezien = new Set([antwoord.id]);
  const kandidaten: VlagItem[] = [];
  for (const vlag of input.pool) {
    if (gezien.has(vlag.id) || isProvincie(vlag) !== isProvincie(antwoord)) continue;
    gezien.add(vlag.id);
    kandidaten.push(vlag);
  }

  const lijkt = (vlag: VlagItem) => zelfdeGroep(vlag, antwoord);
  const buur = (vlag: VlagItem) => zelfdeWerelddeel(vlag, antwoord);

  // Each phase is an order of preference over the same candidates. Provinces
  // all share a werelddeel, so "far away" for them means only "not alike".
  const lagen: ((vlag: VlagItem) => boolean)[] =
    fase === 'groep'
      ? [lijkt, buur]
      : fase === 'werelddeel'
        ? [buur]
        : [
            (vlag) => !lijkt(vlag) && (isProvincie(antwoord) || !buur(vlag)),
            (vlag) => !lijkt(vlag),
          ];

  const gekozen: VlagItem[] = [];
  const genomen = new Set<string>();
  for (const laag of [...lagen, () => true]) {
    for (const vlag of shuffle(
      kandidaten.filter((kandidaat) => !genomen.has(kandidaat.id) && laag(kandidaat)),
      rng,
    )) {
      if (gekozen.length >= aantal) break;
      gekozen.push(vlag);
      genomen.add(vlag.id);
    }
  }

  return gekozen;
}

/**
 * The options in the order they are shown: the answer and its wrong answers,
 * dealt once. A position a child can predict is a question they can answer
 * without looking.
 */
export function vlagOpties(input: VlagAfleiderInput): VlagItem[] {
  const rng = input.rng ?? Math.random;
  return shuffle([input.antwoord, ...vlagAfleiders(input)], rng);
}
