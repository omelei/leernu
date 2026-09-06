import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { composeRound, emptyState, review, type Item, type ItemState } from '@/game-core';
import { loadGeoSet, loadPointSet, type GeoSet, type PointSet } from '@/content/loadGeo';
import { loadItemSets } from '@/content/loadSets';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';
import type { MapMode } from './MapCanvas';

/**
 * One round of "wijs aan".
 *
 * A round covers the **whole set** — all twelve provinces, all twelve capitals
 * — rather than a sample. For a set this size that is the honest thing to do:
 * a child asked ten of twelve cannot tell which two they were let off, and
 * "ik ken ze allemaal" is the thing they are actually working towards.
 *
 * The order still comes from the Leitner scheduler, so the items a child keeps
 * missing come round first. Everything is written to the device as it happens: a
 * child who closes the tab halfway keeps what they answered.
 */

export type SetId = 'nl-provincies' | 'nl-hoofdsteden';

export const SET_IDS: readonly SetId[] = ['nl-provincies', 'nl-hoofdsteden'];

/** Names live in i18n; only the map behaviour belongs here. */
export const SETS: Record<SetId, { readonly mode: MapMode }> = {
  'nl-provincies': { mode: 'shapes' },
  'nl-hoofdsteden': { mode: 'points' },
};

export interface RoundQuestion {
  readonly item: Item;
  /** The shape or point that answers it. */
  readonly answerId: string;
}

export type RoundPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface RoundState {
  readonly phase: RoundPhase;
  readonly setId: SetId;
  readonly mode: MapMode;
  readonly geo: GeoSet | null;
  readonly points: PointSet | null;
  readonly namesById: ReadonlyMap<string, string>;
  readonly question: RoundQuestion | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly combo: number;
  readonly chosenId: string | null;
  readonly lastCorrect: boolean;
  /** Items answered wrongly, for the result screen. */
  readonly missed: readonly Item[];
  readonly answeredCount: number;
  readonly error: string | null;
}

export function useRound(setId: SetId) {
  const [geo, setGeo] = useState<GeoSet | null>(null);
  const [points, setPoints] = useState<PointSet | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('loading');
  const [chosenId, setChosen] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missed, setMissed] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef<number>(0);
  const mode = SETS[setId].mode;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const set = loadItemSets().find((candidate) => candidate.id === setId);
        if (!set) throw new Error(`Onbekende set: ${setId}`);

        const [loadedGeo, loadedPoints, loadedStates] = await Promise.all([
          loadGeoSet('provincies', 'region'),
          mode === 'points' ? loadPointSet('hoofdsteden') : Promise.resolve(null),
          loadItemStates(),
        ]);
        if (cancelled) return;

        const all = set.items.filter((item) => item.geometrieRef !== undefined);
        const picked = composeRound({
          items: all,
          states: loadedStates,
          size: all.length,
          now: new Date(),
        });

        const round = picked.map((item) => ({
          item,
          answerId: item.geometrieRef as string,
        }));

        sessionId.current = await startSession(
          'wijs-aan',
          round.map((question) => question.item.id),
        );
        if (cancelled) return;

        setGeo(loadedGeo);
        setPoints(loadedPoints);
        setItems([...all]);
        setStates(loadedStates);
        setQuestions(round);
        setPhase(round.length > 0 ? 'asking' : 'finished');
        askedAt.current = performance.now();
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [setId, mode]);

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.geometrieRef) map.set(item.geometrieRef, item.naam);
    }
    // In points mode the provinces are still drawn, and a screen reader should
    // not read a dimmed background shape as if it were an answer — but a name
    // is better than a source spelling if it ever does.
    return map;
  }, [items]);

  const question = questions[index] ?? null;

  const pick = useCallback(
    (answerId: string) => {
      if (phase !== 'asking' || !question || !sessionId.current) return;

      const correct = answerId === question.answerId;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(question.item.id) ?? emptyState(question.item.id);
      const nextState = review(previous, correct, new Date());

      setChosen(answerId);
      setLastCorrect(correct);
      setPhase('revealed');
      setCombo(correct ? combo + 1 : 0);
      setAnswered(answeredCount + 1);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, question.item]);

      setStates(new Map(states).set(question.item.id, nextState));

      void saveAnswer({
        sessionId: sessionId.current,
        mode: 'wijs-aan',
        itemId: question.item.id,
        correct,
        responseMs,
        chosen: correct ? null : answerId,
        nextState,
      });
    },
    [phase, question, states, combo, correctCount, answeredCount, missed],
  );

  const finish = useCallback(() => {
    setPhase('finished');
    if (sessionId.current) void finishSession(sessionId.current, correctCount);
  }, [correctCount]);

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    if (index + 1 >= questions.length) {
      finish();
      return;
    }

    setIndex(index + 1);
    setChosen(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions.length, finish]);

  /** Ends the round early. What was answered is already saved. */
  const stop = useCallback(() => {
    if (phase === 'finished') return;
    finish();
  }, [phase, finish]);

  const state: RoundState = {
    phase,
    setId,
    mode,
    geo,
    points,
    namesById,
    question,
    index,
    total: questions.length,
    correctCount,
    combo,
    chosenId,
    lastCorrect,
    missed,
    answeredCount,
    error,
  };

  return { state, pick, next, stop };
}
