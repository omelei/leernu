import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AANTAL_HELDEN, REEKSEN } from '@/game-core';
import { DEFAULT_STICKER, STICKERS, stickerById } from './stickerSet';

/**
 * The twelve heroes (ADR-098): that there are twelve, that every one of them
 * has a picture in every reeks, and that a choice stored before they were
 * heroes still finds its place.
 */
describe('the twelve heroes', () => {
  it('are twelve, each once', () => {
    expect(STICKERS).toHaveLength(AANTAL_HELDEN);
    expect(new Set(STICKERS.map((held) => held.id)).size).toBe(AANTAL_HELDEN);
    expect(new Set(STICKERS.map((held) => held.dier)).size).toBe(AANTAL_HELDEN);
    expect(new Set(STICKERS.map((held) => held.vroeger)).size).toBe(AANTAL_HELDEN);
  });

  it('have a picture in every one of the five reeksen', () => {
    const missing: string[] = [];

    for (const held of STICKERS) {
      for (const reeks of REEKSEN) {
        const file = join(process.cwd(), 'public', 'helden', `${held.dier}-${reeks}.png`);
        if (!existsSync(file)) missing.push(`${held.dier}-${reeks}.png`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('never use an id an older version stored for a different place', () => {
    // `vos` was the animal in place 2. If a hero's id were `vos`, a child who
    // wore that fox would suddenly wear whatever is in place 0 now.
    const ids = new Set(STICKERS.map((held) => held.id));
    expect(STICKERS.filter((held) => ids.has(held.vroeger))).toEqual([]);
  });

  it('finds the hero in the place a stored animal had', () => {
    STICKERS.forEach((held, plek) => {
      expect(stickerById(held.vroeger)).toBe(STICKERS[plek]);
      expect(stickerById(held.id)).toBe(held);
    });
  });

  it('reads no choice, or one it does not know, as the first', () => {
    expect(stickerById(undefined)).toBe(DEFAULT_STICKER);
    expect(stickerById('eenhoorn')).toBe(DEFAULT_STICKER);
  });
});
