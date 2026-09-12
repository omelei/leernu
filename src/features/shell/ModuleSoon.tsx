import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { BUILT_MODULES, type Module } from './modules';

/**
 * A module the plan has and the product does not, reached from the rail or by
 * typing its address.
 *
 * ADR-051 put all five doors in the rail, so this is no longer only an answer
 * to a typed address — it is a page a child can walk into, and it has to be
 * worth walking into. It names the module, says plainly that it does not exist,
 * and then offers the ones that do. No date: a date we might miss is worse than
 * no date.
 *
 * What it does not do is dress the absence up or hide it in prose. "Bestaat nog
 * niet" is stamped above the name as a badge, which is the same treatment K1
 * gives an unbuilt tile and for the same reason: not-yet should be legible as a
 * shape and a position, not only as a sentence.
 *
 * It carries the child's own column like every other page inside the shell. A
 * page about something that does not exist is the last place to also take away
 * the things that do.
 */
export function ModuleSoon({
  module,
  onOpen,
  aside,
}: {
  readonly module: Module;
  readonly onOpen: (id: Module['id']) => void;
  readonly aside: ReactNode;
}) {
  const ModuleIcon = MODULE_ICON[module.id];

  return (
    <div className="tk-page" data-module={module.id}>
      <div className="tk-page-main">
        <div className="flex flex-col items-start gap-2">
          <span className="tk-badge-outline">
            <ModuleIcon size={20} />
            {t('soon.subtitle')}
          </span>
          <h1 className="tk-display tk-titel font-semibold">{t(module.name)}</h1>
          <p className="text-tekst-secundair">{t('soon.body')}</p>
        </div>

        <section className="flex flex-col gap-3" aria-label={t('soon.instead')}>
          <h2 className="tk-label">{t('soon.instead')}</h2>

          {BUILT_MODULES.map((built) => {
            const BuiltIcon = MODULE_ICON[built.id];

            return (
              <button
                key={built.id}
                type="button"
                data-module={built.id}
                className="tk-module-card w-full"
                onClick={() => onOpen(built.id)}
              >
                <BuiltIcon size={24} />
                <span className="min-w-0">
                  <span className="block font-semibold">{t(built.name)}</span>
                  <span className="block text-tekst-secundair">{t('soon.insteadLine')}</span>
                </span>
              </button>
            );
          })}
        </section>
      </div>

      {aside}
    </div>
  );
}
