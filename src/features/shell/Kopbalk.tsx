import { useEffect, useState } from 'react';
import { Heldplaat } from '@/components/Heldplaat';
import { Plaat } from '@/components/ds';
import { ChevronLeftIcon } from '@/components/Icon';
import { sterrenVoor } from '@/game-core';
import { reeksVan, useHelden } from '@/features/reis/useHelden';
import { t } from '@/i18n';
import { loadAccuracy } from '@/store/progress';
import type { ProfileRecord } from '@/store/db';
import { MODULE_ICON } from './moduleIcons';
import type { Module } from './modules';

/**
 * The parts of the kopbalk (S2, S4).
 *
 * On the right, on every page in the frame: the stars — "1.148 sterren", the
 * word dropped on a phone — and the child, their hero on its plate and their
 * name. The child is a button, the way to Jij, because it is the child's own
 * corner of the screen. The streak is not here: it is the meta line under
 * Vandaag (S2).
 */
export function KopbalkRechts({
  profile,
  onProfiel,
}: {
  readonly profile: ProfileRecord;
  readonly onProfiel: () => void;
}) {
  const [goed, setGoed] = useState<number | null>(null);
  const helden = useHelden();

  useEffect(() => {
    void loadAccuracy().then((accuracy) => setGoed(accuracy.correct));
  }, []);

  const sticker = profile.avatarConfig.sticker;
  const sterren = goed === null ? null : sterrenVoor(goed);

  return (
    <div className="ln-kopbalk-rechts">
      {sterren === null ? null : (
        <span className="ln-getal">
          <span aria-hidden="true">{sterren.toLocaleString('nl-NL')}</span>
          <span className="ln-getal-eenheid ln-kopbalk-woord" aria-hidden="true">
            {t('kop.sterren')}
          </span>
          <span className="ln-sr-only">
            {t('kop.sterrenLabel', { aantal: sterren.toLocaleString('nl-NL') })}
          </span>
        </span>
      )}

      <button type="button" className="ln-profiel" onClick={onProfiel}>
        <Heldplaat
          sticker={sticker}
          reeks={reeksVan(helden, sticker)}
          size={36}
          className="ln-object"
        />
        <span className="ln-profiel-naam">{profile.naam}</span>
      </button>
    </div>
  );
}

/**
 * Where the logo stands on a module's own page (S4): the module's plate and
 * its name — and on a phone a way back to Oefenen before them, because there
 * the rail is a tab bar at the other end of the screen.
 */
export function ModuleKop({
  module,
  onTerug,
}: {
  readonly module: Module;
  readonly onTerug: () => void;
}) {
  return (
    <div className="ln-modulekop" data-module={module.id}>
      <button
        type="button"
        className="ln-terug"
        aria-label={t('nav.terugNaarOefenen')}
        onClick={onTerug}
      >
        <ChevronLeftIcon size={24} />
      </button>
      <Plaat Icoon={MODULE_ICON[module.id]} module={module.id} klein />
      <span className="ln-titel">{t(module.naam)}</span>
    </div>
  );
}
