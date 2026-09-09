import type { ComponentType } from 'react';
import {
  AfrikaIcon,
  AzieIcon,
  DeelIcon,
  EilandIcon,
  EuropaIcon,
  GlobeIcon,
  GridIcon,
  type IconProps,
  LandIcon,
  MinIcon,
  MixIcon,
  NoordAmerikaIcon,
  OceanieIcon,
  PinIcon,
  PlusIcon,
  ProvincieIcon,
  StadIcon,
  WaterIcon,
  WrongIcon,
  ZuidAmerikaIcon,
} from '@/components/Icon';

/**
 * A mark for every tile on a module page.
 *
 * A tile is an icon and a word, so the icon is the only thing that tells two of
 * them apart before the word is read. That was not true before: every subject
 * carried the same progress dot and every region the same ruled globe, which is
 * eight tiles with one drawing between them.
 *
 * The drawings themselves are in `Icon.tsx`, built from §E's primitives. What
 * lives here is the mapping, and it lives beside the page rather than in the
 * icon file for the reason `MODULE_ICON` does: a component library should not
 * have to know what a werelddeel is.
 */
type TileIcon = ComponentType<Omit<IconProps, 'children'>>;

/**
 * Where on the map, by region id.
 *
 * The world keeps the ruled globe — it is the whole of it and has no part to
 * point at — the six werelddelen are that globe with a dot where they are, and
 * Nederland is a pin, because it is the one entry on the row that is a country.
 */
export const REGIO_ICON: Record<string, TileIcon> = {
  wereld: GlobeIcon,
  afrika: AfrikaIcon,
  azie: AzieIcon,
  europa: EuropaIcon,
  'noord-amerika': NoordAmerikaIcon,
  'zuid-amerika': ZuidAmerikaIcon,
  oceanie: OceanieIcon,
  nederland: PinIcon,
};

/**
 * Which subject, by subject id.
 *
 * The seven werelddeel subjects are all called "Landen" and all take the same
 * mark: they are one subject asked about seven maps, and the region row above
 * has already said which map. Topo-mix and Rekenmix share `MixIcon` for the
 * same kind of reason — one idea, one drawing, and they are never on a page
 * together.
 */
export const ONDERWERP_ICON: Record<string, TileIcon> = {
  // Topografie
  provincies: ProvincieIcon,
  steden: StadIcon,
  wateren: WaterIcon,
  eilanden: EilandIcon,
  'nl-mix': MixIcon,
  'europa-landen': LandIcon,
  'afrika-landen': LandIcon,
  'azie-landen': LandIcon,
  'noord-amerika-landen': LandIcon,
  'zuid-amerika-landen': LandIcon,
  'oceanie-landen': LandIcon,
  'wereld-landen': LandIcon,
  // Rekenen
  tafels: GridIcon,
  delen: DeelIcon,
  plus: PlusIcon,
  min: MinIcon,
  rekenmix: MixIcon,
  // The child's own list of the sums they keep getting wrong (ADR-078). The
  // cross is not borrowed here, it is the subject: this tile is the mistakes.
  fouten: WrongIcon,
};

/**
 * A subject with no mark of its own falls back to the mix.
 *
 * Not to nothing. A tile whose icon failed to resolve would be a word with a
 * hole beside it and every other tile on the row indented past it, which is a
 * layout bug wearing the clothes of a content one.
 */
export function onderwerpIcon(id: string): TileIcon {
  return ONDERWERP_ICON[id] ?? MixIcon;
}

export function regioIcon(id: string): TileIcon {
  return REGIO_ICON[id] ?? GlobeIcon;
}
