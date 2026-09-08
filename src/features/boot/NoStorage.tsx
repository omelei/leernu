import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { brand } from '@/config/brand';
import { t } from '@/i18n';
import type { NoStorageCause } from './bootProfile';

/**
 * What a child sees when the device will not keep anything.
 *
 * The alternative this replaces is a white page, which is what the app did
 * whenever the first read of IndexedDB never came back. A blank screen is not a
 * neutral outcome — it is the app claiming nothing is wrong while doing
 * nothing — and it leaves a parent with no word to search for and no button to
 * press.
 *
 * There is no server (ADR-015), so there is no honest "we will fix this at our
 * end" and no degraded online mode to fall back to. What can be bought here is
 * to be truthful about the whole product: everything lives on this device, this
 * device is not keeping it, and here is what a person can actually do about
 * that. Everything on the screen is either that sentence or a step someone can
 * take without knowing what IndexedDB is.
 *
 * The wordmark stays at the top. The screen is still the product — a page that
 * drops its own name reads like a browser error, and the parent needs to know
 * which thing is broken.
 */
export function NoStorage({
  cause,
  onRetry,
}: {
  readonly cause: NoStorageCause;
  readonly onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
      <Wordmark size={28} clearSpace={false} />

      <div className="tk-card flex flex-col gap-4">
        <h1 className="tk-display text-h2 font-semibold">
          {t('storage.title', { merk: brand.name })}
        </h1>
        <p className="font-semibold text-bad">
          {t(cause === 'blocked' ? 'storage.blocked' : 'storage.silent')}
        </p>
        <p className="text-ink-2">{t('storage.explain', { merk: brand.name })}</p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="tk-display text-h3 font-semibold">{t('storage.tryTitle')}</h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-ink-2">
          <li>{t('storage.tryTabs', { merk: brand.name })}</li>
          <li>{t('storage.tryPrivate', { merk: brand.name })}</li>
          <li>{t('storage.trySettings')}</li>
          <li>{t('storage.tryOther')}</li>
        </ul>
      </div>

      <Button className="self-start" onClick={onRetry}>
        {t('storage.retry')}
      </Button>
    </main>
  );
}
