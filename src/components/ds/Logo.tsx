import { useId } from 'react';
import { brand } from '@/config/brand';

/**
 * The logo, drawn from `logo/lockup-inkt.svg` and `logo/merkteken-inkt.svg` in
 * the handoff rather than fetched: the delivered files carry a C2PA manifest
 * many times the size of the drawing, and set the name as text in Archivo,
 * which is the face the product already loads. Here the text is set in that
 * face through the token, so it renders the same on every machine.
 *
 * `currentColor`, so the logo is ink on paper and paper on ink without a
 * second drawing. It never takes an accent.
 *
 * The slogan never stands beside the word mark, only stacked under it and
 * aligned left (README, "Assets") — which is the page's job, not the logo's.
 */

/** The half-filled diamond: the mark on its own, 96 square. */
function Ruit({ clipId }: { readonly clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="48" width="96" height="48" />
        </clipPath>
      </defs>
      <path d="M48 10 86 48 48 86 10 48Z" fill="currentColor" clipPath={`url(#${clipId})`} />
      <path d="M48 10 86 48 48 86 10 48Z" fill="none" stroke="currentColor" strokeWidth="13" />
    </>
  );
}

/**
 * The lockup: the mark, then "leer", a small diamond, "nu" (560 by 140). At 18
 * to 20 high in a bar (S2), 36 to 44 on the first screen (S1). One accessible
 * name for the whole of it.
 */
export function Logo({ hoogte = 20 }: { readonly hoogte?: number | undefined }) {
  const clipId = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 560 140"
      height={hoogte}
      width={(hoogte * 560) / 140}
      role="img"
      aria-label={brand.name}
      focusable="false"
      style={{ display: 'block', color: 'var(--ink)' }}
    >
      <g transform="translate(0,7) scale(1.3125)">
        <Ruit clipId={clipId} />
      </g>
      <g
        transform="translate(213,5)"
        fill="currentColor"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
      >
        <text x="0" y="100" fontSize="100" letterSpacing="-3.5">
          leer
        </text>
        <path d="M196 71 210.5 85.5 196 100 181.5 85.5Z" />
        <text x="225" y="100" fontSize="100" letterSpacing="-3.5">
          nu
        </text>
      </g>
    </svg>
  );
}

/** The mark alone. Decorative: wherever it stands, the name is a step away. */
export function Merkteken({ maat = 32 }: { readonly maat?: number | undefined }) {
  const clipId = useId().replace(/:/g, '');

  return (
    <svg viewBox="0 0 96 96" width={maat} height={maat} aria-hidden="true" focusable="false">
      <Ruit clipId={clipId} />
    </svg>
  );
}
