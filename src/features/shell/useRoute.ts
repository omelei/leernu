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

  const go = (next: Route) => {
    const path = pathFor(next);
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
    setRoute(next);
  };

  return [route, go];
}
