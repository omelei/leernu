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
  ink: 'var(--inkt)',
  'ink-2': 'var(--tekst-secundair)',
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

/**
 * A test paper: a sheet with its corner turned and two ruled lines on it.
 *
 * The mark for the toetsstand (ADR-085), and deliberately not `DiplomaIcon`.
 * §E's rule is that an icon may not mean two things, and the rosette already
 * means the tafeldiploma — a switch that borrowed it would be saying "diploma"
 * on a page where a diploma is one of the six ways of practising, two blocks
 * further up.
 *
 * The turned corner is what keeps it out of `WordIcon`'s and `FreezerIcon`'s
 * silhouettes: a balloon has a tail below it and three bare rules have no
 * outline at all.
 */
export function PaperIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" />
    </Icon>
  );
}

// ---------------------------------------------------------------------------
// The tiles on a module page
//
// A tile is an icon and a word, so the icon is the only thing telling two of
// them apart at a glance — which is a job it did not have while every subject
// carried the same progress dot and every region the same globe.
//
// All of them are built from §E's four primitives and nothing else. Nothing
// curves, nothing is filled except the 6px dot where the dot is the meaning,
// and no two share a silhouette. Where a shape would have to be a picture of a
// real place, it is not drawn: §E's rule is that the map shape comes from the
// topography source, because a continent at 24px is a continent drawn wrong.

/**
 * The six werelddelen: one globe, and a dot where that part of it is.
 *
 * Not a silhouette of the continent. Six blobs at 24px are six blobs, and §E
 * forbids drawing a place as an icon for exactly that reason. What this says
 * instead is true and small: the same world, and roughly where on it — which is
 * also the question the row is asking. `Wereld` keeps the ruled globe, because
 * it is the whole of it and has no part to point at.
 */
function WerelddeelIcon({
  cx,
  cy,
  ...props
}: Omit<IconProps, 'children'> & { readonly cx: number; readonly cy: number }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx={cx} cy={cy} r="3" fill="currentColor" />
    </Icon>
  );
}

export function AfrikaIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={12} cy={16.6} />;
}

export function AzieIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={15.4} cy={9} />;
}

export function EuropaIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={12} cy={7.4} />;
}

export function NoordAmerikaIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={8.6} cy={9} />;
}

export function ZuidAmerikaIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={8.6} cy={15} />;
}

export function OceanieIcon(props: Omit<IconProps, 'children'>) {
  return <WerelddeelIcon {...props} cx={15.4} cy={15} />;
}

/**
 * Nederland: a pin, because it is the one entry on that row that is not a
 * werelddeel and not the world.
 *
 * A seventh globe with a dot on it would have put the country in the same
 * family as the six continents and at the same size, which is the one thing a
 * row about how big the map is should not say. A pin means "here" and says
 * nothing about area.
 *
 * Told apart from `PointIcon` by being symmetrical: that one is a cursor and
 * leans, this one hangs straight down from its head.
 */
export function PinIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3l6 7-6 11-6-11z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2" />
    </Icon>
  );
}

/**
 * Provincies: one area, in parts of unequal size.
 *
 * It was topography's diamond with a line across it, which is the obvious
 * drawing and the wrong one twice over. `icons.test.ts` caught the first: that
 * diamond is `AreaIcon`'s exact path and the line is `EraIcon`'s, so the set
 * had two silhouettes it was not allowed to have. The second is what the test
 * cannot see — `AreaIcon` is the module pictogram and sits in the eyebrow at
 * the top of this very page, so the tile would have been the same shape as the
 * heading above it.
 *
 * A frame with two cuts instead. Unequal on purpose: provinces are not a grid,
 * and `GridIcon` is what a grid is for.
 */
export function ProvincieIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 6h16v12H4z" strokeLinejoin="round" />
      <path d="M11 6v12" />
      <path d="M11 12h9" />
    </Icon>
  );
}

/** Steden: two buildings on a ground line, at different heights. */
export function StadIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 20h18" />
      <path d="M6 20v-8h5v8" strokeLinejoin="round" />
      <path d="M13 20v-12h5v12" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * Wateren: two ruled waves.
 *
 * Zigzag rather than curved, which is §E's constraint and is also what stays
 * legible at 20px. Told apart from `FreezerIcon`'s three flat stripes by having
 * a direction, and from it again by there being two rather than three.
 */
export function WaterIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 10l4.5 3 4.5-3 4.5 3 4.5-3" />
      <path d="M3 16l4.5 3 4.5-3 4.5 3 4.5-3" />
    </Icon>
  );
}

/** De Waddeneilanden: land above a water line, in more than one piece. */
export function EilandIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 18h18" />
      <path d="M4.5 18l3-5 3 5z" strokeLinejoin="round" />
      <path d="M13.5 18l2.5-4 2.5 4z" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * The mix, in both modules: two paths that cross.
 *
 * One drawing for one idea. Topo-mix and Rekenmix are the same thing said about
 * different content and they are never on a page together, so a second shape
 * would be a second thing to recognise for no second meaning.
 */
export function MixIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 7h4l9 10h4" strokeLinejoin="round" />
      <path d="M3 17h4l9-10h4" strokeLinejoin="round" />
      <path d="M17 4l3 3-3 3" strokeLinejoin="round" />
      <path d="M17 14l3 3-3 3" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * Landen: two areas and the border between them.
 *
 * The border kinks, which is the whole of what tells this apart from a grid —
 * `GridIcon` is ruled square and regular, and a frontier is neither.
 */
export function LandIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 5h16v14H4z" strokeLinejoin="round" />
      <path d="M13 5l-3 5 3 4-2 5" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A grid: the flags that look alike, laid side by side. It was the tables' mark
 * until the tables took the sign itself (ADR-100), and the keersommen' until
 * they took it in turn (ADR-110).
 */
export function GridIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 4h16v16H4z" strokeLinejoin="round" />
      <path d="M4 9.33h16M4 14.67h16" />
      <path d="M9.33 4v16M14.67 4v16" />
    </Icon>
  );
}

/**
 * Deelsommen: the colon, which is the sign a Dutch primary school divides with.
 *
 * Never the obelus. The sums themselves are written "56 : 7" and an icon that
 * used ÷ would be teaching a second notation on the tile that opens them.
 */
export function DeelIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="7.5" r="2" fill="currentColor" />
      <circle cx="12" cy="16.5" r="2" fill="currentColor" />
    </Icon>
  );
}

/**
 * The four steps of the clock, as four faces.
 *
 * A subject tile is a mark and a word (ADR-089), and the mark is the only thing
 * that tells two of them apart before the word is read. For klokkijken that
 * mark can *be* the subject: whole hours, half hours and quarters differ by
 * exactly where the big hand points, so the icon points it there. A child who
 * cannot yet read "kwartieren" can still see which tile is the one with the
 * hand on the three.
 *
 * They share the circle with `ClockIcon`, which is the module's own mark, and
 * §E allows that for the same reason it allows the diamond inside `StampIcon`:
 * what may not be shared is the silhouette, and four different hand positions
 * are four different silhouettes. It is also the honest relationship — these
 * are the module's mark, saying four particular times.
 *
 * Whole hours: the big hand straight up, the little one on the three.
 */
export function UurIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12V6M12 12h4.5" />
    </Icon>
  );
}

/** Half hours: the big hand straight down, which is what "half" looks like. */
export function HalfUurIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12v6M12 12l-4-2.5" />
    </Icon>
  );
}

/** Quarters: the big hand on the three, and the little one just past twelve. */
export function KwartierIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12h6M12 12V8" />
    </Icon>
  );
}

/**
 * Five minutes: the marks round the rim, which is what a child counts.
 *
 * The one of the four that is not a hand position, because the subject is not a
 * position — it is the eight of them that are left over, and what they have in
 * common is that you get to them by counting round.
 */
export function MinuutIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v2M20.5 12h-2M12 20.5v-2M3.5 12h2" />
      <path d="M12 12l3.5-3" />
    </Icon>
  );
}

/**
 * Keersommen: the times sign, the one the sums themselves are written with.
 * It was the tables' mark until the tables got a table (ADR-110).
 *
 * An operator beside `PlusIcon` rather than `WrongIcon` again: the plus's two
 * strokes at the plus's length, turned an eighth, so the rekenen row reads
 * × : + − as one family. `WrongIcon` runs further, corner to corner. The two
 * share a row only when "Oefen je fouten" is on it, and there the word says
 * which is which (ADR-100).
 */
export function KeerIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10M17 7L7 17" />
    </Icon>
  );
}

/**
 * Tafels: a table — a top and two legs.
 *
 * The pun is the point. A child who cannot read "tafels" yet knows what a tafel
 * looks like, and the times sign went to the keersommen beside it, which are
 * the sums past the tables that the sign is left to name (ADR-110). The top is
 * a slab rather than one line, so at 20px it is still a table and not
 * `MinIcon` on legs.
 */
export function TafelIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 8h18v3H3z" strokeLinejoin="round" />
      <path d="M6 11v9M18 11v9" />
    </Icon>
  );
}

/** Plussommen: the sign, drawn at the size a mark gets rather than a glyph. */
export function PlusIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

/**
 * Minsommen: the sign.
 *
 * One line, and the only icon in this set that is one line — `FreezerIcon` is
 * three and `WaterIcon` is two that bend. Beside a plus, in a row of four kinds
 * of sum, it is not something anyone has to work out.
 */
export function MinIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

// ---------------------------------------------------------------------------
// The frame
//
// The destinations had no marks while they stood in the app bar as words. Below
// 1200 they lie along the bottom now (ADR-093), where a tab bar is a row of
// marks with a word under each and a child finds the one they want by its shape
// before they read it. Onthouden takes the freezer and Jij takes the pupil,
// which already mean those things; Vandaag needed one of its own, and the
// control that opens the modules needed two.

/**
 * Vandaag: a sun.
 *
 * Today, drawn as the thing a child already draws for it — a small circle and
 * eight straight rays. Another circle in a set that warns about them, told
 * apart from the clock, the stamp, the diploma and the globe by being small and
 * by everything around it pointing outwards.
 */
export function TodayIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </Icon>
  );
}

/**
 * The modules, closed: three rows with a dot before each.
 *
 * Not the three bare stripes a menu usually is, because that drawing is
 * `FreezerIcon` and §E does not let one silhouette mean two things. A list with
 * its bullets is also what the control opens into.
 */
export function MenuIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="7" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1.5" fill="currentColor" />
      <path d="M9 7h11M9 12h11M9 17h11" />
    </Icon>
  );
}

/*
 * Four chevrons: open, close, and one step either way along a row.
 *
 * One stroke each and no shaft, which is what keeps them apart from `NextIcon`:
 * an arrow means "the next question", a chevron means "more of this".
 */

export function ChevronDownIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" strokeLinejoin="round" />
    </Icon>
  );
}

export function ChevronUpIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 15l6-6 6 6" strokeLinejoin="round" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" strokeLinejoin="round" />
    </Icon>
  );
}

export function ChevronRightIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" strokeLinejoin="round" />
    </Icon>
  );
}

/**
 * A star: ten correct answers (ADR-096).
 *
 * Five points and straight edges, which is what §E's primitives allow and what
 * a star is anyway. One drawing for an empty star and a full one: the filling
 * is the stylesheet's (`.tk-ster-vol`), so the pair can never drift apart.
 */
export function StarIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
