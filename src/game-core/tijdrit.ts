/**
 * The tijdrit: what a time is, and what makes one a record.
 *
 * The other five ways of practising ask whether a child knows where something
 * is. This one asks how *fast* they know it, which is a different thing and a
 * real one: a child who has learned Drenthe answers in a second, and a child who
 * works it out from the shape of the country takes eight. Both are counted as
 * correct everywhere else in this product, and both should be — but the second
 * one is not finished learning, and nothing on any screen could say so.
 *
 * Three rules keep it from turning into the thing this product argues against.
 *
 * **Nothing is taken away.** A bliksemronde ends when the clock does, which is a
 * time limit and is why it sits behind the setting that says haste does not help
 * you remember. A tijdrit has no limit: the round waits exactly as long as the
 * child needs and the stopwatch only reports. That is the difference between a
 * clock that answers for you and a clock that watches (ADR-090).
 *
 * **A wrong answer costs time, not anything else.** Five seconds, added to the
 * total and shown as what it is. Without it the fastest round would be the one
 * where nobody looked, and a game that rewards guessing teaches guessing. It
 * costs nothing outside the round: the same coins, the same streak, the same
 * Leitner box as a wrong answer anywhere else.
 *
 * **A record is against yourself and nobody else.** Spec §10: nothing in this
 * product ranks one child against another, and there is no server to rank them
 * on. What is stored is one number per track, on this device, for this child.
 */

/** What a question not answered correctly adds to the clock. */
export const STRAFSECONDEN = 5;

export interface Tijdrit {
  /** Milliseconds actually spent answering, feedback and pauses excluded. */
  readonly antwoordMs: number;
  /** How many were not right, whether guessed wrong or given up on. */
  readonly fout: number;
  /** What those cost. */
  readonly strafMs: number;
  /** The two together, which is the time a record is measured in. */
  readonly totaalMs: number;
}

/**
 * The time so far.
 *
 * Answer time rather than wall-clock time, and that is the one arithmetic
 * decision here worth arguing about. A round has feedback between its
 * questions — "Brazilië — goed", and a child reading the weetje under it — and
 * charging for that would mean the fastest round is the one where nothing was
 * read. So the clock runs from the moment a name appears to the moment the
 * child answers it, and stops in between.
 */
export function tijdritTijd(antwoordMs: number, fout: number): Tijdrit {
  const strafMs = Math.max(0, fout) * STRAFSECONDEN * 1000;
  const gerond = Math.max(0, Math.round(antwoordMs));
  return { antwoordMs: gerond, fout: Math.max(0, fout), strafMs, totaalMs: gerond + strafMs };
}

/**
 * Which record a round is a round of.
 *
 * The set and the number of questions, because a time over ten questions and a
 * time over a hundred are not the same achievement and a single "best time" per
 * set would quietly reward whoever chose the shortest round (ADR-074 lets a
 * child choose). Twelve provinces and twelve provinces are the same track, and
 * that is exactly what makes the second attempt worth making.
 */
export function baanVan(setId: string, vragen: number): string {
  return `${setId}:${vragen}`;
}

/**
 * Whether this round may set a record at all.
 *
 * Only a round that was finished. A round can be stopped early and what was
 * answered is kept (ADR-052) — which is right, and which would otherwise mean
 * three questions of fifteen setting a time nothing could ever beat.
 */
export function teltAlsRit(beantwoord: number, gevraagd: number): boolean {
  return gevraagd > 0 && beantwoord >= gevraagd;
}

export function isNieuwRecord(totaalMs: number, staand: number | null): boolean {
  return totaalMs > 0 && (staand === null || totaalMs < staand);
}

/**
 * A time as a stopwatch reads it: minutes, seconds, and one tenth.
 *
 * The tenth is not decoration. Twelve provinces take a child who knows them
 * about twenty seconds, two attempts a week apart differ by a second or two,
 * and a figure rounded to whole seconds would report "the same" for a round
 * that was measurably faster — which is the one thing this way of practising
 * exists to show.
 */
export function tijdInBeeld(ms: number): string {
  const tienden = Math.round(Math.max(0, ms) / 100);
  const minuten = Math.floor(tienden / 600);
  const seconden = Math.floor((tienden % 600) / 10);
  return `${minuten}:${String(seconden).padStart(2, '0')},${tienden % 10}`;
}

/**
 * One answer's time, which is a small number and reads better as one.
 *
 * "2,4 s" rather than "0:02,4": between two questions a child is comparing this
 * answer with the last one, and a field of zeroes and colons is three
 * characters of nothing in front of the two that changed.
 */
export function secondenInBeeld(ms: number): string {
  const tienden = Math.round(Math.max(0, ms) / 100);
  return `${Math.floor(tienden / 10)},${tienden % 10}`;
}
