import { useEffect, useState } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { Dot } from '@/components/Dot';
import { countMastered, isDue, type ItemState } from '@/game-core';
import { loadSumSets } from '@/content/loadSums';
import { loadItemStates } from '@/store/progress';
import { SUM_CHALLENGE_MODES, SUM_MODES, type SumMode } from './useSumRound';
import { usePreferences } from '@/features/player/settings';

/**
 * K2 for the tables: which one, and how.
 *
 * The same two numbered steps as topography, because it is the same question
 * asked of a different subject and a child should not have to learn a second
 * screen. What differs is the list — twelve tables rather than five sets — and
 * the order they stand in, which is the order they are learned: one, two, five
 * and ten have a rule you can say out loud, and seven and nine do not.
 *
 * Each table carries how much of it is remembered, the same mark the map sets
 * use. "De tafel van 7 ken ik" is the sentence this module exists to make
 * sayable, and it is only sayable about a whole table.
 */

const MODE_NAME: Record<SumMode, TranslationKey> = {
  'som-typen': 'mode.som-typen',
  'som-meerkeuze': 'mode.som-meerkeuze',
  bliksemronde: 'mode.bliksemronde',
  overleven: 'mode.overleven',
};

/**
 * Complete records, because a new mode must say what it is for rather than
 * quietly borrowing another one's words. The two challenge modes carry their
 * own name here and never show it: they are chips, and a chip is one word.
 */
const MODE_REASON: Record<SumMode, TranslationKey> = {
  'som-typen': 'way.som-typen',
  'som-meerkeuze': 'way.som-meerkeuze',
  bliksemronde: 'mode.bliksemronde',
  overleven: 'mode.overleven',
};

export function ChooseTableScreen({
  onStart,
}: {
  readonly onStart: (setId: string, mode: SumMode) => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [setId, setSetId] = useState('tafel-1');
  const [mode, setMode] = useState<SumMode>('som-typen');
  const prefs = usePreferences();

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const sets = loadSumSets();
  const now = new Date();
  const chosen = sets.find((candidate) => candidate.id === setId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <h1 className="tk-display text-h1 font-semibold">{t('sums.title')}</h1>

      <section className="flex flex-col gap-3" aria-label={t('choose.stepWhat')}>
        <h2 className="tk-label">{t('choose.stepWhat')}</h2>
        {sets.map((set) => {
          const ids = set.items.map((sum) => sum.id);
          const known = states ?? new Map<string, ItemState>();
          const mastered = countMastered(known, ids);
          const due = ids.filter((id) => {
            const state = known.get(id);
            return state ? isDue(state, now) : false;
          }).length;

          return (
            <button
              key={set.id}
              type="button"
              className="tk-module-card w-full"
              aria-pressed={set.id === setId}
              onClick={() => setSetId(set.id)}
            >
              <Dot size={24} fill={ids.length === 0 ? 0 : mastered / ids.length} />
              <span className="min-w-0">
                <span className="block font-semibold">{t('sums.table', { tafel: set.tafel })}</span>
                <span className="block text-ink-2">
                  {mastered === 0 && due === 0
                    ? t('home.setNew')
                    : t('home.setMastered', { goed: mastered, totaal: ids.length })}
                  {due > 0 ? ` · ${t('choose.dueToday', { aantal: due })}` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="flex flex-col gap-3" aria-label={t('choose.stepHow')}>
        {/* Typing first and choosing second, which is the opposite of the map.
            Four plausible products can be narrowed by a child who cannot do the
            sum, so multiple choice measures less here — it is the way back in
            when typing is going badly, not the way in. */}
        <h2 className="tk-label">{t('choose.stepHow')}</h2>
        {SUM_MODES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className="tk-module-card w-full"
            aria-pressed={candidate === mode}
            onClick={() => setMode(candidate)}
          >
            <span className="min-w-0">
              <span className="block font-semibold">{t(MODE_NAME[candidate])}</span>
              <span className="block text-ink-2">{t(MODE_REASON[candidate])}</span>
            </span>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-label={t('choose.whenItSticks')}>
        {/* Chips rather than a fifth and sixth way, for the reason K2 gives:
            a clock and three lives are things you add to something you already
            know. These run over all twelve tables — ten sums is over before a
            minute is, and a child reaching for the clock is one who knows a
            table already. */}
        <h2 className="tk-label">{t('choose.whenItSticks')}</h2>
        <div className="flex flex-wrap gap-3">
          {SUM_CHALLENGE_MODES.filter((kind) => prefs.timer || kind !== 'bliksemronde').map(
            (kind) => (
              <button
                key={kind}
                type="button"
                className="tk-chip"
                onClick={() => onStart(setId, kind)}
              >
                {t(MODE_NAME[kind])}
              </button>
            ),
          )}
        </div>
      </section>

      <button type="button" className="tk-button self-start" onClick={() => onStart(setId, mode)}>
        {t('sums.start', {
          tafel: chosen?.tafel ?? 1,
          hoe: t(MODE_NAME[mode]).toLocaleLowerCase('nl-NL'),
          aantal: chosen?.items.length ?? 0,
        })}
      </button>
    </div>
  );
}
