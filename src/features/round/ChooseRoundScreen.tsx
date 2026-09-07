import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { countMastered, isDue, type ItemState } from '@/game-core';
import { loadItemSets } from '@/content/loadSets';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import {
  CHALLENGE_MODES,
  SET_IDS,
  type PracticeMode,
  type SetId,
} from '@/features/practice/useRound';
import { BUILT_WAYS } from './modes';
import { usePreferences } from '@/features/player/settings';

/**
 * K2, "kies je ronde": two numbered steps, and the numbers are load-bearing.
 *
 * First what, then how. Before this the two choices were tangled together on
 * the home screen — five buttons per set across five sets, a wall of them, with
 * no way to see that some were harder than others.
 *
 * The ways of practising are in order of weight with a line each saying what
 * they are for, which is the whole reason the order is visible rather than
 * implied. And the chosen combination is written on the start button in words,
 * so the last thing a child reads before a round is what the round is.
 */

const SET_NAME_KEY: Record<SetId, TranslationKey> = {
  'nl-provincies': 'set.nl-provincies',
  'nl-hoofdsteden': 'set.nl-hoofdsteden',
  'nl-waddeneilanden': 'set.nl-waddeneilanden',
  'nl-wateren': 'set.nl-wateren',
  'nl-steden': 'set.nl-steden',
};

export function ChooseRoundScreen({
  onStart,
  onExplore,
}: {
  readonly onStart: (setId: SetId, practiceMode: PracticeMode) => void;
  readonly onExplore: (setId: SetId) => void;
}) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [setId, setSetId] = useState<SetId>('nl-provincies');
  const [way, setWay] = useState<string>('wijs-aan');
  const prefs = usePreferences();

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const sets = loadItemSets();
  const now = new Date();

  const chosenSet = sets.find((candidate) => candidate.id === setId);
  const chosenWay = BUILT_WAYS.find((candidate) => candidate.id === way) ?? BUILT_WAYS[0];

  const start = () => {
    if (chosenWay?.id === 'ontdekken') onExplore(setId);
    else if (chosenWay) onStart(setId, chosenWay.id as PracticeMode);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <h1 className="tk-display text-h1 font-semibold">{t('choose.title')}</h1>

      <section className="flex flex-col gap-3" aria-label={t('choose.stepWhat')}>
        <h2 className="tk-label">{t('choose.stepWhat')}</h2>
        {SET_IDS.map((id) => {
          const set = sets.find((candidate) => candidate.id === id);
          if (!set) return null;

          const ids = set.items.map((item) => item.id);
          const known = states ?? new Map<string, ItemState>();
          const mastered = countMastered(known, ids);
          const due = ids.filter((itemId) => {
            const state = known.get(itemId);
            return state ? isDue(state, now) : false;
          }).length;

          return (
            <button
              key={id}
              type="button"
              className="tk-module-card w-full"
              aria-pressed={id === setId}
              onClick={() => setSetId(id)}
            >
              <Dot size={24} fill={ids.length === 0 ? 0 : mastered / ids.length} />
              <span className="min-w-0">
                <span className="block font-semibold">{t(SET_NAME_KEY[id])}</span>
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
        {/* The order is the argument, so it is written down rather than left to
            be inferred from the sequence. */}
        <h2 className="tk-label">{t('choose.stepHow')}</h2>
        {BUILT_WAYS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className="tk-module-card w-full"
            aria-pressed={candidate.id === way}
            onClick={() => setWay(candidate.id)}
          >
            <span className="min-w-0">
              <span className="block font-semibold">{t(candidate.name)}</span>
              <span className="block text-ink-2">{t(candidate.reason)}</span>
            </span>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-label={t('choose.whenItSticks')}>
        {/* Chips, not entries in the list above: a clock and three lives are
            things you add to something you already know, and standing them
            beside the four ways would say they were a fifth way to learn it. */}
        <h2 className="tk-label">{t('choose.whenItSticks')}</h2>
        <div className="flex flex-wrap gap-3">
          {CHALLENGE_MODES.filter((mode) => prefs.timer || mode !== 'bliksemronde').map((mode) => (
            <button
              key={mode}
              type="button"
              className="tk-chip"
              onClick={() => onStart(setId, mode)}
            >
              {t(`mode.${mode}` as TranslationKey)}
            </button>
          ))}
        </div>
      </section>

      {/* The combination in words. A child reads what the round is at the moment
          they start it, rather than finding out on the first question. */}
      <Button className="self-start" onClick={start}>
        {t('choose.start', {
          set: t(SET_NAME_KEY[setId]),
          hoe: chosenWay ? t(chosenWay.name).toLocaleLowerCase('nl-NL') : '',
          aantal: Math.min(chosenSet?.items.length ?? 0, 15),
        })}
      </Button>
    </div>
  );
}
