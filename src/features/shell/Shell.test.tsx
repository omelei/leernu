import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Shell } from './Shell';
import { DESTINATIONS } from './modules';

/**
 * The frame: one navigation, four destinations, in two postures.
 *
 * Playwright checks the sizes and the round; this checks what is true at every
 * size. jsdom applies no stylesheet, so both postures — the rail and the tab
 * bar — are in the tree here, and CSS decides at a real width which one is
 * displayed.
 */
describe('the shell', () => {
  it('offers the four destinations of the contract, in order', () => {
    render(
      <Shell>
        <p>vandaag</p>
      </Shell>,
    );

    const navs = screen.getAllByRole('navigation', { name: 'Waar je heen kunt' });
    // The rail and the tab bar: the same list, never both on screen at once.
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      const names = [...nav.querySelectorAll('button')].map((button) => button.textContent);
      expect(names).toEqual(['Vandaag', 'Oefenen', 'Verzameling', 'Jij']);
    }
  });

  it('has no navigation of modules and no tabs across the top', () => {
    render(
      <Shell>
        <p>vandaag</p>
      </Shell>,
    );

    // One rail, not a rail and tabs (stap 7, point 12). The modules are the
    // page Oefenen now, not a second navigation.
    expect(screen.queryByRole('navigation', { name: 'Modules' })).toBeNull();
    expect(screen.getByRole('banner').querySelectorAll('nav')).toHaveLength(0);
  });

  it('marks where you are, once in each posture', () => {
    render(
      <Shell current="verzameling">
        <p>verzameling</p>
      </Shell>,
    );

    for (const nav of screen.getAllByRole('navigation', { name: 'Waar je heen kunt' })) {
      const current = [...nav.querySelectorAll('[aria-current="page"]')];
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveTextContent('Verzameling');
    }
  });

  it('marks no destination on a screen that is none of them', () => {
    render(
      <Shell>
        <p>iets anders</p>
      </Shell>,
    );

    for (const nav of screen.getAllByRole('navigation', { name: 'Waar je heen kunt' })) {
      expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    }
  });

  it('goes where a destination is pressed', () => {
    const seen: string[] = [];
    render(
      <Shell onNavigate={(id) => seen.push(id)}>
        <p>vandaag</p>
      </Shell>,
    );

    const [rail] = screen.getAllByRole('navigation', { name: 'Waar je heen kunt' });
    fireEvent.click(
      [...(rail as HTMLElement).querySelectorAll('button')].find(
        (button) => button.textContent === 'Oefenen',
      ) as HTMLElement,
    );
    expect(seen).toEqual(['oefenen']);
  });

  it('makes the logo the way back to Vandaag, and names the product once', () => {
    const seen: string[] = [];
    render(
      <Shell onNavigate={(id) => seen.push(id)}>
        <p>vandaag</p>
      </Shell>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'leer.nu, naar Vandaag' }));
    expect(seen).toEqual(['vandaag']);
    // One drawing that carries the name: the logo inside the button.
    expect(document.querySelectorAll('[aria-label="leer.nu"]')).toHaveLength(1);
  });

  it('lets a module page stand where the logo does', () => {
    render(
      <Shell kop={<span>Topografie</span>} destinations={DESTINATIONS}>
        <p>topografie</p>
      </Shell>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Topografie');
    expect(screen.queryByRole('button', { name: 'leer.nu, naar Vandaag' })).toBeNull();
  });
});
