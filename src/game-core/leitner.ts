import type { Item, ItemState, LeitnerBox } from './types';

/**
 * The five-box Leitner scheduler (ADR-005).
 *
 * Chosen over SM-2 for a reason that is not technical: a teacher can be told how
 * this works in one sentence, and the mastery figure a teacher eventually acts on
 * is only as trustworthy as the algorithm behind it is explainable.
 */

/** Days until an item in each box comes back. Spec section 4.2. */
export const INTERVAL_DAYS: Readonly<Record<LeitnerBox, number>> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 21,
};

export const MAX_BOX: LeitnerBox = 5;

/** How a round is filled: due work first, some new material, a little revision. */
export const ROUND_MIX = { due: 0.7, nieuw: 0.2, opfris: 0.1 } as const;

/** After a wrong answer the item returns this many questions later, same round. */
export const RETRY_GAP = 3;

const DAY_MS = 86_400_000;

export function nextBox(box: LeitnerBox, correct: boolean): LeitnerBox {
  if (!correct) return 1;
  return Math.min(box + 1, MAX_BOX) as LeitnerBox;
}

export function scheduleFrom(box: LeitnerBox, now: Date): Date {
  return new Date(now.getTime() + INTERVAL_DAYS[box] * DAY_MS);
}

export function emptyState(itemId: string): ItemState {
  return {
    itemId,
    box: 1,
    laatsteReview: null,
    volgendeReview: null,
    goedCount: 0,
    foutCount: 0,
  };
}

/** Applies one answer. Pure: returns the next state, mutates nothing. */
export function review(state: ItemState, correct: boolean, now: Date): ItemState {
  const box = nextBox(state.box, correct);
  return {
    itemId: state.itemId,
    box,
    laatsteReview: now.toISOString(),
    volgendeReview: scheduleFrom(box, now).toISOString(),
    goedCount: state.goedCount + (correct ? 1 : 0),
    foutCount: state.foutCount + (correct ? 0 : 1),
  };
}

export function isDue(state: ItemState, now: Date): boolean {
  if (state.volgendeReview === null) return true;
  return new Date(state.volgendeReview).getTime() <= now.getTime();
}

/**
 * Mastery as a whole number, straight from the box: 0, 25, 50, 75, 100.
 *
 * Deliberately not decayed by recency. A percentage that quietly drops while
 * nobody is looking is exactly the black box ADR-005 was avoiding — if the
 * number is stale, say it is stale (see `isStale`) rather than moving it.
 */
export function masteryPercent(state: ItemState | undefined): number {
  if (!state) return 0;
  return (state.box - 1) * 25;
}

/** True when an item is overdue by more than its own interval again. */
export function isStale(state: ItemState, now: Date): boolean {
  if (state.volgendeReview === null) return false;
  const due = new Date(state.volgendeReview).getTime();
  return now.getTime() > due + INTERVAL_DAYS[state.box] * DAY_MS;
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
 * Everything the scheduler needs from a thing a child practises: an identity.
 *
 * Generic rather than `Item` because a multiplication fact is not a place and
 * has no name, no aliases and no region — and the spacing that decides when it
 * comes round again is the same spacing either way. Narrowing this to the
 * geography type would have meant a second copy of the schedule, which is the
 * one piece of this product that must not exist twice.
 */
export interface Schedulable {
  readonly id: string;
}

export interface ComposeRoundInput<T extends Schedulable = Item> {
  readonly items: readonly T[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly size: number;
  readonly now: Date;
  readonly rng?: () => number;
}

/**
 * Builds one round: roughly 70% due, 20% unseen, 10% already known.
 *
 * When a pool cannot fill its share the shortfall is taken from the others, in
 * the order due → unseen → known. A round that comes up short because a child
 * has no new material left would be a worse experience than an imperfect mix,
 * and the mix is a target rather than a contract.
 */
export function composeRound<T extends Schedulable = Item>(input: ComposeRoundInput<T>): T[] {
  const { items, states, size, now } = input;
  const rng = input.rng ?? Math.random;
  if (size <= 0 || items.length === 0) return [];

  const due: T[] = [];
  const nieuw: T[] = [];
  const bekend: T[] = [];

  for (const item of items) {
    const state = states.get(item.id);
    if (!state || state.laatsteReview === null) {
      nieuw.push(item);
    } else if (isDue(state, now)) {
      due.push(item);
    } else {
      bekend.push(item);
    }
  }

  // Most overdue first, so the work that has waited longest is not the work that
  // gets dropped when a round is smaller than the backlog.
  due.sort((a, b) => dueTime(states, a) - dueTime(states, b));

  const shuffledNieuw = shuffle(nieuw, rng);
  const shuffledBekend = shuffle(bekend, rng);

  const dueTarget = Math.round(size * ROUND_MIX.due);
  const nieuwTarget = Math.round(size * ROUND_MIX.nieuw);
  const opfrisTarget = size - dueTarget - nieuwTarget;

  const picked: T[] = [
    ...due.slice(0, dueTarget),
    ...shuffledNieuw.slice(0, nieuwTarget),
    ...shuffledBekend.slice(0, opfrisTarget),
  ];

  if (picked.length < size) {
    const used = new Set(picked.map((i) => i.id));
    const leftovers = [...due, ...shuffledNieuw, ...shuffledBekend].filter((i) => !used.has(i.id));
    picked.push(...leftovers.slice(0, size - picked.length));
  }

  return shuffle(picked, rng);
}

function dueTime(states: ReadonlyMap<string, ItemState>, item: Schedulable): number {
  const at = states.get(item.id)?.volgendeReview;
  return at === null || at === undefined ? 0 : new Date(at).getTime();
}

/**
 * Puts a missed item back into the queue, `gap` questions further on.
 *
 * Spec section 4.2 asks for three questions in between. If the round is nearly
 * over the item goes last rather than being dropped: seeing it again in the same
 * session is the point, and a shorter gap is better than no second chance.
 */
export function reinsertAfterMistake<T>(
  queue: readonly T[],
  item: T,
  position: number,
  gap: number = RETRY_GAP,
): T[] {
  const out = [...queue];
  const target = Math.min(position + gap, out.length);
  out.splice(target, 0, item);
  return out;
}
