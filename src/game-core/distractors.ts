/**
 * The wrong answers.
 *
 * Multiple choice is the step between pointing and typing (ADR-029's order),
 * and what makes it a step rather than a shortcut is which three names stand
 * beside the right one. Three provinces from the far side of the country turn
 * the question into a reading test. Three that border it ask whether the child
 * knows where they are.
 *
 * The neighbour lists are content, computed from the geodata by
 * `tools/content/build-neighbours.mjs` (ADR-036). Nothing here knows any
 * geometry; it reads an ordered list and decides which of it to use.
 */

/** Three wrong answers beside the right one: four options, the design's K5. */
export const DISTRACTOR_COUNT = 3;

export interface DistractorInput {
  /** The item the question is about. Never offered as its own distractor. */
  readonly answerId: string;
  /** Neighbours, strongest first — see ADR-036 for what "strongest" means. */
  readonly neighbours: readonly string[];
  /**
   * Everything else in the set. Only reached when the neighbours run out, which
   * a full content build does not allow — `neighbours.test.ts` requires three
   * of them for every item. It is here because a set added later could be too
   * small, and a question with two options is worse than a weak third.
   */
  readonly pool: readonly string[];
  readonly count?: number;
  readonly rng?: () => number;
}

function shuffle<T>(source: readonly T[], rng: () => number): T[] {
  const out = [...source];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * The nearest neighbour always, the rest at random from the others.
 *
 * Both halves of that are deliberate. Keeping the first means the strongest
 * confusion is on offer every time the item is asked, which is the one a child
 * has to resolve to have learned anything. Varying the other two means the same
 * item asked twice in a round is not the same question twice, so a child cannot
 * answer the second from the shape of the first.
 */
export function pickDistractors(input: DistractorInput): string[] {
  const rng = input.rng ?? Math.random;
  const count = input.count ?? DISTRACTOR_COUNT;

  const candidates = input.neighbours.filter((id) => id !== input.answerId);
  const [nearest, ...rest] = candidates;

  const picked = nearest === undefined ? [] : [nearest];
  picked.push(...shuffle(rest, rng).slice(0, Math.max(0, count - picked.length)));

  if (picked.length < count) {
    const taken = new Set([input.answerId, ...picked]);
    const spare = input.pool.filter((id) => !taken.has(id));
    picked.push(...shuffle(spare, rng).slice(0, count - picked.length));
  }

  return picked;
}

/**
 * The four options in the order they are shown.
 *
 * Shuffled rather than sorted, and shuffled here rather than in the component:
 * a position a child can predict is a question they can answer without reading
 * it, and a component that re-renders must not deal the options again.
 */
export function buildOptions(input: DistractorInput): string[] {
  const rng = input.rng ?? Math.random;
  return shuffle([input.answerId, ...pickDistractors(input)], rng);
}
