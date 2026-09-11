import {
  correctToNextLevel,
  DUBBELEN_PER_REEKS,
  GOED_PER_STER,
  goedTotKist,
  levelFor,
  volgendeReeks,
  type Reeks,
} from '@/game-core';
import type { Module } from '@/features/shell/modules';
import { t, type TranslationKey } from '@/i18n';

/**
 * The sentences "Jouw voortgang" is made of, in one place, because the block in
 * the child's own column and the page it leads to say the same things and must
 * never say them two ways.
 */

/**
 * How far to the next chest — or, before the first star, how far to that.
 *
 * At nought, "nog 50 goede antwoorden tot je volgende kist" is a distance a
 * child of eight cannot picture; ten is this afternoon. So the first star is
 * the first thing named, and the chest takes over once there is a star in it.
 */
export function kistZin(goed: number): string {
  if (goed < GOED_PER_STER) {
    const nog = GOED_PER_STER - Math.max(0, goed);
    return nog === 1 ? t('reis.totEersteSterEen') : t('reis.totEersteSter', { aantal: nog });
  }

  const nog = goedTotKist(goed);
  return nog === 1 ? t('reis.totKistEen') : t('reis.totKist', { aantal: nog });
}

/** How far to the next level. One thin line, under the chest (ADR-099). */
export function niveauZin(goed: number): string {
  const volgende = levelFor(goed) + 1;
  const nog = correctToNextLevel(goed);
  return nog === 1
    ? t('home.journeyOneToGo', { niveau: volgende })
    : t('home.journeyToGo', { aantal: nog, niveau: volgende });
}

/**
 * Which reeks a hero stands in, and how far towards the next: "goud · 2 van de
 * 3". At ultra there is no next, and the line says that instead of counting
 * towards nothing.
 */
export function reeksRegel(reeks: Reeks, dubbelen: number): string {
  const naam = t(`reeks.${reeks}` as TranslationKey);
  return volgendeReeks(reeks) === null
    ? t('reis.heldUltra', { reeks: naam })
    : t('reis.heldDubbel', { reeks: naam, aantal: dubbelen, totaal: DUBBELEN_PER_REEKS });
}

/** The subject as it reads inside "Verder oefenen met …", for the built ones. */
const VAK: Partial<Record<Module['id'], TranslationKey>> = {
  topo: 'reis.vak.topo',
  tafels: 'reis.vak.tafels',
  klok: 'reis.vak.klok',
};

/**
 * The way back to practising, named after where the child last was. A child
 * who has not played anything yet is offered one round, which is a thing they
 * can decide to do; "verder" with nothing behind it is not.
 */
export function verderZin(vak: Module['id'] | null): string {
  const naam = vak === null ? undefined : VAK[vak];
  return naam ? t('reis.verderMet', { vak: t(naam) }) : t('reis.doeEenRonde');
}
