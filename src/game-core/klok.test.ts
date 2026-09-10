import { describe, expect, it } from 'vitest';
import {
  judgeKlok,
  klokDigitaal,
  klokDistractors,
  klokHoeken,
  klokItem,
  klokVorm,
  volgendUur,
} from './klok';

/**
 * Reading a clock, and the one thing about it that is genuinely Dutch.
 *
 * "Half acht" is half past *seven*. Every other language this product might
 * ever be translated into says the hour that has been, and Dutch says the one
 * that is coming — which is why `klokVorm` names an hour rather than formatting
 * a string, and why it is worth a test rather than a comment.
 */
describe('how a time is said', () => {
  const zeg = (uur: number, minuut: number) => klokVorm(klokItem(uur, minuut));

  it('names the hour that is coming, from twenty past onwards', () => {
    // The mistake of the whole module: 7:30 is "half acht", not "half zeven".
    expect(zeg(7, 30)).toEqual({ soort: 'half', uur: 8 });
    expect(zeg(7, 20)).toEqual({ soort: 'voor-half', aantal: 10, uur: 8 });
    expect(zeg(7, 25)).toEqual({ soort: 'voor-half', aantal: 5, uur: 8 });
    expect(zeg(7, 35)).toEqual({ soort: 'over-half', aantal: 5, uur: 8 });
    expect(zeg(7, 40)).toEqual({ soort: 'over-half', aantal: 10, uur: 8 });
    expect(zeg(7, 45)).toEqual({ soort: 'kwart-voor', uur: 8 });
    expect(zeg(7, 50)).toEqual({ soort: 'voor', aantal: 10, uur: 8 });
  });

  it('names the hour that has been, up to a quarter past', () => {
    expect(zeg(7, 0)).toEqual({ soort: 'uur', uur: 7 });
    expect(zeg(7, 5)).toEqual({ soort: 'over', aantal: 5, uur: 7 });
    expect(zeg(7, 15)).toEqual({ soort: 'kwart-over', uur: 7 });
  });

  it('rolls twelve over to one rather than to thirteen', () => {
    // "Half een", not "half dertien" — the face has twelve hours on it and the
    // words follow the face.
    expect(volgendUur(12)).toBe(1);
    expect(zeg(12, 30)).toEqual({ soort: 'half', uur: 1 });
    expect(zeg(12, 0)).toEqual({ soort: 'uur', uur: 12 });
  });
});

describe('a time as a number', () => {
  it('writes what a digital clock shows, on twelve hours', () => {
    expect(klokDigitaal(klokItem(7, 5))).toBe('7:05');
    expect(klokDigitaal(klokItem(12, 0))).toBe('12:00');
  });

  it('files every time under a stable id, whatever arithmetic produced it', () => {
    expect(klokItem(7, 30).id).toBe('klok-07-30');
    // An hour past twelve is one o'clock, and an hour before one is twelve.
    expect(klokItem(13, 0)).toMatchObject({ uur: 1, minuut: 0 });
    expect(klokItem(0, 0)).toMatchObject({ uur: 12, minuut: 0 });
    expect(klokItem(7, 65)).toMatchObject({ uur: 8, minuut: 5 });
    expect(klokItem(1, -5)).toMatchObject({ uur: 12, minuut: 55 });
  });
});

describe('where the hands point', () => {
  it('carries the little hand along with the minutes', () => {
    // Half past seven has the hour hand between the 7 and the 8. A drawing that
    // parked it on the 7 would be a clock that does not exist.
    expect(klokHoeken(klokItem(7, 0)).uur).toBe(210);
    expect(klokHoeken(klokItem(7, 30)).uur).toBe(225);
    expect(klokHoeken(klokItem(7, 30)).minuut).toBe(180);
    expect(klokHoeken(klokItem(12, 0))).toEqual({ uur: 0, minuut: 0 });
  });
});

describe('judging what a child typed', () => {
  const halfAcht = klokItem(7, 30);

  it('accepts every way a child writes half past seven', () => {
    for (const typed of ['7:30', '07:30', '7.30', '730', '0730', ' 7 30 ', '7u30']) {
      expect(judgeKlok(typed, halfAcht), typed).toBe(true);
    }
  });

  it('accepts the afternoon, because the face means both', () => {
    // 19:30 is a true reading of a face showing half past seven. Marking it
    // wrong would teach a child that a clock stops meaning anything after noon.
    expect(judgeKlok('19:30', halfAcht)).toBe(true);
    expect(judgeKlok('0:30', klokItem(12, 30))).toBe(true);
    expect(judgeKlok('12:30', klokItem(12, 30))).toBe(true);
  });

  it('refuses a wrong time, however neatly it is written', () => {
    for (const typed of ['8:30', '7:35', '6:35', '18:30', 'half acht', '', '99:99']) {
      expect(judgeKlok(typed, halfAcht), typed).toBe(false);
    }
  });
});

describe('the wrong answers offered', () => {
  it('offers an hour out first, which is the mistake this module is about', () => {
    const fout = klokDistractors(klokItem(7, 30));

    expect(fout).toHaveLength(3);
    expect(fout[0]).toMatchObject({ uur: 8, minuut: 30 });
  });

  it('offers over for voor, and the hands the wrong way round', () => {
    const ids = klokDistractors(klokItem(7, 15)).map((item) => item.id);

    // Quarter to for quarter past: the same distance from the hour, mirrored.
    expect(ids).toContain(klokItem(7, 45).id);
    // The big hand taken for the little one: the 3 read as three o'clock.
    expect(ids).toContain(klokItem(3, 35).id);
  });

  it('never offers the right answer, and never the same wrong one twice', () => {
    for (const uur of [1, 6, 11, 12]) {
      for (const minuut of [0, 5, 15, 30, 45, 55]) {
        const item = klokItem(uur, minuut);
        const fout = klokDistractors(item);

        expect(fout, item.id).toHaveLength(3);
        expect(new Set(fout.map((wrong) => wrong.id)).size, item.id).toBe(3);
        expect(
          fout.map((wrong) => wrong.id),
          item.id,
        ).not.toContain(item.id);
      }
    }
  });

  it('keeps every wrong answer on a time the module actually teaches', () => {
    // Five-minute steps, because a distractor at 7:32 would be a face a child
    // has never been shown and cannot be asked about anywhere else.
    for (const minuut of [0, 5, 20, 35, 50]) {
      for (const wrong of klokDistractors(klokItem(9, minuut))) {
        expect(wrong.minuut % 5, wrong.id).toBe(0);
        expect(wrong.uur, wrong.id).toBeGreaterThanOrEqual(1);
        expect(wrong.uur, wrong.id).toBeLessThanOrEqual(12);
      }
    }
  });
});
