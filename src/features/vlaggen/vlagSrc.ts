import type { VlagItem } from '@/game-core';

/**
 * Where a flag's picture is served from. Under the site's base, like the map
 * files, because Pages serves this app from a folder until it has a domain.
 */
export function vlagSrc(vlag: Pick<VlagItem, 'beeld'>): string {
  return `${import.meta.env.BASE_URL}${vlag.beeld}`;
}

/**
 * Fetches the round's pictures before they are asked for, so the next
 * question does not arrive as four empty frames. The browser keeps them; the
 * `<img>` elements find them in its cache.
 */
export function voorlaad(vlaggen: readonly VlagItem[]): void {
  if (typeof Image === 'undefined') return;
  for (const beeld of new Set(vlaggen.map((vlag) => vlag.beeld))) {
    const img = new Image();
    img.decoding = 'async';
    img.src = vlagSrc({ beeld });
  }
}
