import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { t } from '@/i18n';
import { FamilyIcon, PupilIcon } from '@/components/Icon';
import { dayKey, grade, formatGrade } from '@/game-core';
import { createChild, listChildren, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { loadPlayedRounds, type PlayedRound } from '@/store/progress';
import { geplaatst, naamVan, startbareOnderdelen } from '@/features/module/onderdelen';
import { useTestPlan, daysUntil } from '@/features/home/testPlan';
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
export function ProfileScreen({
  profile,
  aside,
}: {
  readonly profile: ProfileRecord;
  readonly aside: ReactNode;
}) {
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
    <div className="tk-page">
      <div className="tk-page-main">
        <div>
          <h1 className="tk-display text-h1 font-semibold">{t('you.title')}</h1>
          <p className="mt-1 text-ink-2">{t('you.nameIs', { naam: profile.naam })}</p>
        </div>

        <Week />

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

      {aside}
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

/**
 * The week, for the adult in the room.
 *
 * "Jij" is the one screen in this product a parent opens, and until now it told
 * them their child's name and two switches. What a parent actually wants is
 * three sentences: has there been any practice this week, how did it go, and is
 * there a test coming (ADR-079).
 *
 * It is deliberately not a report on the child. No forecast, no percentage of
 * anything, no comparison — those live on Onthouden where they belong to the
 * child, and a parent reading a grade about their ten-year-old on a settings
 * page is the beginning of a conversation nobody wanted. What it says is what
 * happened: rounds, and what each came to.
 *
 * Seven days rather than "recently", because a week is the unit a parent thinks
 * in and it is the unit a school test is set in.
 */
function Week({ now = new Date() }: { readonly now?: Date }) {
  const [rondes, setRondes] = useState<readonly PlayedRound[] | null>(null);
  const plan = useTestPlan(now);

  useEffect(() => {
    void loadPlayedRounds().then(setRondes);
  }, []);

  if (rondes === null) return null;

  const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const grens = dayKey(week);
  const deze = rondes.filter((ronde) => ronde.at.slice(0, 10) >= grens);
  const gespeeld = geplaatst(deze, startbareOnderdelen());

  const beantwoord = deze.reduce((total, ronde) => total + ronde.answered, 0);
  const goed = deze.reduce((total, ronde) => total + ronde.correct, 0);
  const dagen = new Set(deze.map((ronde) => ronde.at.slice(0, 10))).size;
  const cijfer = grade(goed, beantwoord);

  // What was practised most, which is the sentence a parent repeats back.
  const perSet = new Map<string, number>();
  for (const { deel, ronde } of gespeeld) {
    perSet.set(naamVan(deel), (perSet.get(naamVan(deel)) ?? 0) + ronde.answered);
  }
  const meest = [...perSet.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const toets = plan.toetsen[0] ?? null;
  const dagenTot = toets === null ? null : daysUntil(toets.date, now);

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.week')}>
      <h2 className="tk-label">{t('you.week')}</h2>

      {deze.length === 0 ? (
        <p className="text-ink-2">{t('you.weekNone')}</p>
      ) : (
        <>
          <p className="text-body">
            {t('you.weekRounds', { rondes: deze.length, dagen, vragen: beantwoord })}
          </p>
          <p className="text-ink-2">
            {cijfer === null
              ? t('you.weekNoGrade')
              : t('you.weekGrade', { cijfer: formatGrade(cijfer) })}
          </p>
          {meest ? <p className="text-ink-2">{t('you.weekMost', { set: meest[0] })}</p> : null}
        </>
      )}

      {toets !== null && dagenTot !== null ? (
        <p className="text-ink-2">
          {dagenTot === 0
            ? t('home.testToday')
            : dagenTot === 1
              ? t('home.testTomorrow')
              : t('home.testInDays', { aantal: dagenTot })}
        </p>
      ) : null}
    </section>
  );
}
