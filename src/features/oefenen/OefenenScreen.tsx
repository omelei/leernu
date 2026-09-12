import { useEffect, useState } from 'react';
import { Chip, Lijst, PaginaKop, Plaat, Rij } from '@/components/ds';
import { aantalOnthouden, type ItemState } from '@/game-core';
import { geplaatst, startbareOnderdelen, type Gespeeld } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { MODULES, type Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import { loadDiplomas, loadVlagDiplomas } from '@/store/rewardStore';

/**
 * Oefenen (S3): "Waar wil je in oefenen?" — every module in one card, one row
 * each, in the order of the plan.
 *
 * A place, so its heading is the display size, and it has no meta line: seven
 * rows and a heading would not fit in 768 of height with one (S3's own note).
 * No primary action and no start bar either — every row is a way in, and none
 * is the way in. The only colour is each module's tint on its plate.
 *
 * A module that is not built is a row like the others, dimmed and saying so,
 * and still a door: its page answers that it is coming. The end of a row says
 * how the set last practised in that module stands — "9 / 12" — or, for the
 * tables and the flags, how many diplomas there are once there is one.
 *
 * The eighth row the handoff draws ("De achtste plek staat open") is left out:
 * it is a note about how the set can grow, addressed to whoever builds the
 * next module, and it would read to a child as a module that is missing.
 */
export function OefenenScreen({ onModule }: { readonly onModule: (id: Module['id']) => void }) {
  const [states, setStates] = useState<Map<string, ItemState> | null>(null);
  const [gespeeld, setGespeeld] = useState<readonly Gespeeld[]>([]);
  const [tafelDiplomas, setTafelDiplomas] = useState(0);
  const [vlagDiplomas, setVlagDiplomas] = useState(0);

  useEffect(() => {
    void loadItemStates().then(setStates);
    void loadPlayedRounds().then((rondes) => setGespeeld(geplaatst(rondes, startbareOnderdelen())));
    void loadDiplomas().then((set) => setTafelDiplomas(set.size));
    void loadVlagDiplomas().then((set) => setVlagDiplomas(set.size));
  }, []);

  const nu = new Date();

  /** The end of a row: diplomas where there are any, else the last set's count. */
  function einde(module: Module) {
    if (!module.built || states === null) return null;

    const diplomas =
      module.id === 'tafels' ? tafelDiplomas : module.id === 'vlaggen' ? vlagDiplomas : 0;
    if (diplomas > 0) {
      return (
        <Chip>
          {diplomas === 1 ? t('oefenen.diploma') : t('oefenen.diplomas', { aantal: diplomas })}
        </Chip>
      );
    }

    // Newest first, so the first round in this module is the set last practised.
    const laatste = gespeeld.find(({ deel }) => deel.moduleId === module.id)?.deel;
    if (!laatste) return null;
    const ids = laatste.items.map((item) => item.id);
    const goed = aantalOnthouden(states, ids, nu);

    return (
      <span className="ln-getal">
        <span aria-hidden="true">{`${goed} / ${ids.length}`}</span>
        <span className="ln-sr-only">{t('oefenen.standLabel', { goed, totaal: ids.length })}</span>
      </span>
    );
  }

  return (
    <div className="ln-pagina">
      <PaginaKop titel={t('oefenen.titel')} />

      <Lijst aria-label={t('oefenen.titel')}>
        {MODULES.map((module) => (
          <Rij
            key={module.id}
            titel={t(module.naam)}
            sub={t(module.sub)}
            gedimd={!module.built}
            plaat={<Plaat Icoon={MODULE_ICON[module.id]} module={module.id} />}
            einde={einde(module)}
            onClick={() => onModule(module.id)}
          />
        ))}
      </Lijst>
    </div>
  );
}
