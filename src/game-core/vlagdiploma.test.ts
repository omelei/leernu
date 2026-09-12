import { describe, expect, it } from 'vitest';
import {
  DIPLOMA_WERELDDELEN,
  diplomaWerelddeelVanSet,
  tableOfDiploma,
  vlagDiplomaFor,
  vlagdiplomaDrempel,
  vlagdiplomaVragen,
  werelddeelVanDiploma,
  type RewardSnapshot,
} from './index';

/**
 * The vlaggendiploma (ADR-104): twenty flags of one werelddeel — or all of
 * them where there are fewer — and nine in ten of them right.
 */

const ronde = (over: Partial<RewardSnapshot>): RewardSnapshot => ({
  setId: 'vlag-europa-alle',
  perfectRound: false,
  completeRound: true,
  streakDays: 1,
  mastered: 0,
  setSize: 46,
  roundsFinished: 1,
  mode: 'vlag-diploma',
  correct: 18,
  ...over,
});

describe('how much a vlaggendiploma asks', () => {
  it('asks twenty, or every flag of a smaller werelddeel', () => {
    expect(vlagdiplomaVragen(46)).toBe(20);
    expect(vlagdiplomaVragen(14)).toBe(14);
    expect(vlagdiplomaVragen(12)).toBe(12);
  });

  it('wants nine in ten right: eighteen of twenty, eleven of twelve, thirteen of fourteen', () => {
    expect(vlagdiplomaDrempel(20)).toBe(18);
    expect(vlagdiplomaDrempel(12)).toBe(11);
    expect(vlagdiplomaDrempel(14)).toBe(13);
  });
});

describe('vlagDiplomaFor', () => {
  it('is earned with eighteen of twenty', () => {
    expect(vlagDiplomaFor(ronde({}))).toBe('diploma-vlag-europa');
    expect(vlagDiplomaFor(ronde({ correct: 20 }))).toBe('diploma-vlag-europa');
  });

  it('is not earned with seventeen', () => {
    expect(vlagDiplomaFor(ronde({ correct: 17 }))).toBeNull();
  });

  it('is not earned by a round stopped early, however well it went', () => {
    expect(vlagDiplomaFor(ronde({ completeRound: false, correct: 18 }))).toBeNull();
  });

  it('holds a smaller werelddeel to the same bar', () => {
    const zuidAmerika = { setId: 'vlag-zuid-amerika-alle', setSize: 12 };
    expect(vlagDiplomaFor(ronde({ ...zuidAmerika, correct: 11 }))).toBe(
      'diploma-vlag-zuid-amerika',
    );
    expect(vlagDiplomaFor(ronde({ ...zuidAmerika, correct: 10 }))).toBeNull();
  });

  it('is only sat on the whole of a werelddeel, and only as a diploma', () => {
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-europa-bekend' }))).toBeNull();
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-wereld-alle' }))).toBeNull();
    expect(vlagDiplomaFor(ronde({ setId: 'vlag-nederland-provincies' }))).toBeNull();
    expect(vlagDiplomaFor(ronde({ mode: 'vlag-gemengd' }))).toBeNull();
  });
});

describe('the stored diploma', () => {
  it('reads back as the werelddeel it was earned for, for all six', () => {
    expect(DIPLOMA_WERELDDELEN).toHaveLength(6);
    for (const deel of DIPLOMA_WERELDDELEN) {
      expect(diplomaWerelddeelVanSet(`vlag-${deel}-alle`)).toBe(deel);
      expect(werelddeelVanDiploma(`diploma-vlag-${deel}`)).toBe(deel);
    }
  });

  it('is never mistaken for a tafeldiploma, or the other way round', () => {
    expect(tableOfDiploma('diploma-vlag-europa')).toBeNull();
    expect(werelddeelVanDiploma('diploma-tafel-7')).toBeNull();
    expect(werelddeelVanDiploma('diploma-vlag-wereld')).toBeNull();
  });
});
