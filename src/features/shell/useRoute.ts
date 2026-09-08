import { useEffect, useState } from 'react';
import { pathFor, routeFor, type Route } from './routes';

/**
 * The address bar, as state.
 *
 * Two directions and both matter. Navigating inside the app pushes an entry so
 * the back button works — a child on a phone reaches for the system back
 * gesture before they reach for anything we drew (§D's Android note says as
 * much). Arriving on a deep link reads the path, so leer.nu/topografie opens
 * topography rather than the front door.
 *
 * Rounds deliberately have no address. A round is a thing you are in the middle
 * of, and a URL that resumes one halfway would either lie about the progress or
 * throw it away. Starting a round leaves the path where it was.
 */
export function useRoute(): [Route, (next: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    routeFor(typeof window === 'undefined' ? '/' : window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setRoute(routeFor(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /**
   * The address a page is reached at is not always the one it lives at.
   *
   * /tafels is a synonym for /rekenen; /topografie/verzonnen names no set that
   * exists; a mistyped module lands on the front door. All three used to leave
   * the bar saying one thing and the page showing another — and now that the
   * app bar writes the address out beside the wordmark, that disagreement is
   * visible rather than merely true.
   *
   * Rewritten once, on arrival, and with `replaceState` rather than a push, so
   * the back button still goes where the child came from instead of bouncing
   * between the two spellings. Only on arrival: doing it after a popstate would
   * fight the history it just read.
   */
  useEffect(() => {
    const canonical = pathFor(routeFor(window.location.pathname));
    if (canonical !== window.location.pathname) {
      window.history.replaceState(null, '', canonical);
    }
  }, []);

  const go = (next: Route) => {
    const path = pathFor(next);
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
    setRoute(next);
  };

  return [route, go];
}
