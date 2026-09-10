import { fireEvent, render, screen, within } from '@testing-library/react';
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

    // Two of them, and that is the design rather than an accident: the same
    // four destinations stand in the app bar from a tablet up and lie along
    // the bottom on a phone, and CSS displays exactly one at any width. jsdom
    // applies no stylesheet, so both are in the tree here.
    expect(screen.getAllByRole('navigation', { name: 'Waar je heen kunt' })).toHaveLength(2);
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
    //
    // Short words, because K1 draws the rail that way: 88 pixels wide reads as
    // a list, and "Topografie" in it reads as prose that did not fit.
    expect(names).toEqual(['Topo', 'Rekenen', 'Klok', 'Taal', 'Spelling', 'Tijdvakken', 'Vlaggen']);
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

    // In each posture separately: one marked entry per bar, not one across
    // both. Marking a destination in the tab bar and a different one in the app
    // bar is the failure this is worded to catch.
    for (const bar of screen.getAllByRole('navigation', { name: 'Waar je heen kunt' })) {
      const current = [...bar.querySelectorAll('[aria-current="page"]')];
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveTextContent('Onthouden');
    }
  });

  it('marks no destination on a screen that is not one', () => {
    // A module page is not Vandaag. `current` defaulted to 'vandaag', so a
    // child standing in the tables read an app bar telling them they were on
    // the front door — and a screen reader heard it as the current page.
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS} currentModule="tafels">
        <p>rekenen</p>
      </Shell>,
    );

    for (const bar of screen.getAllByRole('navigation', { name: 'Waar je heen kunt' })) {
      expect(bar.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    }

    // The rail still says which module, because that part is true.
    const rail = screen.getByRole('navigation', { name: 'Modules' });
    expect(rail.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('names the product once, in the bar', () => {
    render(
      <Shell>
        <p>vandaag</p>
      </Shell>,
    );
    // Once, although the mark now appears twice: the merkteken at the head of
    // the rail is the same drawing with no name, so a screen reader hears the
    // brand a single time on the page.
    expect(screen.getByText('leer.nu')).toBeInTheDocument();
  });

  it('makes the logo the way back to the front door', () => {
    const seen: string[] = [];
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS} onNavigate={(id) => seen.push(id)}>
        <p>onthouden</p>
      </Shell>,
    );

    // A logo that goes home is a convention every child already knows from
    // every other site they use, and this one used to be a picture that did
    // nothing.
    fireEvent.click(screen.getByRole('button', { name: 'leer.nu, naar Vandaag' }));
    expect(seen).toEqual(['vandaag']);
  });

  it('does not write the path beside the mark', () => {
    // It used to: §A draws "leer.nu/topografie" as a lockup and the app bar
    // printed it. It is gone (ADR-068) — it told a child where they already
    // were, in a spelling nobody says out loud, in the strip of the screen
    // where width is worth the most. The addresses themselves are untouched;
    // `routes.test.ts` is where they are checked.
    const { container } = render(
      <Shell modules={MODULES} destinations={DESTINATIONS} currentModule="topo">
        <p>topografie</p>
      </Shell>,
    );

    expect(container.querySelector('.tk-brand-path')).toBeNull();
    expect(container.textContent).not.toContain('/topografie');
    expect(screen.getByRole('button', { name: 'leer.nu, naar Vandaag' })).toBeInTheDocument();
  });

  it('opens the modules as a list below 1200, and gives focus back when it closes', () => {
    // ADR-093. CSS decides which of the rail and the menu is displayed; jsdom
    // applies no stylesheet, so both are in the tree and this checks the menu.
    const seen: string[] = [];
    render(
      <Shell
        modules={MODULES}
        destinations={DESTINATIONS}
        currentModule="klok"
        onModule={(id) => seen.push(id)}
      >
        <p>klok</p>
      </Shell>,
    );

    const knop = screen.getByRole('button', { name: 'vak Klok' });
    expect(knop).toHaveAttribute('aria-expanded', 'false');

    // Closed, the list is not in the document at all, so the rail is the one
    // navigation called "Modules" — never two at once at a width that shows one.
    expect(screen.getAllByRole('navigation', { name: 'Modules' })).toHaveLength(1);

    fireEvent.click(knop);
    expect(knop).toHaveAttribute('aria-expanded', 'true');

    const lijst = document.getElementById(knop.getAttribute('aria-controls') ?? '');
    expect(lijst).not.toBeNull();
    const hier = within(lijst as HTMLElement).getByRole('button', { name: 'Klok' });

    // Open on the module you are in, and marked the way the rail marks it.
    expect(hier).toHaveAttribute('aria-current', 'page');
    expect(hier).toHaveFocus();

    // Escape closes it and puts focus back on the button that opened it.
    fireEvent.keyDown(hier, { key: 'Escape' });
    expect(knop).toHaveAttribute('aria-expanded', 'false');
    expect(knop).toHaveFocus();

    // A choice closes it too, and goes where it was asked to.
    fireEvent.click(knop);
    const opnieuw = document.getElementById(knop.getAttribute('aria-controls') ?? '');
    fireEvent.click(within(opnieuw as HTMLElement).getByRole('button', { name: 'Taal' }));
    expect(seen).toEqual(['woorden']);
    expect(knop).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves through the list with the arrow keys', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS} currentModule="topo">
        <p>topografie</p>
      </Shell>,
    );

    const knop = screen.getByRole('button', { name: 'vak Topo' });
    fireEvent.click(knop);
    const lijst = within(
      document.getElementById(knop.getAttribute('aria-controls') ?? '') as HTMLElement,
    );

    fireEvent.keyDown(lijst.getByRole('button', { name: 'Topo' }), { key: 'ArrowDown' });
    expect(lijst.getByRole('button', { name: 'Rekenen' })).toHaveFocus();

    fireEvent.keyDown(lijst.getByRole('button', { name: 'Rekenen' }), { key: 'End' });
    expect(lijst.getByRole('button', { name: 'Vlaggen' })).toHaveFocus();

    // Round again from the end, rather than stopping at a wall.
    fireEvent.keyDown(lijst.getByRole('button', { name: 'Vlaggen' }), { key: 'ArrowDown' });
    expect(lijst.getByRole('button', { name: 'Topo' })).toHaveFocus();
  });

  it('asks for a module where none is open', () => {
    render(
      <Shell modules={MODULES} destinations={DESTINATIONS}>
        <p>vandaag</p>
      </Shell>,
    );

    expect(screen.getByRole('button', { name: 'vak Kies een vak' })).toBeInTheDocument();
  });
});
