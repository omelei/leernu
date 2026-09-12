import { act, renderHook, waitFor } from '@testing-library/react';
import type { RoundRule } from '@/game-core';
import { finishSession, saveAnswer, startSession } from '@/store/progress';
import { useRoundCore, type RondeOpzet } from './useRoundCore';

/*
 * The bookkeeping every one-question-at-a-time round shares (ADR-101).
 *
 * The store is replaced rather than faked: what is under test is when the core
 * writes and what it writes, and an IndexedDB in jsdom would be testing idb.
 */
vi.mock('@/store/progress', () => ({
  loadItemStates: vi.fn(async () => new Map()),
  startSession: vi.fn(async () => 'sessie'),
  saveAnswer: vi.fn(async () => undefined),
  finishSession: vi.fn(async () => undefined),
}));
vi.mock('@/store/streakStore', () => ({
  recordRoundFinished: vi.fn(async () => ({ state: { huidigeStreak: 1 } })),
}));
vi.mock('@/store/rewardStore', () => ({
  applyRoundRewards: vi.fn(async () => null),
}));

interface Vraag {
  readonly item: { readonly id: string };
}

const itemVan = (vraag: Vraag) => vraag.item;

// Stable, like the rule tables the modules pass: a fresh object every render
// would compose the round again every render.
const TIEN: RoundRule = { kind: 'fixed', aantal: 10 };
const LEVENS: RoundRule = { kind: 'levens', levens: 3 };

function opzet(ids: readonly string[]): RondeOpzet<string, Vraag> {
  return { set: 'set', itemIds: ids, questions: ids.map((id) => ({ item: { id } })) };
}

function ronde(
  options: {
    readonly ids?: readonly string[];
    readonly basisRegel?: RoundRule;
    readonly aantal?: number | null;
    readonly toetsstand?: boolean;
    readonly stoptBijFout?: boolean;
    readonly stel?: () => RondeOpzet<string, Vraag>;
  } = {},
) {
  const ids = options.ids ?? ['a', 'b', 'c'];
  const seen: RoundRule[] = [];

  const hook = renderHook(() =>
    useRoundCore<string, Vraag, { readonly id: string }, string>({
      setId: 'test',
      mode: 'meerkeuze',
      basisRegel: options.basisRegel ?? TIEN,
      aantal: options.aantal ?? null,
      toetsstand: options.toetsstand ?? false,
      stoptBijFout: options.stoptBijFout ?? false,
      itemVan,
      stel:
        options.stel ??
        ((_states, rule) => {
          seen.push(rule);
          return opzet(ids);
        }),
    }),
  );

  return { ...hook, seen };
}

const goed = { correct: true, given: 'x', recorded: null } as const;
const fout = { correct: false, given: 'y', recorded: 'y' } as const;
const weetNiet = { correct: false, given: null, recorded: 'weet-niet', spendsALife: false };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRoundCore', () => {
  it('asks what it was given, in order, and finishes after the last', async () => {
    const { result } = ronde({ ids: ['a', 'b'] });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    expect(vi.mocked(startSession)).toHaveBeenCalledWith('meerkeuze', ['a', 'b'], 'test');
    expect(result.current.kern.total).toBe(2);
    expect(result.current.kern.question?.item.id).toBe('a');

    act(() => result.current.settle(goed));
    expect(result.current.kern.phase).toBe('revealed');
    act(() => result.current.next());
    expect(result.current.kern.question?.item.id).toBe('b');

    act(() => result.current.settle(goed));
    act(() => result.current.next());

    expect(result.current.kern.phase).toBe('finished');
    expect(vi.mocked(saveAnswer)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(finishSession)).toHaveBeenCalledWith('sessie', 2, 2);
    await waitFor(() => expect(result.current.kern.streak).not.toBeNull());
  });

  it('keeps a wrong answer for the result screen, and does not ask it again', async () => {
    const { result } = ronde({ ids: ['a', 'b'] });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    act(() => result.current.settle(fout));
    expect(result.current.kern.missed.map((item) => item.id)).toEqual(['a']);
    expect(result.current.kern.given).toBe('y');
    expect(vi.mocked(saveAnswer).mock.calls[0]?.[0]).toMatchObject({
      itemId: 'a',
      correct: false,
      chosen: 'y',
    });

    act(() => result.current.next());
    expect(result.current.kern.given).toBeNull();
    expect(result.current.kern.question?.item.id).toBe('b');
    expect(result.current.kern.total).toBe(2);
  });

  it('ignores a second answer to the same question', async () => {
    const { result } = ronde();
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    act(() => result.current.settle(goed));
    act(() => result.current.settle(fout));

    expect(result.current.kern.answeredCount).toBe(1);
    expect(result.current.kern.correctCount).toBe(1);
  });

  it('spends a life on a wrong answer and not on "ik weet het niet"', async () => {
    const { result } = ronde({ basisRegel: LEVENS, ids: ['a', 'b', 'c', 'd', 'e'] });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));
    expect(result.current.kern.livesLeft).toBe(3);

    act(() => result.current.settle(weetNiet));
    expect(result.current.kern.livesLeft).toBe(3);
    act(() => result.current.next());

    act(() => result.current.settle(fout));
    expect(result.current.kern.livesLeft).toBe(2);
  });

  it('ends a round of lives when the last one goes', async () => {
    const { result } = ronde({ basisRegel: LEVENS, ids: ['a', 'b', 'c', 'd', 'e'] });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    for (let keer = 0; keer < 3; keer++) {
      act(() => result.current.settle(fout));
      act(() => result.current.next());
    }

    expect(result.current.kern.phase).toBe('finished');
    expect(result.current.kern.answeredCount).toBe(3);
  });

  it('ends on the first mistake where one mistake ends it', async () => {
    const { result } = ronde({ stoptBijFout: true });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    act(() => result.current.settle(goed));
    act(() => result.current.next());
    act(() => result.current.settle(fout));
    act(() => result.current.next());

    expect(result.current.kern.phase).toBe('finished');
    expect(vi.mocked(finishSession)).toHaveBeenCalledWith('sessie', 1, 2);
  });

  it('never rests on an answer in toetsstand', async () => {
    const { result } = ronde({ toetsstand: true });
    await waitFor(() => expect(result.current.kern.phase).toBe('asking'));

    act(() => result.current.settle(fout));

    expect(result.current.kern.phase).toBe('asking');
    expect(result.current.kern.index).toBe(1);
  });

  it('lets a chosen length replace a fixed round, and not a round of lives', async () => {
    const vast = ronde({ aantal: 25 });
    await waitFor(() => expect(vast.result.current.kern.phase).toBe('asking'));
    expect(vast.seen[0]).toEqual({ kind: 'fixed', aantal: 25 });

    const levens = ronde({ aantal: 25, basisRegel: LEVENS });
    await waitFor(() => expect(levens.result.current.kern.phase).toBe('asking'));
    expect(levens.seen[0]).toBe(LEVENS);
  });

  it('says what went wrong rather than throwing', async () => {
    const { result } = ronde({
      stel: () => {
        throw new Error('Onbekende set');
      },
    });

    await waitFor(() => expect(result.current.kern.error).toBe('Onbekende set'));
    expect(vi.mocked(startSession)).not.toHaveBeenCalled();
  });

  it('is finished at once when there is nothing to ask', async () => {
    const { result } = ronde({ ids: [] });
    await waitFor(() => expect(result.current.kern.phase).toBe('finished'));
  });
});
