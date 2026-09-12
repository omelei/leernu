/**
 * The arithmetic behind the dot, the diamonds and the counter, apart from the
 * components that draw them so a test can hold it without rendering anything.
 */

/**
 * The sizes the dot is drawn at (README, "De punt"). A size outside this list
 * is a new size, and the handoff asks for none.
 */
export const PUNT_MATEN = [18, 22, 28, 32, 40, 44, 56] as const;
export type PuntMaat = (typeof PUNT_MATEN)[number];

/**
 * A retention figure made safe for drawing: a whole percentage between 0 and
 * 100. A value from a store is not a promise — 1.02 must not draw a dot past
 * its own ring, and NaN must not draw anything at all.
 */
export function puntProcent(procent: number): number {
  if (!Number.isFinite(procent)) return 0;
  return Math.round(Math.min(100, Math.max(0, procent)));
}

/**
 * The dot's fill, exactly as the README writes it:
 * `conic-gradient(<accent> 0 <pct>%, <leeg> <pct>% 100%)`.
 */
export function puntVulling(procent: number): string {
  const pct = puntProcent(procent);
  return `conic-gradient(var(--accent) 0 ${pct}%, var(--rail-empty) ${pct}% 100%)`;
}

/**
 * The counter in a round, with a leading zero: "07 / 12". Without it the
 * picture shifts on every correct answer from 9 to 10 (stap 7, point 12). The
 * number is padded to the width of the total, so a round of 100 reads "007".
 */
export function tellerTekst(huidig: number, totaal: number): string {
  const breedte = Math.max(2, String(Math.max(0, totaal)).length);
  const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(breedte, '0');
  return `${pad(huidig)} / ${pad(totaal)}`;
}

/** What one diamond in a round shows: answered, or still to come. */
export type RuitStand = 'gedaan' | 'open';

/**
 * The diamonds of a round. A diamond counts a question and nothing else: it
 * fills when the question is answered, right or wrong, because it says how far
 * the round is — never how well (README: "een ruit telt vragen in een ronde").
 */
export function ruitStanden(beantwoord: number, totaal: number): RuitStand[] {
  const n = Math.max(0, Math.floor(totaal));
  const klaar = Math.min(n, Math.max(0, Math.floor(beantwoord)));
  return Array.from({ length: n }, (_, i) => (i < klaar ? 'gedaan' : 'open'));
}
