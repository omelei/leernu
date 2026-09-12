import { useEffect } from 'react';

/**
 * The dark theme of a round (README, "Kleur — donker thema, tijdens een
 * ronde"). On the root, so every token turns with it — the ground, the map,
 * the answer states — and only while a question is on the screen: the result
 * steps out of the round and takes the light back with it (S10).
 */
export function useRondeThema(aan: boolean): void {
  useEffect(() => {
    if (!aan) return;
    const html = document.documentElement;
    html.dataset.thema = 'ronde';
    return () => {
      delete html.dataset.thema;
    };
  }, [aan]);
}
