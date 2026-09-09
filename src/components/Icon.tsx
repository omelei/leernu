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
 * Two things the construction forces. Nothing here curves: the primitives are
 * straight, so a shoulder is a bevel rather than an arc, which is also what
 * survives being drawn at 20px. And no two icons may share a silhouette —
 * which is why the tables sign sits on a key rather than bare, since a bare
 * cross is already the drawing for a wrong answer.
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
 * A diamond, which is what K1 draws in the rail — a square stood on its point,
 * and one of §E's four primitives used whole. It replaced a bevelled outline
 * with an inner boundary, which was more drawing for less recognition: at 24px
 * the boundary was a scratch and the outline was a blob.
 *
 * It is a shape rather than a picture of the Netherlands on purpose. §E's rule
 * is that the real map shape comes from the topography source and never from an
 * icon, because an icon of a country is a country drawn wrong at 24px.
 *
 * The diamond is also the inside of `StampIcon`. They are told apart by the
 * circle around that one, which is the whole of what a stamp is.
 */
export function AreaIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3l9 9-9 9-9-9z" strokeLinejoin="round" />
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
 * The tables: a times sign, on a key.
 *
 * The sign is what was asked for and it is the right sign — a child who is
 * learning the tables is learning ×, and a three-by-three array of dots is the
 * picture their teacher drew once in group 4 and never again.
 *
 * The frame around it is not decoration. `WrongIcon` is two crossed lines
 * corner to corner, and §E's rule is that an icon may not mean two things: a
 * bare cross in the rail would be the same drawing a child sees when they get
 * an answer wrong. Inside a key it is an operator on a calculator, which is a
 * different silhouette at any size and the thing the module actually is.
 */
export function TablesIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
    </Icon>
  );
}

/**
 * The word: a speech balloon.
 *
 * Language is what is said before it is what is written, and this module is
 * where a child meets a word rather than a spelling of it. Bevelled at the
 * corners and with a straight tail, because the primitives are straight and an
 * arc at 20px is a smudge.
 *
 * Two ruled lines were the previous drawing. They were a word list, which is
 * one form the module takes, and they were also very nearly `EraIcon` and very
 * nearly `FreezerIcon` — three icons of horizontal lines in one set.
 */
export function WordIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 6h16v10H10l-4 4v-4H4z" strokeLinejoin="round" />
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

/* ---------------------------------------------------------------------------
 * The ways of practising, which §E does not name and does not forbid.
 *
 * The sixteen above are §E's list and it is closed: `icons.test.ts` holds it
 * to that. What §E also fixes is the reason the list can be closed at all —
 * four primitives and a construction rule, "zodat de set uitbreidbaar blijft
 * zonder illustrator". These six are that rule applied to a list §E never had
 * to make, because when it was written a way of practising was a word on a
 * card and not a thing with a face.
 *
 * They earn their place by being the difference between six cards a child
 * reads and six cards a child recognises. That is the whole argument for an
 * icon here, and it is why there is not one on the sets above them: a set is a
 * name, and a picture of "Provincies van Nederland" is a map drawn wrong at
 * 24px.
 *
 * The same rules apply as to the sixteen. Straight lines, one weight, no
 * colour, and no two silhouettes alike — which is why exploring is a loupe
 * with a handle rather than another circle, and surviving is a shield rather
 * than three dots that would read as the streak.
 */

/**
 * Pointing: an arrow, on the slant a cursor sits at.
 *
 * Not a hand. A hand at 20px is a mitten, and this mark has to survive beside
 * five others at that size.
 */
export function PointIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 3l4 18 3-7 7-3z" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * Multiple choice: four boxes, and a mark in one of them.
 *
 * The design fills that box solid. §E allows fill for a dot and for nothing
 * else, so the box is marked rather than flooded — which also keeps the count
 * of four legible, and four is the thing the mode is named for.
 */
export function ChoiceIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
      <circle cx="17" cy="17" r="1.8" fill="currentColor" />
    </Icon>
  );
}

/**
 * Typing: a key board and the bar under it.
 *
 * Two shapes, because at 20px a row of little keys is a smear. It is told
 * apart from `TablesIcon` — also a rectangle — by being wider than it is tall
 * and by having nothing inside it.
 */
export function KeyboardIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M8 14.5h8" />
    </Icon>
  );
}

/**
 * Exploring: a loupe, which is looking without being asked anything.
 *
 * The circle is the third in this set and the handle is what separates it from
 * the other two at any size — the clock has hands inside it and the stamp has
 * a diamond, and both of those are contained. This one sticks out.
 */
export function ExploreIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </Icon>
  );
}

/** The lightning round: a bolt. Sixty seconds, drawn as the thing it is named after. */
export function BoltIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M13 3L6 13h5l-2 8 8-11h-5z" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * Surviving: a shield, bevelled rather than curved.
 *
 * Three lives are not three dots — that drawing is already the streak, and a
 * child who is about to lose one should not be shown the mark for days in a
 * row. What three lives mean is that you are being protected while you get it
 * wrong, which is what a shield is.
 */
export function ShieldIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3l7 3v5.5L12 20.5 5 11.5V6z" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * The way on: a triangle pointing right, filled.
 *
 * Not `NextIcon`, which is an arrow and means "the next question in a round
 * that is already running". This one means "begin", and the difference between
 * the two is worth a second drawing: a child on K2 has not started anything
 * yet, and a filled triangle is the mark every device they own uses for that.
 */
export function GoIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M8 4.5l12 7.5-12 7.5z" strokeLinejoin="round" fill="currentColor" />
    </Icon>
  );
}

/**
 * A diploma: a rosette with two ribbons.
 *
 * The circle is shared with the clock and the stamp, which is exactly what §E
 * warns about — so the inside is empty and the ribbons below it carry the
 * meaning. A stamp is something collected; this is something passed, and the
 * ribbon is what a child recognises as the difference.
 */
export function DiplomaIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M8.5 12.5L7 21l5-2.5 5 2.5-1.5-8.5" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A rank: three chevrons, the mark every game a child plays uses for a tier.
 *
 * It is drawn once and coloured by the material it stands for, which is the
 * same trick the animal grid uses: five rungs are five values of one variable
 * rather than five drawings. Chevrons rather than a medal because the set
 * already has three circles in it — the clock, the stamp and the diploma — and
 * §E's rule is that no two silhouettes may be alike.
 *
 * Stacked, so the drawing itself says "one above the other". A single chevron
 * would be an arrow, and this set already has two of those.
 */
export function RankIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 9l7-5 7 5" strokeLinejoin="round" />
      <path d="M5 14l7-5 7 5" strokeLinejoin="round" />
      <path d="M5 19l7-5 7 5" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * What is still wrapped up: a parcel with a band and a bow.
 *
 * The collection used to name everything in it — "vos in zwart, vanaf niveau
 * 7" — which told a child the whole of what was coming and left them nothing
 * to open. This is the mark that takes that back (ADR-081). It stands in for
 * every animal that has not been earned, so which one it turns out to be is
 * the surprise, and the level under it is still exactly what it costs.
 *
 * A parcel and not a padlock. A lock says "you may not"; a parcel says "not
 * yet opened", and those are two different sentences to say to a child.
 */
export function MysteryIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="3" y="8.5" width="18" height="12.5" rx="2" />
      <path d="M3 13.5h18M12 8.5V21" />
      <path d="M12 8.5L8 4.5M12 8.5l4-4" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A region on the globe: a circle with a meridian and a parallel through it.
 *
 * Topography's first step asks where on the map before it asks what, and that
 * step needs a mark of its own. It is a fourth circle in a set that already
 * warns about them, so the inside is what tells it apart: the clock has hands
 * that meet at the middle, the stamp a diamond, the diploma nothing — this one
 * is ruled across in both directions and touches the rim.
 */
export function GlobeIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5v17" />
    </Icon>
  );
}
