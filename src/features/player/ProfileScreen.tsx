import { useEffect, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import { FamilyIcon, PupilIcon } from '@/components/Icon';
import { createChild, listChildren, switchChild } from '@/store/children';
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

  /**
   * The switch moves after the write, not before it. Flipping it first and
   * writing afterwards reads a few milliseconds sooner and is a lie the moment
   * the write does not land: a child who turns the clock on and closes the tab
   * would find it off again. What the switch shows is what is stored.
   */
  const toggle = (name: keyof Preferences) => {
    const next = { ...prefs, [name]: !prefs[name] };
    void savePreference(name, next[name]).then(() => setPrefs(next));
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <div>
        <h1 className="tk-display text-h1 font-semibold">{t('you.title')}</h1>
        <p className="mt-1 text-ink-2">{t('you.nameIs', { naam: profile.naam })}</p>
      </div>

      <Children active={profile} />

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

/**
 * The family on this device, ADR-046.
 *
 * A child here is a name and a set of boxes, not an account: no password, no
 * e-mail, nothing to sign in to. What it fixes is the failure that was already
 * in the schema — three children on one iPad were one learner as far as the
 * scheduler was concerned, and the youngest kept being asked the eldest's
 * provinces.
 *
 * Switching reloads the page. That is blunt and it is right: every screen holds
 * some of a child's work in React state, and the one thing this must never do
 * is show one child a number that belongs to another. A reload is a few hundred
 * milliseconds on a local app and it cannot be got subtly wrong.
 */
function Children({ active }: { readonly active: ProfileRecord }) {
  const [children, setChildren] = useState<ProfileRecord[]>([]);
  const [adding, setAdding] = useState(false);
  const [naam, setNaam] = useState('');

  useEffect(() => {
    void listChildren().then(setChildren);
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length === 0) return;
    await createChild(naam);
    window.location.reload();
  }

  async function give(id: string) {
    await switchChild(id);
    window.location.reload();
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.children')}>
      <h2 className="tk-label">{t('you.children')}</h2>

      {children.map((child) => (
        <button
          key={child.id}
          type="button"
          className="tk-module-card w-full"
          aria-pressed={child.id === active.id}
          disabled={child.id === active.id}
          onClick={() => void give(child.id)}
        >
          <PupilIcon size={24} />
          <span className="min-w-0">
            <span className="block font-semibold">{child.naam}</span>
            <span className="block text-ink-2">
              {child.id === active.id
                ? t('you.practisingNow')
                : t('you.switchTo', { naam: child.naam })}
            </span>
          </span>
        </button>
      ))}

      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-center gap-3">
          <label htmlFor="kind" className="tk-sr-only">
            {t('you.childName')}
          </label>
          <input
            id="kind"
            className="tk-input max-w-xs"
            value={naam}
            onChange={(event) => setNaam(event.target.value)}
            placeholder={t('you.childName')}
            autoComplete="off"
            maxLength={24}
          />
          <button type="submit" className="tk-button" disabled={naam.trim().length === 0}>
            {t('you.add')}
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="tk-button tk-button-secondary self-start"
          onClick={() => setAdding(true)}
        >
          <FamilyIcon size={24} />
          {t('you.addChild')}
        </button>
      )}

      {/* Said once, where a parent adding the second child will read it. */}
      <p className="text-ink-2">{t('you.childExplain')}</p>
    </section>
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
