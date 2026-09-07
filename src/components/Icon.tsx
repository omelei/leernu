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
 * §E specifies sixteen icons. Two are built here, because two are what has
 * been needed: the freezer for the item status, and the area for the module
 * rail. The other fourteen — flag, clock, tables, word, era, streak, ladder,
 * stamp, read-aloud, right, wrong, next, pupil, family — are outstanding, and
 * are listed in the delivery notes rather than stubbed, because an icon that is
 * a placeholder is worse than an icon that is missing: the placeholder ships.
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
