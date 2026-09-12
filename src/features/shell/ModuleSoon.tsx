import { Lijst, PaginaKop, Plaat, Rij, SectieKop } from '@/components/ds';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { BUILT_MODULES, type Module } from './modules';

/**
 * A module the plan has and the product does not, reached from Oefenen or by
 * typing its address.
 *
 * It names the module, says plainly that it does not exist, and then offers
 * the ones that do, as the rows Oefenen draws. No date: a date we might miss is
 * worse than no date. What it does not do is dress the absence up or hide it
 * in prose: "Bestaat nog niet" is the meta line under the name.
 */
export function ModuleSoon({
  module,
  onOpen,
}: {
  readonly module: Module;
  readonly onOpen: (id: Module['id']) => void;
}) {
  return (
    <div className="ln-pagina" data-module={module.id}>
      <PaginaKop titel={t(module.naam)} meta={t('soon.subtitle')} soort="ding" />
      <p className="ln-tekst">{t('soon.body')}</p>

      <section className="flex flex-col gap-3" aria-labelledby="ln-soon-instead">
        <SectieKop titel={t('soon.instead')} id="ln-soon-instead" />
        <Lijst>
          {BUILT_MODULES.map((built) => (
            <Rij
              key={built.id}
              titel={t(built.naam)}
              sub={t('soon.insteadLine')}
              plaat={<Plaat Icoon={MODULE_ICON[built.id]} module={built.id} />}
              onClick={() => onOpen(built.id)}
            />
          ))}
        </Lijst>
      </section>
    </div>
  );
}
