import { Lijst, PaginaKop, Plaat, Rij } from '@/components/ds';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import { MODULES, type Category, type Module } from './modules';

/**
 * The word a parent types, when it holds more than one thing.
 *
 * One category exists, and its shape is the whole reason it does: **tafels
 * belongs under rekenen and klokkijken does not.** Telling the time is not
 * arithmetic — it is reading an instrument.
 *
 * This page is what /rekenen becomes on the day arithmetic is more than the
 * tables. Until then it is not what that address does: a category holding one
 * built module *is* that module (see `routes.ts`).
 *
 * The modules are rows, as on Oefenen. One that exists is a way in; one that
 * does not says so, dimmed, and cannot be pressed.
 */
export function CategoryScreen({
  category,
  onOpen,
}: {
  readonly category: Category;
  readonly onOpen: (module: Module) => void;
}) {
  const modules = MODULES.filter((module) => category.modules.includes(module.id));

  return (
    <div className="ln-pagina">
      <PaginaKop titel={t(category.name)} meta={t('category.holds')} />
      <Lijst aria-label={t(category.name)}>
        {modules.map((module) => (
          <Rij
            key={module.id}
            titel={t(module.naam)}
            sub={module.built ? t(module.sub) : t('soon.subtitle')}
            gedimd={!module.built}
            plaat={<Plaat Icoon={MODULE_ICON[module.id]} module={module.id} />}
            onClick={module.built ? () => onOpen(module) : undefined}
          />
        ))}
      </Lijst>
    </div>
  );
}
