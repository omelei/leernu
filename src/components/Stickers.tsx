import { Icon, type IconProps } from './Icon';

/**
 * Six animals, and the one thing on this screen a child gets to choose.
 *
 * Everything else on the front door is earned or measured: a mark, a forecast,
 * a run of days. This is not, and that is the point — a child who cannot yet
 * change anything about an app they are told to use can at least decide what it
 * looks like when they open it. It carries no progress, unlocks nothing, and is
 * not a reward. Making it one would put a hare behind a wall.
 *
 * Drawn on the §E frame rather than beside it. They are not part of §E's set of
 * sixteen — that list is fixed and these are not on it — but they sit in the
 * same interface, so they take the same 24 grid, the same stroke, the same
 * primitives, and no colour of their own. `src/design/icons.test.ts` checks
 * this file for the last of those the same way it checks the set proper.
 *
 * Straight lines and circles. Everything here is a head at 24 pixels, because a
 * whole animal at that size is a smudge and a head with ears is not: ears are
 * the part a five-year-old draws first and the part that tells a cat from a
 * hare.
 *
 * The drawings live here and the list of them lives in `stickerSet.ts`, the same
 * split `features/shell/moduleIcons.ts` makes: a file that exports components
 * exports only components, so fast refresh keeps working and a registry stays
 * data a test can read.
 */

/** The cat: a round head, two pricked ears and a pair of eyes. */
export function CatSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M7.2 8.6L5.5 3.5l4.6 2.4M16.8 8.6L18.5 3.5l-4.6 2.4" strokeLinejoin="round" />
      <circle cx="9.5" cy="12.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" />
      <path d="M3 15h3.5M17.5 15H21" />
    </Icon>
  );
}

/** The owl: one head, two eyes that are most of it, and a beak between them. */
export function OwlSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12.5" r="8.5" />
      <circle cx="8.8" cy="10.5" r="2.4" />
      <circle cx="15.2" cy="10.5" r="2.4" />
      <path d="M12 13.5l-1.6 2.4h3.2z" strokeLinejoin="round" />
    </Icon>
  );
}

/** The fox: a snout that comes to a point, and two ears that come to two more. */
export function FoxSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5L8.5 9h7l5-3.5-2 8.5L12 20.5 5.5 14z" strokeLinejoin="round" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The bear: a round head and two round ears, which is all a bear needs. */
export function BearSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="14" r="6.5" />
      <circle cx="5.5" cy="7" r="2.6" />
      <circle cx="18.5" cy="7" r="2.6" />
      <circle cx="9.8" cy="13" r="1" fill="currentColor" />
      <circle cx="14.2" cy="13" r="1" fill="currentColor" />
      <path d="M10.5 17h3" />
    </Icon>
  );
}

/** The hare: the ears do the work, so they are half the icon. */
export function HareSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="15.5" r="5.5" />
      <path d="M9.3 10.6L7.5 3.5M14.7 10.6L16.5 3.5" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
      <circle cx="14" cy="14.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The fish: a body and a tail, and the only one here that is not a head. */
export function FishSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M9.5 6L17 12l-7.5 6L3 12z" strokeLinejoin="round" />
      <path d="M17 12l4-3.5v7z" strokeLinejoin="round" />
      <circle cx="7" cy="11.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/**
 * Six more, and the reason there are now twelve.
 *
 * The first six were all there from the first day and unlocked nothing, which
 * was right for what they were: a choice, not a reward (ADR-059). They are a
 * ladder now — one per level, and a level is a hundred and fifty correct
 * answers and then more (ADR-065). ADR-067 says why that reversal is worth
 * making and what it is not allowed to become.
 *
 * Same frame, same primitives, same rule about ears. The dragon is the twelfth
 * and the only one that is not an animal a child could meet, which is
 * deliberate: the last thing on a ladder should look like the last thing.
 */

/** The hedgehog: a body, and a row of spikes that is the whole animal. */
export function HedgehogSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="15" r="6" />
      <path d="M5 11l2.5-4 2 3.2 2.5-4.7 2 4.2 2.5-3.7 2 4.6" strokeLinejoin="round" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The frog: two eyes on top of the head, which is where a frog keeps them. */
export function FrogSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="7.5" r="2.8" />
      <circle cx="16" cy="7.5" r="2.8" />
      <path d="M4 11.5h16v3.5l-3.5 4h-9l-3.5-4z" strokeLinejoin="round" />
      <circle cx="8" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16" cy="7.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The squirrel: a head, and a tail bigger than the rest of it. */
export function SquirrelSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="9" r="4.5" />
      <path d="M7 5.5L5.5 1.5l3.5 1.6" strokeLinejoin="round" />
      <path d="M8.5 13.5v5.5h5" strokeLinejoin="round" />
      <path d="M13.5 19l4.5-1.5 2-4.5-2-4-3.5-.5" strokeLinejoin="round" />
      <circle cx="7" cy="8.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The penguin: a head, a body and a beak, and no arms worth drawing at 24. */
export function PenguinSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="7" r="4.5" />
      <path d="M7.5 10.5L6 20.5h12l-1.5-10" strokeLinejoin="round" />
      <path d="M12 7.5l2.2 1.2-2.2 1.2z" strokeLinejoin="round" fill="currentColor" />
      <circle cx="10.2" cy="6" r="0.9" fill="currentColor" />
      <circle cx="13.8" cy="6" r="0.9" fill="currentColor" />
    </Icon>
  );
}

/** The elephant: the ears and the trunk, which is all an elephant needs. */
export function ElephantSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="10.5" r="5.5" />
      <path d="M6.8 8.5L2.5 5.5v6.5l4 1.5M17.2 8.5l4.3-3v6.5l-4 1.5" strokeLinejoin="round" />
      <path d="M12 16v4.5l3 1" strokeLinejoin="round" />
      <circle cx="10" cy="9.5" r="1" fill="currentColor" />
      <circle cx="14" cy="9.5" r="1" fill="currentColor" />
    </Icon>
  );
}

/** The dragon: a jaw, a horn and one eye. The twelfth, and it looks like it. */
export function DragonSticker(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M2.5 15.5l4.5-6 6-2.5 5.5 2 3 4.5-4.5 3.5H7z" strokeLinejoin="round" />
      <path d="M13.5 7l1.5-4.5 3 4" strokeLinejoin="round" />
      <path d="M7 17h6.5" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
    </Icon>
  );
}
