import { createContext, useContext, type ReactNode } from 'react';

/**
 * The frame the result steps back into (S10): the kopbalk and the rail return
 * the moment the round is over. The round screens are not wrapped in the Shell
 * — a question has no navigation at all — so the app hands the result its
 * frame through here. Without a provider the result stands on its own, which
 * is what a test of one screen wants.
 */
export const UitslagKader = createContext<(kinderen: ReactNode) => ReactNode>(
  (kinderen) => kinderen,
);

export function useUitslagKader(): (kinderen: ReactNode) => ReactNode {
  return useContext(UitslagKader);
}
