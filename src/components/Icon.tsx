import type { ReactNode } from 'react';

/**
 * The icon frame, styleguide §E.
 *
 *   24 x 24 grid, active area 20 x 20, margin 2
 *   stroke 2, always — no variable weight, no fill except a solid 6px dot
 *     where the dot itself carries meaning
 *   straight ends, corners rounded at 2, circles fully round
 *   at 20px and below: stroke 1.5 and one detail fewer
 *
 * Icons are monochrome: primary ink, or secondary where they sit beside text
 * that already carries the meaning. An icon takes a module accent only when it
 * *is* the module — which is the module pictogram, not this.
 *
 * §E specifies sixteen icons and deliberately does not draw them: "Icoonvormen
 * zijn hier vastgelegd als constructieregel plus benoemde set, niet als
 * afgetekende illustratie." What it draws instead are four primitives — circle,
 * diamond, line, dot — and the rule that everything is built from them, "zodat
 * de set uitbreidbaar blijft zonder illustrator".
 *
 * So all sixteen are here, constructed rather than illustrated. That is not
 * guessing at an undrawn design (build brief §0.2); it is the drawn rule
 * applied to the drawn list, which is what the rule is for. An illustrator who
 * redraws them later replaces the shapes and keeps the names, the grid and the
 * weight.
 *
 * Two things the construction forces. The tables are a three-by-three array of
 * dots and not a multiplication sign, because a cross already means a wrong
 * answer and an icon may not mean two things. And nothing here curves: the
 * primitives are straight, so a shoulder is a bevel rather than an arc, which
 * is also what survives being drawn at 20px.
 */

/** Below this, §E drops the stroke to 1.5 and one detail with it. */
const SMALL_PX = 21;

export interface IconProps {
  readonly size?: number;
  /** Ink, or secondary ink where the neighbouring words carry the meaning. */
  readonly tone?: 'ink' | 'ink-2' | 'inherit';
  /**
   * What a screen reader should say. Left out, the icon is decorative — which
   * is right whenever the word beside it already says the same thing.
   */
  readonly label?: string;
  readonly children: ReactNode;
}

const TONE_COLOUR = {
  ink: 'var(--ink)',
  'ink-2': 'var(--ink-2)',
  inherit: 'currentColor',
} as const;

export function Icon({ size = 24, tone = 'inherit', label, children }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={TONE_COLOUR[tone]}
      strokeWidth={size < SMALL_PX ? 1.5 : 2}
      strokeLinecap="butt"
      strokeLinejoin="round"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}

/**
 * The freezer: three stripes, on the 20x20 active area with 2 of margin.
 *
 * It means an item remembered well enough to be put away — ADR-035 settles
 * that as box five, three weeks, not the months the design implied. It is not
 * green: green is an answer state, and a status that borrowed it would tell a
 * child they had just got something right.
 */
export function FreezerIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 8h16M4 12h16M4 16h16" />
    </Icon>
  );
}

/**
 * The area: topography's own mark, and the first of the module pictograms.
 *
 * A closed outline with one inner boundary, on the 20x20 active area. It is a
 * shape rather than a picture of the Netherlands on purpose — §E's rule is that
 * the real map shape comes from the topography source and never from an icon,
 * because an icon of a country is a country drawn wrong at 24px.
 */
export function AreaIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 3h9l3 4v11l-4 3H7l-3-4V6z" strokeLinejoin="round" />
      <path d="M10 3v8l-6 1" />
    </Icon>
  );
}

/**
 * The flag: a pole and a swallowtail banner, both straight lines.
 *
 * No emblem in it. A flag icon with a device on it is a specific flag, and this
 * one stands for the module that teaches all of them.
 */
export function FlagIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 3v18" />
      <path d="M6 5h13l-3.5 3.5L19 12H6" strokeLinejoin="round" />
    </Icon>
  );
}

/** The clock: a circle and two hands, which is the whole of what it teaches. */
export function ClockIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l3.5 2" />
    </Icon>
  );
}

/**
 * The tables: three rows of three dots.
 *
 * The array model, which is the picture a child is shown when multiplication is
 * introduced, and the only construction available — a multiplication sign is
 * two crossed lines and two crossed lines already mean a wrong answer.
 */
export function TablesIcon(props: Omit<IconProps, 'children'>) {
  const dots = [5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => ({ x, y })));
  return (
    <Icon {...props}>
      {dots.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="1.6" fill="currentColor" />
      ))}
    </Icon>
  );
}

/** The word: two lines of text, the second short, which is what a word list is. */
export function WordIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 9h16M4 15h10" />
    </Icon>
  );
}

/** An era: a span on a line, marked at both ends. A period, not a moment. */
export function EraIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 12h18" />
      <path d="M8 7v10M16 7v10" />
    </Icon>
  );
}

/**
 * The streak: days in a row, three behind and today still open.
 *
 * Dots rather than a flame. A flame is a metaphor for pressure, and the streak
 * here forgives a rest day (ADR-031) — it counts days, so it is drawn as days.
 */
export function StreakIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="10" cy="12" r="1.8" fill="currentColor" />
      <circle cx="15.5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="20" cy="12" r="2.4" />
    </Icon>
  );
}

/** The ladder: two uprights and three rungs. Steps, in the order you take them. */
export function LadderIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M8 3v18M16 3v18" />
      <path d="M8 8h8M8 12h8M8 16h8" />
    </Icon>
  );
}

/**
 * The stamp: a diamond inside a circle.
 *
 * A travel stamp (ADR-040), and the circle is the one it shares with the clock
 * — which is why the inside is a diamond and not two hands. The pair have to be
 * told apart at 20px by what is in them.
 */
export function StampIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5l4.5 4.5L12 16.5 7.5 12z" strokeLinejoin="round" />
    </Icon>
  );
}

/** Read aloud: something that speaks, and two marks that it is heard. */
export function SpeakIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 9h4l5-4v14l-5-4H4z" strokeLinejoin="round" />
      <path d="M17 9.5v5M20.5 7v10" />
    </Icon>
  );
}

/**
 * Right and wrong, which are the two that may never be told apart by colour.
 *
 * A tick and a cross: different shapes, different stroke counts, different
 * directions. §A's rule is that colour never carries a state alone, and these
 * two are where breaking it costs a colour-blind child the most.
 */
export function CorrectIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 12.5l5 5L20 6" />
    </Icon>
  );
}

export function WrongIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

/** Next: forwards, and only forwards. A round does not go back. */
export function NextIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 12h14" />
      <path d="M13 7l5 5-5 5" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A pupil: a head and a pair of shoulders.
 *
 * Bevelled rather than curved, because the primitives are straight and a
 * one-pixel arc at 20px is a smudge. No face — a face at this size is two dots
 * that read as eyes on everything else in the set.
 */
export function PupilIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1.5L9 15h6l4 3.5V20" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A family: two of them, one smaller and half a step behind.
 *
 * This is the icon the parent account will need (ADR-046) and it is drawn now
 * because the set is drawn now, not because the account exists.
 */
export function FamilyIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M3 19v-1.5L6 15h5l3 2.5V19" strokeLinejoin="round" />
      <circle cx="17.5" cy="11" r="2.5" />
      <path d="M14 21v-1l2.5-2h2l2.5 2v1" strokeLinejoin="round" />
    </Icon>
  );
}
