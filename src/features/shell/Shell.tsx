import type { ReactNode } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { AreaIcon } from '@/components/Icon';
import { t } from '@/i18n';
import {
  BUILT_DESTINATIONS,
  BUILT_MODULES,
  NAVIGATION_MINIMUM,
  type Destination,
  type Module,
} from './modules';

/**
 * The frame around everything that is not a round.
 *
 * §D: the navigation model follows the number of hands and the distance to the
 * screen, not the operating system. Behind a laptop there is a mouse at eye
 * level and the modules stand in a rail on the left. In one hand there is one
 * thumb and they lie along the bottom. The grid and the spacing scale do not
 * change, so the same building block keeps the same proportions everywhere.
 *
 * Width is a poorer proxy for that than §D's own reasoning would like — a
 * 1100px window on a laptop gets the tablet posture — but it is the proxy that
 * can be tested at four sizes without emulating a hand.
 *
 * **Nothing here appears during a round.** Not hidden: not rendered. A round
 * screen is not wrapped in this component at all, so there is no navigation in
 * the document to tab into, no bar to mis-tap on a 393px screen with the map
 * under a thumb, and nothing to hide and forget to hide again. e2e/shell.spec.ts
 * asserts it from the outside.
 */

export interface ShellProps {
  readonly children: ReactNode;
  /** Which tab bar destination is showing. */
  readonly current?: Destination['id'];
  readonly onNavigate?: (id: Destination['id']) => void;
  /** The streak, the profile switch — whatever the app bar is carrying today. */
  readonly bar?: ReactNode;
  /**
   * The two lists, injectable so the frame can be tested with more than the one
   * module and the one destination that exist today. Nothing in the app passes
   * them; a test that could only ever see a single entry would be testing the
   * content rather than the component.
   */
  readonly modules?: readonly Module[];
  readonly destinations?: readonly Destination[];
}

export function Shell({
  children,
  current = 'vandaag',
  onNavigate,
  bar,
  modules = BUILT_MODULES,
  destinations = BUILT_DESTINATIONS,
}: ShellProps) {
  // A rail with one module is a decoration, and a tab bar with one destination
  // is a label you cannot press that costs 56px on the smallest screen there
  // is. Both appear when there is somewhere to go.
  const showRail = modules.length >= NAVIGATION_MINIMUM;
  const showTabs = destinations.length >= NAVIGATION_MINIMUM;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="tk-appbar flex-none">
        <Wordmark size={24} clearSpace={false} />
        {bar}
      </header>

      {/* Column-reverse below the rail breakpoint puts the bar under the
          content without moving it in the document, so the reading order and
          the tab order stay the order of the page. */}
      <div className="flex min-h-0 flex-1 flex-col-reverse xl:flex-row">
        {showRail ? (
          <nav aria-label={t('nav.modules')} className="tk-rail flex-none">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                data-module={module.id}
                aria-current={module.id === modules[0]?.id ? 'page' : undefined}
                className="tk-rail-item"
              >
                <AreaIcon size={24} />
                {t(module.name)}
              </button>
            ))}
          </nav>
        ) : null}

        <main className="min-h-0 min-w-0 flex-1">{children}</main>
      </div>

      {showTabs ? (
        <nav aria-label={t('nav.destinations')} className="tk-tabbar flex-none md:hidden">
          {destinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              aria-current={destination.id === current ? 'page' : undefined}
              className="tk-tabbar-item"
              onClick={() => onNavigate?.(destination.id)}
            >
              {t(destination.name)}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
