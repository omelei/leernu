import { useEffect, useState } from 'react';

/**
 * Whether this is a phone, in the one place a layout decision is not enough.
 *
 * Almost everything about size in this product is CSS: §D's postures follow the
 * number of hands and the distance to the screen, and a media query says all of
 * it without React knowing. This is the exception, because it does not change
 * how something is drawn — it changes **which way of practising is offered
 * first**, and a default is state (ADR-087).
 *
 * The breakpoint is the tab bar's: below 768 the destinations lie along the
 * bottom because there is one thumb, and below 768 a map gets about two hundred
 * pixels of height. Same width, same reason.
 */
const PHONE = '(max-width: 767px)';

export function useSmallScreen(): boolean {
  // Guarded because jsdom has no matchMedia and a component under test must not
  // fall over on a question about the screen it is not being drawn on.
  const [klein, setKlein] = useState(() => query()?.matches ?? false);

  useEffect(() => {
    const mq = query();
    if (!mq) return;

    const onChange = () => setKlein(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return klein;
}

function query(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE)
    : null;
}
