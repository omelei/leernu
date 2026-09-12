import type { ComponentType, ReactNode } from 'react';
import { brand } from '@/config/brand';
import { Logo } from '@/components/ds';
import {
  JijIcon,
  OefenenIcon,
  VandaagIcon,
  VerzamelingIcon,
  type IconProps,
} from '@/components/Icon';
import { t } from '@/i18n';
import { DESTINATIONS, type Destination } from './modules';

/**
 * The frame around everything that is not a round (stap 2; stap 7, point 12).
 *
 * **One navigation, in two postures.** The four destinations — Vandaag,
 * Oefenen, Verzameling, Jij — stand in a rail of 88 on the left from a tablet
 * on its side up (1024, stap 3), and lie in a tab bar of 72 along the bottom
 * below it, where a thumb is. Never both: which one is displayed is CSS, and
 * the other is `display: none`, so a screen reader meets one list of four.
 * There are no tabs across the top any more, and the modules are no longer in
 * the frame at all: they are the page Oefenen.
 *
 * **The kopbalk** carries the logo — the way back to Vandaag — and, on the
 * right, the stars and the child. A module's own page puts the module where
 * the logo was (S4).
 *
 * **Nothing here appears during a round.** Not hidden: not rendered. A round
 * screen is not wrapped in this component at all (ADR-041), and the rail
 * disappears with it — completely, not dimmed (README).
 */

const ICOON: Record<Destination['id'], ComponentType<Omit<IconProps, 'children'>>> = {
  vandaag: VandaagIcon,
  oefenen: OefenenIcon,
  verzameling: VerzamelingIcon,
  jij: JijIcon,
};

export interface ShellProps {
  readonly children: ReactNode;
  /**
   * Which destination is showing. A module's page belongs to Oefenen; a
   * screen that is none of the four marks nothing, which is the truth and is
   * what a screen reader should hear.
   */
  readonly current?: Destination['id'] | undefined;
  readonly onNavigate?: ((id: Destination['id']) => void) | undefined;
  /** The right-hand end of the kopbalk: the stars and the child. */
  readonly bar?: ReactNode;
  /** What stands where the logo does, on a module's own page (S4). */
  readonly kop?: ReactNode;
  /** Injectable so the frame can be tested apart from the real list. */
  readonly destinations?: readonly Destination[] | undefined;
}

export function Shell({
  children,
  current,
  onNavigate,
  bar,
  kop,
  destinations = DESTINATIONS,
}: ShellProps) {
  const items = destinations.map((destination) => ({
    ...destination,
    label: t(destination.name),
    Icon: ICOON[destination.id],
  }));

  return (
    <div className="ln-app">
      <header className="ln-kopbalk">
        {kop ?? (
          <button
            type="button"
            className="ln-kopbalk-merk"
            aria-label={t('nav.home', { merk: brand.name })}
            onClick={() => onNavigate?.('vandaag')}
          >
            <span className="ln-kopbalk-logo">
              <Logo hoogte={20} />
            </span>
          </button>
        )}
        {bar}
      </header>

      <div className="ln-app-midden">
        <nav aria-label={t('nav.destinations')} className="ln-rail">
          {items.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={id === current ? 'page' : undefined}
              className="ln-rail-knop"
              onClick={() => onNavigate?.(id)}
            >
              <span className="ln-rail-plaat" aria-hidden="true">
                <Icon size={18} />
              </span>
              {label}
            </button>
          ))}
        </nav>

        <main className="ln-main">{children}</main>
      </div>

      <nav aria-label={t('nav.destinations')} className="ln-tabbar">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={id === current ? 'page' : undefined}
            className="ln-tabbar-knop"
            onClick={() => onNavigate?.(id)}
          >
            <Icon size={24} />
            <span className="ln-tabbar-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
