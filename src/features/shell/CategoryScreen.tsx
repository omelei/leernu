import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { t } from '@/i18n';
import { MODULES, type Category, type Module } from './modules';

/**
 * The word a parent types, and what sits under it.
 *
 * One category exists, and its shape is the whole reason it does: **tafels
 * belongs under rekenen and klokkijken does not.** Telling the time is not
 * arithmetic — it is reading an instrument — and business plan v6 already made
 * them two modules with two entrances and two accents. This adds the word an
 * adult reaches for without collapsing that back into one thing.
 *
 * Categories live at addresses and not in the rail. The rail lists modules,
 * because a module is what a child practises, and nobody practises "rekenen".
 */
export function CategoryScreen({
  category,
  onOpen,
  onHome,
}: {
  readonly category: Category;
  readonly onOpen: (module: Module) => void;
  readonly onHome: () => void;
}) {
  const modules = MODULES.filter((module) => category.modules.includes(module.id));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="tk-display text-h1 font-semibold">{t(category.name)}</h1>
        <p className="mt-1 text-ink-2">{t('category.holds')}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {modules.map((module) => (
          <li key={module.id}>
            {/* A module that exists is a way in; one that does not says so and
                cannot be pressed. Neither is dressed up as the other. */}
            <button
              type="button"
              data-module={module.id}
              className="tk-module-card w-full"
              disabled={!module.built}
              onClick={() => onOpen(module)}
            >
              <Dot size={24} fill={module.built ? 0.4 : 0} />
              <span>
                {t(module.name)}
                {module.built ? null : <span className="block text-ink-2">{t('soon.body')}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Button variant="secondary" className="self-start" onClick={onHome}>
        {t('soon.action')}
      </Button>
    </div>
  );
}
