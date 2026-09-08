import type { ComponentType } from 'react';
import {
  AreaIcon,
  ClockIcon,
  EraIcon,
  FlagIcon,
  TablesIcon,
  WordIcon,
  type IconProps,
} from '@/components/Icon';
import type { Module } from './modules';

/**
 * A pictogram per module, which is the one place §E lets an icon take an
 * accent: "een icoon krijgt alleen een module-accent als het de module zelf
 * aanduidt".
 *
 * §E names six of them — gebied, vlag, klok, tafels, woord, tijdvak — and the
 * plan has seven modules. Spelling has no icon of its own and shares the word,
 * which is a collision nobody sees yet because neither module is built; it is
 * a question for the styleguide rather than something to invent a seventh
 * shape for here.
 *
 * Its own file rather than a constant inside the Shell, because the rail is no
 * longer the only place a module wears its own mark: K1's tiles carry it too,
 * and a second copy of this map is a second place to forget an eighth module.
 * It stays out of `modules.ts` so that the list of modules remains data a test
 * can read without rendering anything.
 */
export const MODULE_ICON: Record<Module['id'], ComponentType<Omit<IconProps, 'children'>>> = {
  topo: AreaIcon,
  tafels: TablesIcon,
  klok: ClockIcon,
  woorden: WordIcon,
  spelling: WordIcon,
  tijdvakken: EraIcon,
  vlaggen: FlagIcon,
};
