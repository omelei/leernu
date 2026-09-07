import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { t } from '@/i18n';
import type { Module } from './modules';

/**
 * A module the plan has and the product does not, reached by typing its address.
 *
 * ADR-037 keeps these out of the rail, and that still holds: a rail entry is an
 * offer, and offering six things that do nothing is six promises broken on the
 * first screen a child sees. A URL is the other way round — the child asked a
 * question, and "not yet" is a better answer than silently showing them
 * something else, which is what a redirect to the home screen would do.
 *
 * So it names the module, says plainly that it does not exist, and points at the
 * one that does. No date: a date we might miss is worse than no date.
 */
export function ModuleSoon({
  module,
  onHome,
}: {
  readonly module: Module;
  readonly onHome: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div data-module={module.id} className="tk-card flex items-center gap-4">
        <Dot size={40} fill={0} />
        <div>
          <h1 className="tk-display text-h1 font-semibold">{t(module.name)}</h1>
          <p className="mt-1 text-ink-2">{t('soon.body')}</p>
        </div>
      </div>

      <Button className="self-start" onClick={onHome}>
        {t('soon.action')}
      </Button>
    </div>
  );
}
