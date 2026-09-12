import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Heldplaat } from '@/components/Heldplaat';
import { Kaart, Lijst, materiaalNaam, PaginaKop, Rij, Schakelaar, Veld } from '@/components/ds';
import { stickerById } from '@/components/stickerSet';
import { reeksVan, useHelden } from '@/features/reis/useHelden';
import { t } from '@/i18n';
import { createChild, listChildren, switchChild } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { readVakantie, setVakantie } from '@/store/streakStore';
import { DEFAULT_PREFERENCES, loadPreferences, savePreference, type Preferences } from './settings';

/**
 * Jij (S12): the hero a child wears, two switches, and the way to a brother's
 * or sister's turn.
 *
 * **Two switches, not three.** Reading aloud, and holiday mode. S12's second
 * switch was "tijd meten in een ronde"; time belongs to the game forms with a
 * clock, which are out of scope, and a switch for a clock no round has is a
 * promise the screen does not keep. Holiday mode takes its place: the streak
 * with its freezer and its holidays is in scope, and this is where a child or
 * a parent says "we are away".
 *
 * **What S12 draws and this leaves out:** the friend code (friendships are out
 * of scope), and the group, which is what the VO guise will switch on — out of
 * scope as well. Neither is drawn as an empty shell.
 *
 * **Each switch moves after the write, not before it.** What it shows is what
 * is stored.
 *
 * Handing the device to another child is the existing family of ADR-046:
 * children on one device, no accounts. It stays, under the tertiary action S12
 * draws, because taking it away would strand a second child's work.
 */
export function JijScreen({
  profile,
  onVerzameling,
}: {
  readonly profile: ProfileRecord;
  /** "Wisselen": the hero is chosen on the collection, where the heroes are. */
  readonly onVerzameling: () => void;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [vakantie, setVakantieStand] = useState(false);
  const [geladen, setGeladen] = useState(false);
  const [kinderen, setKinderen] = useState(false);
  const helden = useHelden();

  useEffect(() => {
    void Promise.all([loadPreferences(), readVakantie()]).then(([value, weg]) => {
      setPrefs(value);
      setVakantieStand(weg);
      setGeladen(true);
    });
  }, []);

  const sticker = profile.avatarConfig.sticker;
  const reeks = reeksVan(helden, sticker);

  return (
    <div className="ln-pagina">
      <PaginaKop titel={t('you.title')} meta={t('you.nameIs', { naam: profile.naam })} />

      <Kaart className="ln-jij-held">
        <Heldplaat sticker={sticker} reeks={reeks} size={72} className="ln-object" />
        <div className="min-w-0 flex-1">
          <p className="ln-titel">
            {t('jij.heldNaam', {
              held: t(stickerById(sticker).name),
              materiaal: materiaalNaam(reeks),
            })}
          </p>
          <p className="ln-sub">{t('jij.held')}</p>
        </div>
        <Button variant="secondary" onClick={onVerzameling}>
          {t('jij.wisselen')}
        </Button>
      </Kaart>

      <section aria-label={t('you.settings')} aria-busy={!geladen}>
        <Lijst>
          <li>
            <Schakelaar
              titel={t('you.readAloud')}
              uitleg={t('you.readAloudWhy')}
              aan={prefs.readAloud}
              onWissel={(aan) =>
                void savePreference('readAloud', aan).then(() => setPrefs({ readAloud: aan }))
              }
            />
          </li>
          <li>
            <Schakelaar
              titel={t('jij.vakantie')}
              uitleg={t('jij.vakantieWhy')}
              aan={vakantie}
              onWissel={(aan) => void setVakantie(aan).then(setVakantieStand)}
            />
          </li>
        </Lijst>
      </section>

      <div className="ln-jij-voet">
        <Button
          variant="tertiary"
          aria-expanded={kinderen}
          onClick={() => setKinderen((open) => !open)}
        >
          {t('jij.anderKind')}
        </Button>
        {kinderen ? <Kinderen active={profile} /> : null}
        <p className="ln-sub">{t('you.stays')}</p>
      </div>
    </div>
  );
}

/**
 * The family on this device (ADR-046). Switching reloads the page: every
 * screen holds some of a child's work in React state, and the one thing this
 * must never do is show one child a number that belongs to another.
 */
function Kinderen({ active }: { readonly active: ProfileRecord }) {
  const [kinderen, setKinderen] = useState<ProfileRecord[]>([]);
  const [naam, setNaam] = useState('');

  useEffect(() => {
    void listChildren().then(setKinderen);
  }, []);

  async function voegToe(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length === 0) return;
    await createChild(naam);
    window.location.reload();
  }

  async function geefBeurt(id: string) {
    await switchChild(id);
    window.location.reload();
  }

  return (
    <section className="flex flex-col gap-4" aria-label={t('you.children')}>
      <Lijst aria-label={t('you.children')}>
        {kinderen.map((kind) => (
          <Rij
            key={kind.id}
            titel={kind.naam}
            sub={
              kind.id === active.id ? t('you.practisingNow') : t('you.switchTo', { naam: kind.naam })
            }
            huidig={kind.id === active.id}
            onClick={kind.id === active.id ? undefined : () => void geefBeurt(kind.id)}
          />
        ))}
      </Lijst>

      <form onSubmit={voegToe} className="flex flex-col gap-3">
        <Veld
          label={t('you.childName')}
          value={naam}
          onChange={(event) => setNaam(event.target.value)}
          autoComplete="off"
          maxLength={24}
        />
        <div>
          <Button type="submit" variant="secondary" disabled={naam.trim().length === 0}>
            {t('you.addChild')}
          </Button>
        </div>
      </form>
      <p className="ln-sub">{t('you.childExplain')}</p>
    </section>
  );
}
