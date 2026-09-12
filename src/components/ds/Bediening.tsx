import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { t } from '@/i18n';

/**
 * icoonknop, schakelaar en dialoog (S5, S12): the controls that are not a
 * plain button.
 */

/**
 * A round button with a pictogram and no word (S5): stop, read aloud. Its name
 * is its label, because the drawing alone says nothing to a screen reader.
 */
export function IcoonKnop({
  label,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'aria-label'> & {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <button type="button" {...rest} className="ln-icoonknop" aria-label={label}>
      {children}
    </button>
  );
}

/**
 * A switch (S12): its state in position, fill and a word. The whole row is the
 * button, so a child does not have to hit a track of 52 by 32; space and enter
 * both work, because it is a button with role="switch".
 */
export function Schakelaar({
  titel,
  uitleg,
  aan,
  onWissel,
}: {
  readonly titel: string;
  readonly uitleg?: string | undefined;
  readonly aan: boolean;
  readonly onWissel: (aan: boolean) => void;
}) {
  const uitlegId = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={aan}
      aria-describedby={uitleg ? uitlegId : undefined}
      className="ln-schakelaar"
      onClick={() => onWissel(!aan)}
    >
      <span className="ln-rij-tekst">
        <span className="ln-titel">{titel}</span>
        {uitleg ? (
          <span id={uitlegId} className="ln-sub">
            {uitleg}
          </span>
        ) : null}
      </span>
      <span className="ln-schakelaar-stand" aria-hidden="true">
        {aan ? t('ds.aan') : t('ds.uit')}
        <span className="ln-schakelaar-baan">
          <span className="ln-schakelaar-knop" />
        </span>
      </span>
    </button>
  );
}

/**
 * The one dialog in the whole of practising (S5): whether to stop a round. A
 * sheet under the thumb on a phone, a dialog in the middle from a tablet up;
 * the same content either way.
 *
 * Focus goes to the first button when it opens, stays inside it while it is
 * open, and goes back to where it came from when it closes. Escape is the
 * second button — "Verder oefenen" — because the one thing a child pressing
 * Escape does not want is to lose the round.
 */
export function Dialoog({
  titel,
  children,
  knoppen,
  onSluit,
}: {
  readonly titel: string;
  readonly children?: ReactNode;
  readonly knoppen: ReactNode;
  readonly onSluit: () => void;
}) {
  const titelId = useId();
  const paneel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const terug = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    paneel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => terug?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSluit();
      return;
    }
    if (event.key !== 'Tab' || !paneel.current) return;
    const focusbaar = Array.from(
      paneel.current.querySelectorAll<HTMLElement>('button, [href], input'),
    );
    const eerste = focusbaar[0];
    const laatste = focusbaar[focusbaar.length - 1];
    if (!eerste || !laatste) return;
    if (event.shiftKey && document.activeElement === eerste) {
      event.preventDefault();
      laatste.focus();
    } else if (!event.shiftKey && document.activeElement === laatste) {
      event.preventDefault();
      eerste.focus();
    }
  }

  return (
    <div className="ln-dekvlak">
      <div
        ref={paneel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titelId}
        className="ln-dialoog"
        onKeyDown={onKeyDown}
      >
        <span className="ln-dialoog-greep" aria-hidden="true" />
        <h2 id={titelId} className="ln-titel">
          {titel}
        </h2>
        {children ? <p className="ln-tekst">{children}</p> : null}
        <div className="ln-dialoog-knoppen">{knoppen}</div>
      </div>
    </div>
  );
}
