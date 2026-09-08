import { useState } from 'react';
import { Button } from '@/components/Button';
// The streak already needs "which day is it, locally" and writes it the same
// way. One of them, so a date that is Tuesday to the streak cannot be Monday
// to the test.
import { dayKey } from '@/game-core';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { daysUntil, TEST_SUBJECTS, type TestPlan } from './testPlan';

/**
 * The head of K1's one accented block: when the test is, and what it is about.
 *
 * Everything else on the home screen is something the child could do. This is
 * the reason they are doing it today, and the design gives it the only surface
 * and border on the screen for exactly that — a child practising for Tuesday
 * should see Tuesday before they see anything else.
 *
 * There is no date picker of our own. `<input type="date">` is the platform's,
 * it is keyboard- and screen-reader-navigable for free, and a home-made
 * calendar is three weeks of work to arrive somewhere worse. The subject is a
 * `<select>` for the same reason, and it lists only modules that exist: a test
 * set for a module with no content is a promise this product does not make.
 *
 * State lives in `useTestPlan` rather than here, because the subject decides
 * what the rest of the screen continues with. A block that owned it privately
 * would be a plan nothing acts on.
 *
 * It draws before that state has arrived, and "nog geen toetsdatum" is what it
 * says in the meantime. That is not the usual rule in this codebase, and the
 * screenshots are why: on WebKit the read takes long enough to see, and a block
 * that waits is a block that is *absent* — the reason the child is here,
 * missing, and then pushing the button down when it lands. Everything else in
 * this card settles at the same moment, because the boxes, the stamps and the
 * plan all queue behind one database handle. So it settles with them, and
 * nothing moves.
 */
export function TestDate({
  plan,
  now = new Date(),
}: {
  readonly plan: TestPlan;
  readonly now?: Date;
}) {
  const [editing, setEditing] = useState(false);

  const days = plan.date === null ? null : daysUntil(plan.date, now);
  const subject = TEST_SUBJECTS.find((module) => module.id === plan.subject) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tk-badge">{t('home.testLabel')}</span>
        <h2 className="tk-display text-h2 font-semibold">
          {days === null
            ? t('home.testNone')
            : days < 0
              ? t('home.testPast')
              : days === 0
                ? t('home.testToday')
                : days === 1
                  ? t('home.testTomorrow')
                  : t('home.testInDays', { aantal: days })}
        </h2>

        {/* Which subject, as a badge of its own so the sentence about the date
            stays a sentence about the date. The module's icon rather than its
            accent: §B keeps an accent to the highlight, the progress bar and
            the module entrance, and §E lets an icon carry the module it
            denotes. */}
        {subject ? (
          <span className="tk-badge-outline">
            <SubjectIcon subject={subject} />
            {t(subject.name)}
          </span>
        ) : null}

        {/* Right-aligned where there is room, per K1, and simply next in the
            wrap where there is not. */}
        <Button
          variant="secondary"
          className="sm:ml-auto"
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          {plan.date === null && subject === null ? t('home.testSet') : t('home.testChange')}
        </Button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-ink-2">{t('home.testPick')}</span>
            {/* Uncontrolled, deliberately. A date input is edited a segment at
                a time and only reports a change once all three are valid, so
                a value driven from state fights the person typing into it. */}
            <input
              type="date"
              className="tk-input"
              defaultValue={plan.date ?? dayKey(now)}
              onChange={(event) => plan.setDate(event.target.value)}
            />
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-ink-2">{t('home.testSubjectPick')}</span>
            <select
              className="tk-input"
              value={plan.subject ?? ''}
              onChange={(event) => plan.setSubject(event.target.value)}
            >
              <option value="">{t('home.testSubjectNone')}</option>
              {TEST_SUBJECTS.map((module) => (
                <option key={module.id} value={module.id}>
                  {t(module.name)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}

/** The module's own pictogram, at the size a badge carries. */
function SubjectIcon({ subject }: { readonly subject: Module }) {
  const Icon = MODULE_ICON[subject.id];
  return <Icon size={20} />;
}
