/**
 * The mark beside the feedback after an answer, the same in all four rounds.
 *
 * The handoff's shape rules as one component (design_handoff_leernu, "De vier
 * vormregels"): goed is a solid green square with a tick, fout is the hatch
 * with a cross. The near miss on the map (ADR-017) is neither, so it is an open
 * square with an arrow. Colour adds speed and the shape carries the meaning: in
 * grey the three are still three.
 *
 * The classes are spelled out whole rather than built from the outcome, so
 * Tailwind finds them in this file and keeps their rules.
 */
export type Uitkomst = 'goed' | 'bijna' | 'fout';

const KLASSE: Record<Uitkomst, string> = {
  goed: 'tk-teken tk-teken-goed',
  bijna: 'tk-teken tk-teken-bijna',
  fout: 'tk-teken tk-teken-fout',
};

export function UitkomstTeken({ uitkomst }: { readonly uitkomst: Uitkomst }) {
  return (
    <span aria-hidden="true" className={KLASSE[uitkomst]}>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        focusable="false"
      >
        {uitkomst === 'goed' && <path d="M4 12l5 5L20 6" />}
        {uitkomst === 'fout' && <path d="M6 6l12 12M18 6L6 18" />}
        {uitkomst === 'bijna' && <path d="M5 12h14M13 6l6 6-6 6" />}
      </svg>
    </span>
  );
}
