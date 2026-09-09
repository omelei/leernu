import { describe, expect, it } from 'vitest';
import { loadSumSet, loadSumSets, MIX_IDS, sumPool } from './loadSums';

/**
 * Rekenen is generated (tools/content/build-rekenen.mjs), and this is what
 * stands in for the editor the geography sets get.
 *
 * A province's name and its weetje are judgements someone has to make and
 * defend, so a person reads them. 7 × 8 = 56 is not a judgement — it is either
 * right or it is a bug that would teach a child something false — so every one
 * of the five hundred is worked back out here instead. That trade is available
 * exactly once in this content pipeline and this is the place.
 *
 * What it cannot check is the other half of that file: **which** sums to
 * practise. That is a judgement, it is written out in the generator with the
 * rule that chose it, and a teacher disagreeing with it is a conversation
 * rather than a failing test. What is checked here is that the choice stayed
 * inside the range it claims.
 */

const sets = loadSumSets();
const tafels = sets.filter((set) => set.op === 'keer');
const delen = sets.filter((set) => set.op === 'delen');
const plusMin = sets.filter((set) => set.op === 'plus' || set.op === 'min');

describe('the tables', () => {
  it('runs from one to twelve, in order', () => {
    // The app design says so in as many words: "Tafels en klok · Van 1 tot 12".
    expect(tafels.map((set) => set.tafel)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('gives every table ten sums, which is where a table ends', () => {
    for (const set of tafels) {
      expect(
        set.items.map((sum) => sum.rechts),
        set.id,
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('has the right answer to every one of them', () => {
    for (const set of tafels) {
      for (const sum of set.items) {
        expect(sum.antwoord, `${sum.links} × ${sum.rechts}`).toBe(sum.links * sum.rechts);
        expect(sum.links, sum.id).toBe(set.tafel);
        expect(sum.id, sum.id).toBe(`tafel-${sum.links}x${sum.rechts}`);
      }
    }
  });

  it('offers the easiest tables first and the hardest last', () => {
    // The level decides the order the sets are shown in and nothing else.
    const level = (tafel: number) => tafels.find((set) => set.tafel === tafel)?.niveau;

    for (const tafel of [1, 2, 5, 10]) expect(level(tafel), `tafel ${tafel}`).toBe(1);
    for (const tafel of [7, 9, 11, 12]) expect(level(tafel), `tafel ${tafel}`).toBe(3);
  });
});

describe('the division facts', () => {
  it('mirrors the tables, one set each', () => {
    expect(delen.map((set) => set.tafel)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('divides every one of them back out', () => {
    for (const set of delen) {
      expect(set.items, set.id).toHaveLength(10);
      for (const sum of set.items) {
        expect(sum.rechts, sum.id).toBe(set.tafel);
        expect(sum.antwoord * sum.rechts, `${sum.links} : ${sum.rechts}`).toBe(sum.links);
        // Never a remainder and never a division by nothing: both are sums
        // this product has not taught yet and must not hand a child anyway.
        expect(sum.links % sum.rechts, sum.id).toBe(0);
        expect(sum.rechts, sum.id).toBeGreaterThan(0);
      }
    }
  });

  it('stays inside the table it belongs to', () => {
    // 7 × 10 is the end of the table of seven, so 70 : 7 is the end of this
    // set. A sum past it would be a division a child was never taught.
    for (const set of delen) {
      for (const sum of set.items) {
        expect(sum.antwoord, sum.id).toBeGreaterThanOrEqual(1);
        expect(sum.antwoord, sum.id).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('plus and minus', () => {
  it('comes in three ranges each', () => {
    expect(plusMin.map((set) => set.id)).toEqual([
      'plus-20',
      'plus-100',
      'plus-1000',
      'min-20',
      'min-100',
      'min-1000',
    ]);
  });

  it('adds and subtracts every one of them back out', () => {
    for (const set of plusMin) {
      for (const sum of set.items) {
        const uit = set.op === 'plus' ? sum.links + sum.rechts : sum.links - sum.rechts;
        expect(sum.antwoord, `${sum.links} ${set.op} ${sum.rechts}`).toBe(uit);
      }
    }
  });

  it('stays inside the range its name claims', () => {
    // "Plussommen tot 100" is a promise on a card a child presses. A sum that
    // came out at 104 would break it silently, on the one screen where nobody
    // is checking.
    for (const set of plusMin) {
      const grens = Number(set.id.split('-')[1]);
      for (const sum of set.items) {
        expect(sum.antwoord, sum.id).toBeGreaterThanOrEqual(1);
        expect(sum.antwoord, sum.id).toBeLessThanOrEqual(grens);
      }
    }
  });
});

describe('every sum there is', () => {
  it('has an id of its own', () => {
    const seen = new Set<string>();
    for (const set of sets) {
      for (const sum of set.items) {
        expect(seen.has(sum.id), `${sum.id} twice`).toBe(false);
        seen.add(sum.id);
      }
    }
    expect(seen.size).toBe(510);
  });

  it('never collides with a geography item', () => {
    // Item states are keyed by id alone and both modules write to the same
    // store, so a shared id would make a child's tables and their provinces the
    // same Leitner box. The prefix is what keeps them apart.
    for (const set of sets) {
      for (const sum of set.items) {
        expect(sum.id, sum.id).toMatch(/^(?:tafel|deel|plus|min)/);
        expect(sum.id.startsWith('nl-'), sum.id).toBe(false);
      }
    }
  });
});

describe('the mixes', () => {
  it('is made of the same items, never of copies of them', () => {
    // The whole reason a mix is not a file. If the Rekenmix held its own sums
    // with their own ids, a child would have to learn every table twice over
    // to fill both sets of Leitner boxes.
    const echt = new Set(sets.flatMap((set) => set.items.map((sum) => sum.id)));

    for (const id of MIX_IDS) {
      const mix = loadSumSet(id);
      expect(mix, id).toBeDefined();
      for (const sum of mix?.items ?? []) expect(echt.has(sum.id), `${id}: ${sum.id}`).toBe(true);
    }
  });

  it('holds what its name says and nothing else', () => {
    expect(loadSumSet('tafels-alle')?.items).toHaveLength(120);
    expect(loadSumSet('deel-alle')?.items).toHaveLength(120);
    expect(loadSumSet('rekenmix')?.items).toHaveLength(510);
  });

  it('splits the Rekenmix by the level every set already carried', () => {
    // Ten sets each and a hundred and seventy sums each, which is not a
    // coincidence worth relying on but is worth noticing: the content was
    // levelled evenly long before anything read the level out loud (ADR-073).
    for (const [id, niveau] of [
      ['rekenmix-1', 1],
      ['rekenmix-2', 2],
      ['rekenmix-3', 3],
    ] as const) {
      const mix = loadSumSet(id);
      expect(mix?.items, id).toHaveLength(170);

      // Every sum in it comes from a set of that level and no other.
      const ids = new Set(
        sets.filter((set) => set.niveau === niveau).flatMap((set) => set.items.map((s) => s.id)),
      );
      for (const sum of mix?.items ?? []) expect(ids.has(sum.id), `${id}: ${sum.id}`).toBe(true);
    }

    // And together they are the whole of it: no sum is in two levels, none is
    // in none.
    const perLevel = [1, 2, 3].reduce(
      (total, niveau) => total + (loadSumSet(`rekenmix-${niveau}`)?.items.length ?? 0),
      0,
    );
    expect(perLevel).toBe(510);
  });

  it('carries every sum in the mistakes set, and narrows it in the round', () => {
    // It holds them all here because a set is a list of sums and a child's
    // mistakes are not a property of the content. `useSumRound` reads the
    // boxes and filters (ADR-078).
    expect(loadSumSet('fouten')?.items).toHaveLength(510);
  });
});

describe('the pool a timed round draws from', () => {
  it('reaches the other sets of the same kind, and no further', () => {
    // A minute of tables is a minute of tables. Ten sums run out long before
    // sixty seconds do, so it reaches past the chosen table — but a child who
    // asked for the table of seven should not be handed "845 − 140" halfway.
    expect(sumPool('tafel-7')).toHaveLength(120);
    expect(sumPool('plus-20').every((sum) => sum.op === 'plus')).toBe(true);
    expect(sumPool('min-100').every((sum) => sum.op === 'min')).toBe(true);
  });

  it('lets a mix draw from itself, which is already everything', () => {
    expect(sumPool('rekenmix')).toHaveLength(510);
  });
});
