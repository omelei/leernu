import { describe, expect, it } from 'vitest';
import { loadSumSets } from './loadSums';

/**
 * The tables are generated (tools/content/build-tafels.mjs), and this is what
 * stands in for the editor the geography sets get.
 *
 * A province's name and its weetje are judgements someone has to make and
 * defend, so a person reads them. 7 × 8 = 56 is not a judgement — it is either
 * right or it is a bug that would teach a child something false — so it is
 * multiplied back out here instead. That trade is available exactly once in
 * this content pipeline and this is the place.
 */

const sets = loadSumSets();

describe('the tables', () => {
  it('runs from one to twelve, in order', () => {
    // The app design says so in as many words: "Tafels en klok · Van 1 tot 12".
    expect(sets.map((set) => set.tafel)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('gives every table ten sums, which is where a table ends', () => {
    for (const set of sets) {
      expect(
        set.items.map((sum) => sum.by),
        set.id,
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('has the right answer to every one of them', () => {
    for (const set of sets) {
      for (const sum of set.items) {
        expect(sum.antwoord, `${sum.table} × ${sum.by}`).toBe(sum.table * sum.by);
        expect(sum.table, sum.id).toBe(set.tafel);
      }
    }
  });

  it('gives every sum a unique id, and one that says what it is', () => {
    const seen = new Set<string>();
    for (const set of sets) {
      for (const sum of set.items) {
        expect(seen.has(sum.id), `${sum.id} twice`).toBe(false);
        seen.add(sum.id);
        expect(sum.id).toBe(`tafel-${sum.table}x${sum.by}`);
      }
    }
    expect(seen.size).toBe(120);
  });

  it('never collides with a geography item', () => {
    // Item states are keyed by id alone and both modules write to the same
    // store, so a shared id would make a child's tables and their provinces the
    // same Leitner box. The prefix is what keeps them apart.
    for (const set of sets) {
      for (const sum of set.items) expect(sum.id.startsWith('tafel-')).toBe(true);
    }
  });

  it('offers the easiest tables first and the hardest last', () => {
    // The level decides the order the sets are shown in and nothing else.
    const level = (tafel: number) => sets.find((set) => set.tafel === tafel)?.niveau;

    for (const tafel of [1, 2, 5, 10]) expect(level(tafel), `tafel ${tafel}`).toBe(1);
    for (const tafel of [7, 9, 11, 12]) expect(level(tafel), `tafel ${tafel}`).toBe(3);
  });
});
