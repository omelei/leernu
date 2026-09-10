import { useEffect, useState } from 'react';
import { REEKSEN, type HeldenStand, type Reeks } from '@/game-core';
import { STICKERS, stickerById } from '@/components/stickerSet';
import { loadHelden } from '@/store/heldenStore';

/**
 * This child's heroes, once they are read. Null until then: a card that drew a
 * bronze fox and then turned it silver has told a child something that was not
 * true for a moment.
 */
export function useHelden(): HeldenStand | null {
  const [stand, setStand] = useState<HeldenStand | null>(null);

  useEffect(() => {
    void loadHelden().then(setStand);
  }, []);

  return stand;
}

/**
 * Which reeks the hero a child wears is in: its own. Bronze while the heroes are
 * still being read, and for a chosen animal the heroes do not hold — which is
 * what every child's first three are.
 */
export function reeksVan(stand: HeldenStand | null, sticker: string | undefined): Reeks {
  const plek = STICKERS.indexOf(stickerById(sticker));
  return stand?.helden.find((held) => held.plek === plek)?.reeks ?? REEKSEN[0];
}
