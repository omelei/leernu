import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { composeRound, emptyState, review, type Item, type ItemState } from '@/game-core';
import { loadGeoSet, type GeoSet } from '@/content/loadGeo';
import { loadAllItems } from '@/content/loadSets';
import { finishSession, loadItemStates, saveAnswer, startSession } from '@/store/progress';

/**
 * One round of "wijs aan".
 *
 * The mix of questions comes from the Leitner scheduler, so a round is mostly
 * work that is due rather than a fresh shuffle — that is the whole difference
 * between practising and playing. Everything is written to the device as it
 * happens: a child who closes the tab halfway keeps what they answered.
 */

export const ROUND_SIZE = 10;

export interface RoundQuestion {
  readonly item: Item;
  readonly shapeId: string;
}

export type RoundPhase = 'loading' | 'asking' | 'revealed' | 'finished';

export interface RoundState {
  readonly phase: RoundPhase;
  readonly geo: GeoSet | null;
  readonly namesById: ReadonlyMap<string, string>;
  readonly question: RoundQuestion | null;
  readonly index: number;
  readonly total: number;
  readonly correctCount: number;
  readonly combo: number;
  readonly chosenShapeId: string | null;
  readonly lastCorrect: boolean;
  /** Items answered wrongly, for the result screen. */
  readonly missed: readonly Item[];
  readonly error: string | null;
}

export function useRound(regionSet = 'provincies') {
  const [geo, setGeo] = useState<GeoSet | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [states, setStates] = useState<Map<string, ItemState>>(new Map());
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('loading');
  const [chosenShapeId, setChosen] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missed, setMissed] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const askedAt = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const [loadedGeo, loadedStates] = await Promise.all([
          loadGeoSet(regionSet, 'region'),
          loadItemStates(),
        ]);
        if (cancelled) return;

        const all = loadAllItems().filter((item) => item.geometrieRef !== undefined);
        const picked = composeRound({
          items: all,
          states: loadedStates,
          size: ROUND_SIZE,
          now: new Date(),
        });

        const round: RoundQuestion[] = picked.map((item) => ({
          item,
          shapeId: item.geometrieRef as string,
        }));

        sessionId.current = await startSession(
          'wijs-aan',
          round.map((q) => q.item.id),
        );
        if (cancelled) return;

        setGeo(loadedGeo);
        setItems(all);
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
  }, [regionSet]);

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.geometrieRef) map.set(item.geometrieRef, item.naam);
    }
    return map;
  }, [items]);

  const question = questions[index] ?? null;

  const pick = useCallback(
    (shapeId: string) => {
      if (phase !== 'asking' || !question || !sessionId.current) return;

      const correct = shapeId === question.shapeId;
      const responseMs = Math.round(performance.now() - askedAt.current);
      const previous = states.get(question.item.id) ?? emptyState(question.item.id);
      const next = review(previous, correct, new Date());

      setChosen(shapeId);
      setLastCorrect(correct);
      setPhase('revealed');
      setCombo(correct ? combo + 1 : 0);
      if (correct) setCorrectCount(correctCount + 1);
      else setMissed([...missed, question.item]);

      setStates(new Map(states).set(question.item.id, next));

      void saveAnswer({
        sessionId: sessionId.current,
        mode: 'wijs-aan',
        itemId: question.item.id,
        correct,
        responseMs,
        chosen: correct ? null : shapeId,
        nextState: next,
      });
    },
    [phase, question, states, combo, correctCount, missed],
  );

  const next = useCallback(() => {
    if (phase !== 'revealed') return;

    if (index + 1 >= questions.length) {
      setPhase('finished');
      if (sessionId.current) void finishSession(sessionId.current, correctCount);
      return;
    }

    setIndex(index + 1);
    setChosen(null);
    setPhase('asking');
    askedAt.current = performance.now();
  }, [phase, index, questions.length, correctCount]);

  const state: RoundState = {
    phase,
    geo,
    namesById,
    question,
    index,
    total: questions.length,
    correctCount,
    combo,
    chosenShapeId,
    lastCorrect,
    missed,
    error,
  };

  return { state, pick, next };
}
