import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { t } from '@/i18n';
import { getSetting, setSetting } from '@/store/profile';

/**
 * The test date, and why it is the only block on K1 with a surface and a border.
 *
 * Everything else on the home screen is something the child could do. This is
 * the reason they are doing it today, and the design gives it the one piece of
 * emphasis on the screen for exactly that: a child who is practising for
 * Tuesday should see Tuesday before they see anything else.
 *
 * It lives in `settings`, which is a key and a value and needs no schema
 * change — and it is device preference rather than player data, which is what
 * that store is for.
 *
 * There is no date picker. `<input type="date">` is the platform's own, it is
 * keyboard- and screen-reader-navigable for free, and a home-made calendar is
 * three weeks of work to arrive somewhere worse.
 */

const SETTING_KEY = 'toetsdatum';
/** YYYY-MM-DD in local time. Not toISOString, which is UTC and shifts the day. */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysUntil(date: string, now: Date): number {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function TestDate({ now = new Date() }: { readonly now?: Date }) {
  const [date, setDate] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void getSetting(SETTING_KEY).then((value) => {
      setDate(value ?? null);
      setLoaded(true);
    });
  }, []);

  // Nothing at all until we know: a block that says "no test yet" and then
  // changes its mind is worse than a block that arrives a moment late.
  if (!loaded) return null;

  const save = (value: string) => {
    setDate(value === '' ? null : value);
    setEditing(false);
    void setSetting(SETTING_KEY, value);
  };

  const days = date === null ? null : daysUntil(date, now);

  return (
    <section className="tk-card tk-card-accented flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tk-label">{t('home.testLabel')}</span>
        <p className="tk-display text-h2 font-semibold">
          {days === null
            ? t('home.testNone')
            : days < 0
              ? t('home.testPast')
              : days === 0
                ? t('home.testToday')
                : days === 1
                  ? t('home.testTomorrow')
                  : t('home.testInDays', { aantal: days })}
        </p>
      </div>

      {editing ? (
        <label className="flex flex-col gap-2">
          <span className="text-ink-2">{t('home.testPick')}</span>
          <input
            type="date"
            className="tk-input"
            defaultValue={date ?? dayKey(now)}
            onChange={(event) => save(event.target.value)}
          />
        </label>
      ) : (
        <Button variant="secondary" className="self-start" onClick={() => setEditing(true)}>
          {date === null ? t('home.testSet') : t('home.testChange')}
        </Button>
      )}
    </section>
  );
}
