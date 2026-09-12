import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { StopIcon } from '@/components/Icon';
import { SpeakButton } from '@/components/SpeakButton';
import { Dialoog, IcoonKnop, Ruiten, Teller } from '@/components/ds';
import { telwoord } from '@/features/home/dagen';
import { usePreferences } from '@/features/player/settings';
import { t } from '@/i18n';

/**
 * De vraagbalk (S5), the same on every round screen: stop, the question, the
 * counter, read aloud, and the diamonds under the question. Two lines high, so
 * that a question that wraps moves nothing below it, and the counter carries a
 * leading zero, so 07 to 08 moves nothing either.
 *
 * On a phone the bar turns round: stop, counter and read aloud on one line,
 * the diamonds under them, the question last and closest to the canvas.
 *
 * **The one dialog in practising.** Stop does not stop: it asks. Escape asks
 * too, from anywhere in the round, and never empties a field. Escape inside
 * the dialog is "Verder oefenen", because the one thing a child pressing
 * Escape does not want is to lose the round.
 *
 * The diamonds are read as a progress bar — a value out of a total — and not
 * as a picture, because that is what they are to a screen reader.
 */
export function Vraagbalk({
  vraag,
  voorlezen,
  index,
  totaal,
  beantwoord,
  goed,
  onStop,
}: {
  /** The question, which is the page's heading: a round has no other. */
  readonly vraag: string;
  /** What read aloud says, which is not always the heading (see KlokScreen). */
  readonly voorlezen: string;
  /** Which question is being asked, from zero. */
  readonly index: number;
  /** How many there are, or null for a round that does not count to a total. */
  readonly totaal: number | null;
  /** How many have been answered, which is index plus one once revealed. */
  readonly beantwoord: number;
  /** How many were right so far, for the sentence in the dialog. */
  readonly goed: number;
  readonly onStop: () => void;
}) {
  const prefs = usePreferences();
  const [afbreken, setAfbreken] = useState(false);

  useEffect(() => {
    if (afbreken) return;
    function onKeyDown(event: KeyboardEvent) {
      // An Escape the dialog already answered is not a new one. React runs
      // this effect again while that same keydown is still bubbling, so
      // without the check the dialog closes and opens again in one press.
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setAfbreken(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [afbreken]);

  return (
    <>
      <header className="ln-vraagbalk">
        <span className="ln-vraagbalk-stop">
          <IcoonKnop label={t('practice.stop')} onClick={() => setAfbreken(true)}>
            <StopIcon size={22} />
          </IcoonKnop>
        </span>
        <h1 className="ln-vraag">{vraag}</h1>
        <span className="ln-vraagbalk-rechts">
          {totaal !== null ? <Teller huidig={index + 1} totaal={totaal} /> : null}
          {prefs.readAloud ? <SpeakButton text={voorlezen} /> : null}
        </span>
        {totaal !== null ? (
          <div
            className="ln-vraagbalk-ruiten"
            role="progressbar"
            aria-label={t('a11y.progress')}
            aria-valuenow={beantwoord}
            aria-valuemin={0}
            aria-valuemax={totaal}
            aria-valuetext={t('practice.questionOf', { nu: index + 1, totaal })}
          >
            <Ruiten beantwoord={beantwoord} totaal={totaal} decoratief />
          </div>
        ) : null}
      </header>

      {afbreken ? (
        <Dialoog
          titel={t('ronde.afbreken')}
          onSluit={() => setAfbreken(false)}
          knoppen={
            <>
              <Button onClick={onStop}>{t('ronde.afbrekenKnop')}</Button>
              <Button variant="secondary" onClick={() => setAfbreken(false)}>
                {t('ronde.verder')}
              </Button>
            </>
          }
        >
          {bewaard(goed)}
        </Dialoog>
      ) : null}
    </>
  );
}

function bewaard(goed: number): string {
  if (goed === 0) return t('ronde.bewaardGeen');
  if (goed === 1) return t('ronde.bewaardEen');
  return t('ronde.bewaard', { aantal: telwoord(goed) });
}
