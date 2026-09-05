import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/Brand';
import { t } from '@/i18n';
import {
  applyFontSetting,
  FONT_DEFAULT,
  FONT_DYSLEXIC,
  getSetting,
  SETTING_FONT,
  setSetting,
} from '@/store/profile';
import type { ProfileRecord } from '@/store/db';

/**
 * The start screen as it stands at the end of phase 0: it greets the player,
 * states plainly that the maps are still coming, and carries the one setting
 * that already works. It is honest rather than a mock-up — nothing here pretends
 * to be a feature that does not exist yet.
 */
export function HomeScreen({ profile }: { profile: ProfileRecord }) {
  return (
    <main aria-label={t('a11y.mainLabel')} className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between gap-4">
        <BrandMark size={32} />
        <p className="text-base text-ink-500">{t('streak.none')}</p>
      </header>

      <h1 className="mb-8 text-3xl">{t('home.greeting', { naam: profile.naam })}</h1>

      <section className="tk-card mb-8">
        <h2 className="mb-2 text-xl">{t('home.noMapsTitle')}</h2>
        <p className="text-ink-700">{t('home.noMapsBody')}</p>
      </section>

      <FontSetting />

      <p className="mt-10 text-center text-base text-ink-500">{t('privacy.line')}</p>
    </main>
  );
}

function FontSetting() {
  const [dyslexic, setDyslexic] = useState(false);

  useEffect(() => {
    void getSetting(SETTING_FONT).then((value) => setDyslexic(value === FONT_DYSLEXIC));
  }, []);

  async function toggle() {
    const next = !dyslexic;
    const value = next ? FONT_DYSLEXIC : FONT_DEFAULT;
    setDyslexic(next);
    applyFontSetting(value);
    await setSetting(SETTING_FONT, value);
  }

  return (
    <section aria-label={t('a11y.settingsLabel')} className="tk-card">
      <h2 className="mb-2 text-xl">{t('settings.title')}</h2>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id="font-setting-label" className="font-bold text-ink-900">
            {t('settings.font')}
          </p>
          <p id="font-setting-help" className="text-base text-ink-500">
            {t('settings.fontHelp')}
          </p>
        </div>
        {/* A switch rather than a checkbox, so the state is announced as on/off
            and the whole control is a 48px target.

            The label has to be wired up explicitly: the button's own text is
            "Aan" or "Uit", so without this a screen reader announces "Uit,
            schakelaar" and never says what is off. */}
        <button
          type="button"
          role="switch"
          aria-checked={dyslexic}
          aria-labelledby="font-setting-label"
          aria-describedby="font-setting-help"
          onClick={() => void toggle()}
          className="tk-button-quiet min-w-[6rem]"
        >
          {dyslexic ? t('settings.on') : t('settings.off')}
        </button>
      </div>
    </section>
  );
}
