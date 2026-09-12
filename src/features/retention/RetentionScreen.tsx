import { useEffect, useState, type ReactNode } from 'react';
import { Dot } from '@/components/Dot';
import { StatusLabel } from '@/components/StatusLabel';
import { loadItemSets } from '@/content/loadSets';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { SET_IDS, type SetId } from '@/features/practice/useRound';
import { SET_NAME_KEY } from '@/features/module/onderdelen';
import type { Item, ItemState } from '@/game-core';
import { dueLabel, retentionOf, statusOf } from './itemStatus';

/**
 * K9, "Wat je onthoudt": the one screen that answers the question the product
 * is named after.
 *
 * Two views of the same twelve facts, and both are needed. The table is the
 * detail — which one, how often, when it comes back — and it is what a child
 * looks at when they want to know about a particular province. The dots above
 * it are all of it at once, and they are what tells you whether this week went
 * well without reading anything.
 *
 * The heatmap is the same `Dot` at a smaller size rather than a new chart. One
 * shape with more states is a thing a child already knows how to read; a second
 * diagram is a second thing to learn in order to find out how the first one is
 * going.
 */

/*
 * The names live in `onderdelen.ts` and are imported rather than repeated. This
 * file kept a second copy of the same five, which is how a sixth set ends up
 * named on one screen and nameless on the other — and a seventh is what found
 * it: `Record<SetId, …>` stopped compiling the moment there were two more.
 */

export function RetentionScreen({ aside }: { readonly aside: ReactNode }) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [setId, setSetId] = useState<SetId>('nl-provincies');

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  const sets = loadItemSets();
  const set = sets.find((candidate) => candidate.id === setId);
  const now = new Date();

  if (states === null) {
    return (
      <div className="p-6" aria-busy="true">
        <p className="text-tekst-secundair">{t('practice.loading')}</p>
      </div>
    );
  }

  const items = set?.items ?? [];

  return (
    <div className="tk-page">
      <div className="tk-page-main">
        <h1 className="tk-display text-paginakop">{t('retention.title')}</h1>

        {/* Which set. Pills rather than a select: five options, all worth
            seeing, and a select on a touch screen is a menu that covers the
            thing you were looking at. */}
        <div className="flex flex-wrap gap-2">
          {SET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className="tk-pill"
              aria-pressed={id === setId}
              onClick={() => setSetId(id)}
            >
              {t(SET_NAME_KEY[id])}
            </button>
          ))}
        </div>

        <Heatmap items={items} states={states} />
        <RetentionTable items={items} states={states} now={now} />
      </div>

      {aside}
    </div>
  );
}

/**
 * Everything, at a glance.
 *
 * No labels and no legend: the dots are read as a group rather than one by one,
 * and the table underneath is where a name belongs. Each still carries its own
 * accessible name, so the group is not a wall of silence to a screen reader.
 */
function Heatmap({
  items,
  states,
}: {
  readonly items: readonly Item[];
  readonly states: ReadonlyMap<string, ItemState>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={t('retention.glance')}>
      {items.map((item) => {
        const state = states.get(item.id);
        const status = t(`status.${statusOf(state)}` as TranslationKey);

        return (
          <span key={item.id} role="listitem">
            <Dot size={24} fill={retentionOf(state)} label={`${item.naam}: ${status}`} />
          </span>
        );
      })}
    </div>
  );
}

function RetentionTable({
  items,
  states,
  now,
}: {
  readonly items: readonly Item[];
  readonly states: ReadonlyMap<string, ItemState>;
  readonly now: Date;
}) {
  // Dutch, and short: a table column is not the place for "dinsdag 1 september".
  const day = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });

  return (
    <table className="tk-table">
      <thead>
        <tr>
          <th>{t('retention.item')}</th>
          <th>{t('retention.status')}</th>
          <th className="tk-num">{t('retention.correct')}</th>
          <th className="tk-num">{t('retention.due')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const state = states.get(item.id);
          const due = dueLabel(state, now);

          return (
            <tr key={item.id}>
              <td>
                <span className="flex items-center gap-2">
                  <Dot size={24} fill={retentionOf(state)} />
                  {item.naam}
                </span>
              </td>
              <td>
                <StatusLabel status={statusOf(state)} />
              </td>
              {/* Right-aligned and tabular, so a column of them lines up on the
                  digit and the figure does not dance from row to row. */}
              <td className="tk-num">{state?.goedCount ?? 0}</td>
              <td className="tk-num">{due === 'due' ? t('retention.dueNow') : day.format(due)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
