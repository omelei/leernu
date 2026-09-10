import { describe, expect, it } from 'vitest';
import { klokDigitaal, klokId, klokVorm } from '@/game-core';
import { KLOK_MIX_ID, klokPool, loadKlokSet, loadKlokSets } from './loadKlok';

/**
 * Klokkijken is generated (tools/content/build-klok.mjs), and this is what
 * stands in for the editor the geography sets get.
 *
 * A province's name and its weetje are judgements someone has to make and
 * defend, so a person reads them. "The hands at 7 and 6 is half past seven" is
 * not a judgement — it is either right or it is a bug that would teach a child
 * to read a clock wrong — so all hundred and forty-four are worked back out
 * here instead.
 *
 * What this cannot check is the other half of the generator: **where the
 * content stops.** Five-minute steps rather than single minutes is a judgement,
 * it is written out in the generator with the reason, and a teacher disagreeing
 * with it is a conversation rather than a failing test. What is checked here is
 * that the choice stayed inside the range it claims.
 */

const sets = loadKlokSets();

describe('the four steps of the clock', () => {
  it('runs in the order a classroom teaches them', () => {
    // Whole hours, half hours, quarters, then the five-minute steps. Not the
    // order the filenames sort in, which would put half past before the hour.
    expect(sets.map((set) => set.id)).toEqual([
      'klok-heel',
      'klok-half',
      'klok-kwart',
      'klok-vijf',
    ]);
    expect(sets.map((set) => set.stap)).toEqual([60, 30, 15, 5]);
  });

  it('gives every set all twelve hours of it', () => {
    // A clock that could be read at seven and not at eleven is not a clock.
    for (const set of sets) {
      const uren = [...new Set(set.items.map((item) => item.uur))].sort((a, b) => a - b);
      expect(uren, set.id).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  });

  it('offers the easiest step first and the hardest last', () => {
    // The level decides the order the sets are shown in and nothing else. Whole
    // and half hours are one lesson; "tien voor half acht" is not.
    expect(sets.find((set) => set.id === 'klok-heel')?.niveau).toBe(1);
    expect(sets.find((set) => set.id === 'klok-half')?.niveau).toBe(1);
    expect(sets.find((set) => set.id === 'klok-vijf')?.niveau).toBe(3);
  });

  it('files every face under the id its hands say it is', () => {
    for (const set of sets) {
      for (const item of set.items) {
        expect(item.id, item.id).toBe(klokId(item.uur, item.minuut));
        expect(item.uur, item.id).toBeGreaterThanOrEqual(1);
        expect(item.uur, item.id).toBeLessThanOrEqual(12);
        expect(item.minuut % 5, item.id).toBe(0);
      }
    }
  });

  it('stops at five minutes, which is where a schoolbook stops', () => {
    // Going to the minute would be seven hundred and twenty faces, of which
    // five hundred and seventy-six are positions no child has words for.
    const alle = sets.flatMap((set) => set.items);
    expect(alle).toHaveLength(144);
    expect(new Set(alle.map((item) => item.minuut)).size).toBe(12);
  });
});

/**
 * The mix is the union of the four and not a fifth file, so half past seven
 * answered in it moves the same Leitner box as half past seven answered under
 * "halve uren". That only holds if every face is in exactly one set.
 */
describe('the mix', () => {
  it('holds every face on the clock, exactly once', () => {
    const mix = loadKlokSet(KLOK_MIX_ID);
    const ids = (mix?.items ?? []).map((item) => item.id);

    expect(ids).toHaveLength(144);
    expect(new Set(ids).size, 'a face is in two sets').toBe(ids.length);
  });

  it('shares its items with the sets rather than copying them', () => {
    const mix = new Set((loadKlokSet(KLOK_MIX_ID)?.items ?? []).map((item) => item.id));

    for (const set of sets) {
      for (const item of set.items) {
        expect(mix.has(item.id), `${set.id} · ${item.id}`).toBe(true);
      }
    }
  });

  it('claims no step of its own, because its items sit at four of them', () => {
    expect(loadKlokSet(KLOK_MIX_ID)?.stap).toBeNull();
  });

  it('answers to nothing that is not a set', () => {
    expect(loadKlokSet('klok-verzonnen')).toBeUndefined();
  });
});

/**
 * A round that ends on a clock or on three lives reaches past the set it
 * started from, because twelve whole hours is over long before a minute is.
 * Unlike rekenen it reaches all the way: there is no second kind of thing on a
 * clock face to stray into.
 */
describe('the pool a timed round draws from', () => {
  it('is the whole face, whichever set the child started on', () => {
    for (const set of sets) {
      expect(klokPool(set.id), set.id).toHaveLength(144);
    }
    expect(klokPool(KLOK_MIX_ID)).toHaveLength(144);
  });
});

/**
 * Every face, said out loud and written down. This is the part that would be an
 * editor's job if the words were content; they are a rule, so it is a test.
 */
describe('every face, read back out', () => {
  it('says the hour that is coming from twenty past, and the one that has been before it', () => {
    for (const item of loadKlokSet(KLOK_MIX_ID)?.items ?? []) {
      const vorm = klokVorm(item);
      const straks = (item.uur % 12) + 1;

      const genoemd = item.minuut >= 20 ? straks : item.uur;
      expect(vorm.uur, item.id).toBe(genoemd);
    }
  });

  it('writes every one of them the way a digital clock shows it', () => {
    for (const item of loadKlokSet(KLOK_MIX_ID)?.items ?? []) {
      expect(klokDigitaal(item), item.id).toMatch(/^(?:[1-9]|1[0-2]):[0-5]\d$/);
    }
  });
});
