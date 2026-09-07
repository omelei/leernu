import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Shell } from './Shell';
import { DESTINATIONS, MODULES } from './modules';

/**
 * The frame, and the rule that decides whether it has navigation at all.
 *
 * Playwright checks the four sizes and the round; this checks the thing that is
 * true at every size — that navigation appears when there is somewhere to go
 * and not before.
 *
 * Both lists are injected here rather than read from the module, because with
 * one module and one destination built, a test of the real lists would only
 * ever prove that nothing renders.
 */
describe('the shell', () => {
  it('offers no navigation while there is one of everything', () => {
    // One of each, written here rather than read from the real lists. Those
    // grow — this test started failing the moment K9 became a second
    // destination — and what is being checked is the rule, not the content.
    render(
      <Shell modules={MODULES.slice(0, 1)} destinations={DESTINATIONS.slice(0, 1)}>
        <p>vandaag</p>
      </Shell>,
    );

    // A rail with one module is a decoration; a tab bar with one destination is
    // a label you cannot press, costing 56px on the smallest screen there is.
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(screen.getByText('vandaag')).toBeInTheDocument();
  });

  it('shows both once there is somewhere to go', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS}>
        <p>vandaag</p>
      </Shell>,
    );

    expect(screen.getByRole('navigation', { name: 'Modules' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Waar je heen kunt' })).toBeInTheDocument();
  });

  it('puts the modules in the order of the plan, with the clock third', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS}>
        <p>vandaag</p>
      </Shell>,
    );

    const rail = screen.getByRole('navigation', { name: 'Modules' });
    const names = [...rail.querySelectorAll('button')].map((button) => button.textContent);

    // ADR-029. Clock reading is third because that is where the plan puts it,
    // not appended after the modules that happened to exist first.
    expect(names).toEqual([
      'Topografie',
      'Tafels',
      'Klokkijken',
      'Woordjes',
      'Spelling',
      'Tijdvakken',
      'Vlaggen',
    ]);
  });

  it('lets a module carry its own accent without naming it', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS}>
        <p>vandaag</p>
      </Shell>,
    );

    const rail = screen.getByRole('navigation', { name: 'Modules' });
    const buttons = [...rail.querySelectorAll('button')];

    // data-module is the whole mechanism: the CSS resolves --accent from it, so
    // an eighth module is a row of data and a block of CSS, and no component
    // learns a new colour.
    expect(buttons.map((button) => button.dataset.module)).toEqual([
      'topo',
      'tafels',
      'klok',
      'woorden',
      'spelling',
      'tijdvakken',
      'vlaggen',
    ]);
  });

  it('marks where you are, in one place only', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS} current="onthouden">
        <p>onthouden</p>
      </Shell>,
    );

    const tabs = screen.getByRole('navigation', { name: 'Waar je heen kunt' });
    const current = [...tabs.querySelectorAll('[aria-current="page"]')];
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Onthouden');
  });

  it('names the product once, in the bar', () => {
    render(
      <Shell>
        <p>vandaag</p>
      </Shell>,
    );
    expect(screen.getByText('leer.nu')).toBeInTheDocument();
  });
});
