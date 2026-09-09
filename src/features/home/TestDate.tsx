import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
// The streak already needs "which day is it, locally" and writes it the same
// way. One of them, so a date that is Tuesday to the streak cannot be Monday
// to the test.
import { dayKey } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { daysUntil, TEST_SUBJECTS, type TestPlan, type Toets } from './testPlan';

/**
 * K1's one accented block: the tests that are coming, and a way to add one.
 *
 * **And nothing else.** It carried the way into a round as well — "ga verder
 * met rekenen" sat under the date, inside the same border — and that made one
 * block answer two questions: when is the test, and what shall I do now. The
 * second has moved out from under it (ADR-077). What is left is a plan: every
 * test the child has told us about, soonest first, each with the subject it is
 * about and a way to take it off the list.
 *
 * There is no date picker of our own. `<input type="date">` is the platform's,
 * it is keyboard- and screen-reader-navigable for free, and a home-made
 * calendar is three weeks of work to arrive somewhere worse. The subject is a
 * `<select>` for the same reason, and it lists only modules that exist: a test
 * set for a module with no content is a promise this product does not make.
 *
 * It draws before the tests have arrived, and "nog geen toetsdatum" is what it
 * says in the meantime. That is not the usual rule in this codebase, and the
 * screenshots are why: on WebKit the read takes long enough to see, and a block
 * that waits is a block that is *absent* — the reason the child is here,
 * missing, and then pushing everything under it down when it lands.
 */
export function TestDate({
  plan,
  now = new Date(),
}: {
  readonly plan: TestPlan;
  readonly now?: Date;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tk-badge">{t('home.testLabel')}</span>
        <h2 className="tk-display text-h2 font-semibold">
          {plan.toetsen.length === 0 ? t('home.testNone') : t('home.testTitle')}
        </h2>

        {/* Right-aligned where there is room, per K1, and simply next in the
            wrap where there is not. */}
        <Button
          variant="secondary"
          className="sm:ml-auto"
          aria-expanded={adding}
          onClick={() => setAdding(!adding)}
        >
          {t('home.testAdd')}
        </Button>
      </div>

      {plan.toetsen.length > 0 ? (
        <ul className="flex flex-col gap-2 p-0">
          {plan.toetsen.map((toets) => (
            <li key={toets.id}>
              <ToetsRegel toets={toets} now={now} onRemove={() => plan.remove(toets.id)} />
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <ToetsToevoegen
          now={now}
          onAdd={(date, subject) => {
            plan.add(date, subject);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** One test: when it is, what it is about, and a way to take it off the list. */
function ToetsRegel({
  toets,
  now,
  onRemove,
}: {
  readonly toets: Toets;
  readonly now: Date;
  readonly onRemove: () => void;
}) {
  const days = daysUntil(toets.date, now);
  const subject = TEST_SUBJECTS.find((module) => module.id === toets.subject) ?? null;

  const wanneer =
    days === 0
      ? t('home.testToday')
      : days === 1
        ? t('home.testTomorrow')
        : t('home.testInDays', { aantal: days });

  return (
    <div className="tk-toets">
      <span className="tk-display text-h3 font-semibold">{wanneer}</span>

      {/* Which subject, as a badge of its own so the sentence about the date
          stays a sentence about the date. The module's icon rather than its
          accent: §B keeps an accent to the highlight, the progress bar and the
          module entrance, and §E lets an icon carry the module it denotes. */}
      {subject ? (
        <span className="tk-badge-outline">
          <SubjectIcon subject={subject} />
          {t(subject.name)}
        </span>
      ) : (
        <span className="text-ink-2">{t('home.testSubjectNone')}</span>
      )}

      <Button
        variant="tertiary"
        className="ml-auto"
        aria-label={t('home.testRemoveOne', { wanneer })}
        onClick={onRemove}
      >
        {t('home.testRemove')}
      </Button>
    </div>
  );
}

/**
 * A test being added: a date, a subject, and a button that means it.
 *
 * A form rather than two fields that save as you touch them, because adding is
 * a thing with an end. The old block edited one test in place and saved every
 * keystroke, which is right when there is exactly one of something and wrong
 * the moment there is a list: a half-typed date would have become a row.
 */
function ToetsToevoegen({
  now,
  onAdd,
}: {
  readonly now: Date;
  readonly onAdd: (date: string, subject: string) => void;
}) {
  const [date, setDate] = useState(dayKey(now));
  const [subject, setSubject] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (date === '') return;
    onAdd(date, subject);
  }

  return (
    <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={submit}>
      <label className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-ink-2">{t('home.testPick')}</span>
        <input
          type="date"
          className="tk-input"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      <label className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-ink-2">{t('home.testSubjectPick')}</span>
        <select
          className="tk-input"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          <option value="">{t('home.testSubjectNone')}</option>
          {TEST_SUBJECTS.map((module) => (
            <option key={module.id} value={module.id}>
              {t(module.name)}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" className="flex-none">
        {t('home.testSave')}
      </Button>
    </form>
  );
}

/** The module's own pictogram, at the size a badge carries. */
function SubjectIcon({ subject }: { readonly subject: Module }) {
  const Icon = MODULE_ICON[subject.id];
  return <Icon size={20} />;
}
