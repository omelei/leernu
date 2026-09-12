import type { ComponentType } from 'react';
import {
  AfrikaIcon,
  AzieIcon,
  DeelIcon,
  EilandIcon,
  EuropaIcon,
  FlagIcon,
  GlobeIcon,
  GridIcon,
  HalfUurIcon,
  type IconProps,
  KeerIcon,
  KwartierIcon,
  LandIcon,
  MinIcon,
  MinuutIcon,
  MixIcon,
  NoordAmerikaIcon,
  OceanieIcon,
  PinIcon,
  PlusIcon,
  ProvincieIcon,
  StadIcon,
  StarIcon,
  UurIcon,
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
 * has already said which map. Topo-mix, Rekenmix and Klokmix share `MixIcon`
 * for the same kind of reason — one idea, one drawing, and no two of them are
 * ever on a page together.
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
  // Rekenen. The four kinds of sum are their own sign, × : + −, and the
  // keersommen past the tables are the grid a big keersom is split in (ADR-100).
  tafels: KeerIcon,
  keer: GridIcon,
  delen: DeelIcon,
  plus: PlusIcon,
  min: MinIcon,
  rekenmix: MixIcon,
  // The child's own list of the sums they keep getting wrong (ADR-078). The
  // cross is not borrowed here, it is the subject: this tile is the mistakes.
  fouten: WrongIcon,
  // Klokkijken. The mark *is* the subject here — three of the four are the
  // hand position the step is named after, so a child who cannot read
  // "kwartieren" can still see which tile has the hand on the three.
  'hele-uren': UurIcon,
  'halve-uren': HalfUurIcon,
  kwartieren: KwartierIcon,
  'vijf-minuten': MinuutIcon,
  'klok-mix': MixIcon,
};

/**
 * Flags, by the subject at the end of the set id — `vlag-europa-bekend` is
 * "bekend". The subject is the same idea in every werelddeel, so it takes the
 * same mark in every one, the way the seven "Landen" do above.
 */
const VLAG_ONDERWERP_ICON: Record<string, TileIcon> = {
  bekend: StarIcon,
  alle: FlagIcon,
  lijkt: GridIcon,
  mix: MixIcon,
  provincies: ProvincieIcon,
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
  // Every module's list of mistakes is the mistakes, whatever map it is on.
  if (id.endsWith('-fouten')) return WrongIcon;
  const vlag = /^vlag-.+-([a-z]+)$/.exec(id)?.[1];
  return ONDERWERP_ICON[id] ?? (vlag ? VLAG_ONDERWERP_ICON[vlag] : undefined) ?? MixIcon;
}

export function regioIcon(id: string): TileIcon {
  return REGIO_ICON[id] ?? GlobeIcon;
}
