import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icon';
import { t } from '@/i18n';

/** The gap between two cards, which is the rest of one step. Matches .tk-rij-baan. */
const GAP = 16;

/**
 * One of the front door's three rows: a heading, and cards that run on past the
 * right-hand edge (ADR-094).
 *
 * The scrollbar is hidden, and hiding it is the easy half. What this component
 * is for is the other half — that the row still moves for every way a child has
 * of moving it:
 *
 * - **a finger or a trackpad**, which the browser does by itself;
 * - **the two round buttons** in the heading, from a tablet up, which move the
 *   row one card at a time and switch off at either end;
 * - **the keyboard**: the row is a stop in the tab order and the arrow keys move
 *   it a card at a time. Tabbing on into the cards scrolls each one into view
 *   by itself, so the arrows are for the row and not for a card inside it.
 *
 * Smooth unless the reader has asked for less movement, in which case a step is
 * a jump. That is decided here and not left to the stylesheet, because
 * `scrollBy` with `behavior: 'smooth'` overrides the reduced-motion rule there.
 *
 * On a phone there are no buttons. The row is swiped, which is what a phone is
 * for, and two more controls in a heading 390 wide would cost it its words.
 */
export function ScrollRij({
  titel,
  onder,
  leeg,
  children,
}: {
  readonly titel: string;
  /** A line under the heading, where the row needs one. */
  readonly onder?: ReactNode;
  /** Said instead of the row while there is nothing in it. */
  readonly leeg?: string | undefined;
  readonly children?: ReactNode;
}) {
  const baan = useRef<HTMLDivElement>(null);
  const [randen, setRanden] = useState({ begin: true, eind: true });

  const meet = useCallback(() => {
    const el = baan.current;
    if (!el) return;
    const begin = el.scrollLeft <= 1;
    const eind = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    // The same object when nothing changed: this runs after every render, and
    // a fresh one each time would be a render loop.
    setRanden((nu) => (nu.begin === begin && nu.eind === eind ? nu : { begin, eind }));
  }, []);

  // After every render, because the cards can arrive after the row does — the
  // history is read from IndexedDB — and a row that measured itself while it
  // was empty would keep its right-hand button off with five cards in it.
  useEffect(() => {
    meet();
  });

  useEffect(() => {
    const el = baan.current;
    if (!el) return;

    el.addEventListener('scroll', meet, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(meet);
    observer?.observe(el);

    return () => {
      el.removeEventListener('scroll', meet);
      observer?.disconnect();
    };
  }, [meet, leeg]);

  function schuif(richting: 1 | -1) {
    const el = baan.current;
    if (!el) return;

    const kaart = el.firstElementChild;
    const breedte =
      kaart instanceof HTMLElement ? kaart.getBoundingClientRect().width : el.clientWidth;
    const rustig =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.scrollBy?.({ left: richting * (breedte + GAP), behavior: rustig ? 'auto' : 'smooth' });
  }

  function toets(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      schuif(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      schuif(-1);
    }
  }

  return (
    <section className="tk-rij" aria-label={titel}>
      <div className="tk-rij-kop">
        <h2 className="tk-label">{titel}</h2>

        {leeg === undefined ? (
          <div className="tk-rij-knoppen">
            <button
              type="button"
              className="tk-rij-knop"
              aria-label={t('home.rowBack', { rij: titel })}
              disabled={randen.begin}
              onClick={() => schuif(-1)}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              className="tk-rij-knop"
              aria-label={t('home.rowOn', { rij: titel })}
              disabled={randen.eind}
              onClick={() => schuif(1)}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        ) : null}
      </div>

      {onder}

      {leeg === undefined ? (
        <div
          ref={baan}
          className="tk-rij-baan"
          role="group"
          aria-label={titel}
          tabIndex={0}
          onKeyDown={toets}
        >
          {children}
        </div>
      ) : (
        <p className="text-tekst-secundair">{leeg}</p>
      )}
    </section>
  );
}
