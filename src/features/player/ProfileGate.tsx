import { useState, type FormEvent } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import { t } from '@/i18n';
import { createProfile } from '@/store/profile';
import type { ProfileRecord } from '@/store/db';

/**
 * The first screen. It asks for a name and nothing else — no e-mail, no class,
 * no age. The name is used to say hello and never leaves the device, and the
 * copy says exactly that, because a child who is asked for their name deserves
 * to be told where it goes.
 */
export function ProfileGate({ onReady }: { readonly onReady: (profile: ProfileRecord) => void }) {
  const [naam, setNaam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length < 2) {
      setError(t('profile.nameTooShort'));
      return;
    }
    setBusy(true);
    onReady(await createProfile(naam));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
      <div>
        <Wordmark height={28} clearSpace={false} />
        <p className="mt-1 text-tekst-secundair">{brand.slogan}</p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="tk-card flex flex-col gap-4">
        <h1 className="tk-display text-sectiekop">{t('profile.title')}</h1>
        <label htmlFor="naam" className="text-tekst-secundair">
          {t('profile.help')}
        </label>
        <input
          id="naam"
          className="tk-input"
          value={naam}
          onChange={(event) => {
            setNaam(event.target.value);
            setError(null);
          }}
          placeholder={t('profile.placeholder')}
          autoComplete="off"
          maxLength={24}
          aria-describedby={error ? 'naam-error' : undefined}
          aria-invalid={error !== null}
        />
        {error !== null && (
          <p id="naam-error" role="alert" className="font-semibold text-fout">
            {error}
          </p>
        )}
        <button type="submit" className="tk-button" disabled={busy}>
          {t('profile.submit')}
        </button>
      </form>
    </main>
  );
}
