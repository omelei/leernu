import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import type { ProfileRecord } from '@/store/db';
import { DEFAULT_PREFERENCES, loadPreferences, savePreference, type Preferences } from './settings';

/**
 * K10, "Jij".
 *
 * Two switches, not three: ADR-025 dropped the reading mode, so the screen has
 * read-aloud and the timer and nothing pretending to be a setting.
 *
 * Most of what the design draws here needs something that does not exist yet.
 * The avatar set, the group, switching to a sibling's profile and the friend
 * code all belong to the parent account of ADR-046 or to the friend layer, and
 * none of it is built — so none of it is drawn. A settings screen full of
 * controls that do nothing is worse than a short one that works.
 *
 * School and place of residence are not here and never will be. They are the
 * two fields that would turn a name on a device into a child somebody could
 * find, and nothing this product does needs them.
 */
export function ProfileScreen({ profile }: { readonly profile: ProfileRecord }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadPreferences().then((value) => {
      setPrefs(value);
      setLoaded(true);
    });
  }, []);

  const toggle = (name: keyof Preferences) => {
    const next = { ...prefs, [name]: !prefs[name] };
    setPrefs(next);
    void savePreference(name, next[name]);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <div>
        <h1 className="tk-display text-h1 font-semibold">{t('you.title')}</h1>
        <p className="mt-1 text-ink-2">{t('you.nameIs', { naam: profile.naam })}</p>
      </div>

      <section className="flex flex-col gap-3" aria-busy={!loaded}>
        <h2 className="tk-label">{t('you.settings')}</h2>

        <Switch
          on={prefs.readAloud}
          label={t('you.readAloud')}
          why={t('you.readAloudWhy')}
          onToggle={() => toggle('readAloud')}
        />
        {/* The reason sits beside the switch rather than in a help page. A
            child who wants the clock should read why it is off before they
            turn it on, and an adult should be able to see we meant it. */}
        <Switch
          on={prefs.timer}
          label={t('you.timer')}
          why={t('you.timerWhy')}
          onToggle={() => toggle('timer')}
        />
      </section>

      <p className="text-ink-2">{t('you.stays')}</p>
    </div>
  );
}

function Switch({
  on,
  label,
  why,
  onToggle,
}: {
  readonly on: boolean;
  readonly label: string;
  readonly why: string;
  readonly onToggle: () => void;
}) {
  return (
    <button type="button" className="tk-card text-left" aria-pressed={on} onClick={onToggle}>
      <span className="flex items-center gap-4">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{label}</span>
          <span className="block text-ink-2">{why}</span>
        </span>
        {/* The state in a word as well as a shape: "aan" and "uit" survive
            being colour blind, and aria-pressed carries it to a screen reader
            without either. */}
        <span className="tk-label flex-none">{on ? t('you.on') : t('you.off')}</span>
      </span>
    </button>
  );
}
