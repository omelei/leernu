import { useEffect, useRef, useState, type FormEvent } from 'react';
import { brand } from '@/config/brand';
import { Button } from '@/components/Button';
import { Logo, PaginaKop, Veld } from '@/components/ds';
import { t } from '@/i18n';
import { createProfile } from '@/store/profile';
import type { ProfileRecord } from '@/store/db';

/**
 * The first screen (S1). It asks for a name and nothing else — no e-mail, no
 * class, no age. The name is used to say hello and never leaves the device,
 * and the meta line says exactly that, because a child who is asked for their
 * name deserves to be told where it goes.
 *
 * Straight on the ground: no kopbalk (S1's own deviation 1) and no card — a
 * heading and a field on their own. The heading is the display size, because
 * the first screen is a place. The field has focus when the screen appears,
 * and Enter in it does what "Verder" does.
 *
 * What S1 draws and this leaves out: "Al eerder geoefend op dit apparaat?".
 * There is one child per device in scope and nothing to recover; a way back
 * that leads nowhere is not drawn.
 */
export function ProfileGate({ onReady }: { readonly onReady: (profile: ProfileRecord) => void }) {
  const [naam, setNaam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formulier = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formulier.current?.querySelector('input')?.focus();
  }, []);

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
    <main className="ln-poort">
      <div className="ln-poort-merk">
        <Logo hoogte={44} />
        <p className="ln-sub">{brand.slogan}</p>
      </div>

      <form
        ref={formulier}
        onSubmit={(event) => void handleSubmit(event)}
        className="ln-poort-formulier"
        noValidate
      >
        <PaginaKop titel={t('profile.title')} meta={t('profile.help')} />
        <Veld
          label={t('profile.label')}
          value={naam}
          onChange={(event) => {
            setNaam(event.target.value);
            setError(null);
          }}
          placeholder={t('profile.placeholder')}
          autoComplete="off"
          maxLength={24}
          fout={error}
        />
        <div className="ln-start ln-start-los">
          <Button type="submit" busy={busy}>
            {t('profile.submit')}
          </Button>
        </div>
      </form>
    </main>
  );
}
