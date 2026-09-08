import type { ReactNode } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import { Brandmark } from '@/components/Brandmark';
import { t } from '@/i18n';
import { MODULE_ICON } from './moduleIcons';
import {
  BUILT_DESTINATIONS,
  RAIL_MODULES,
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
 * The four destinations have two postures for the same reason. On a phone they
 * are the tab bar along the bottom, where a thumb is; from a tablet up they
 * are a row in the app bar, where the pointer is and where the bottom of the
 * screen is a long way from anything. Exactly one of the two is displayed at
 * any width, so nothing is offered twice.
 *
 * **Nothing here appears during a round.** Not hidden: not rendered. A round
 * screen is not wrapped in this component at all, so there is no navigation in
 * the document to tab into, no bar to mis-tap on a 393px screen with the map
 * under a thumb, and nothing to hide and forget to hide again. e2e/shell.spec.ts
 * asserts it from the outside.
 */

export interface ShellProps {
  readonly children: ReactNode;
  /**
   * Which destination is showing, when one is.
   *
   * Not all of them are: a module page is not Vandaag, and it used to say it
   * was — this defaulted to 'vandaag', so a child standing in the tables read
   * an app bar telling them they were on the front door. A screen that is not a
   * destination marks nothing, which is the truth and is also what a screen
   * reader should hear.
   */
  readonly current?: Destination['id'];
  readonly onNavigate?: (id: Destination['id']) => void;
  /**
   * Which module is open, so the rail can say so truthfully.
   *
   * It used to be hardcoded to the first entry, which was harmless while there
   * was one module and a lie the moment there were two: the rail told a child
   * they were in topography while they were doing tables.
   */
  readonly currentModule?: Module['id'];
  readonly onModule?: (id: Module['id']) => void;
  /** The streak, the profile switch — whatever the app bar is carrying today. */
  readonly bar?: ReactNode;
  /**
   * The rest of the address, drawn beside the wordmark: "leer.nu" + this.
   *
   * §A draws that as a lockup and K2 puts it in the app bar, and it is the one
   * place in the product that says a page has an address — something a parent
   * can write on a note or a teacher can put on a board. Absent on the front
   * door, where the address is nothing and "leer.nu/" would be a stub.
   */
  readonly address?: string | undefined;
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
  current,
  onNavigate,
  currentModule,
  onModule,
  bar,
  address,
  modules = RAIL_MODULES,
  destinations = BUILT_DESTINATIONS,
}: ShellProps) {
  // A tab bar with one destination is a label you cannot press that costs 56px
  // on the smallest screen there is, so it waits until there is somewhere to
  // go. The rail no longer waits: ADR-051 makes it the map of the product
  // rather than an index of what is finished.
  const showRail = modules.length >= NAVIGATION_MINIMUM;
  const showDestinations = destinations.length >= NAVIGATION_MINIMUM;

  const destinationItems = destinations.map((destination) => ({
    ...destination,
    label: t(destination.name),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="tk-appbar flex-none">
        {/* The mark, and the way back to the front door. A logo that goes home
            is a convention every child already knows from every other site
            they use, and until now this one was a picture that did nothing. */}
        <button
          type="button"
          className="tk-brand"
          aria-label={t('nav.home', { merk: brand.name })}
          onClick={() => onNavigate?.('vandaag')}
        >
          <Wordmark size={24} clearSpace={false} />
        </button>

        {/* Outside the button, because the mark is the way home and the path
            is where you already are — one is a control and the other is a
            fact. Hidden from a screen reader for the same reason the heading
            under it is not: it says the module's name a second time, in a
            spelling nobody says out loud. */}
        {address === undefined ? null : (
          <span aria-hidden="true" className="tk-brand-path">
            {address}
          </span>
        )}

        {showDestinations ? (
          // From a tablet up. On a phone the same list is the tab bar at the
          // foot of the page, and only one of the two is ever displayed.
          <nav aria-label={t('nav.destinations')} className="tk-navbar hidden md:flex">
            {destinationItems.map((destination) => (
              <button
                key={destination.id}
                type="button"
                aria-current={destination.id === current ? 'page' : undefined}
                className="tk-navbar-item"
                onClick={() => onNavigate?.(destination.id)}
              >
                {destination.label}
              </button>
            ))}
          </nav>
        ) : null}

        {bar}
      </header>

      {/* Column-reverse below the rail breakpoint puts the bar under the
          content without moving it in the document, so the reading order and
          the tab order stay the order of the page. */}
      <div className="flex min-h-0 flex-1 flex-col-reverse xl:flex-row">
        {showRail ? (
          <div className="tk-rail flex-none">
            {/* Top left of the page, where the rail stands up and the design
                puts the merkteken. It is the mark on its own and the wordmark
                in the bar is two steps away, so it carries no second name for
                a screen reader to read out twice. */}
            <Brandmark className="tk-rail-brand" size={32} />

            <nav aria-label={t('nav.modules')} className="tk-rail-nav">
              {modules.map((module) => {
                const ModuleIcon = MODULE_ICON[module.id];

                return (
                  <button
                    key={module.id}
                    type="button"
                    data-module={module.id}
                    aria-current={module.id === currentModule ? 'page' : undefined}
                    className="tk-rail-item"
                    onClick={() => onModule?.(module.id)}
                  >
                    <ModuleIcon size={24} />
                    {t(module.name)}
                  </button>
                );
              })}
            </nav>
          </div>
        ) : null}

        <main className="min-h-0 min-w-0 flex-1">{children}</main>
      </div>

      {showDestinations ? (
        <nav aria-label={t('nav.destinations')} className="tk-tabbar flex-none md:hidden">
          {destinationItems.map((destination) => (
            <button
              key={destination.id}
              type="button"
              aria-current={destination.id === current ? 'page' : undefined}
              className="tk-tabbar-item"
              onClick={() => onNavigate?.(destination.id)}
            >
              {destination.label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
