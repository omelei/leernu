import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NieuweDieren } from './NieuwDier';

/**
 * The card that hands over what a round earned.
 *
 * Checked here rather than through the browser because getting there for real
 * costs twenty-five correct answers — two and a half rounds of the provinces,
 * clicked one at a time — and a Playwright test that plays three rounds to
 * assert one card is a test that makes every run slower for everybody. What a
 * browser would add over this is the animation, and that is a thing for eyes.
 *
 * The arithmetic that decides *which* animals arrive is `nieuwePlekken`, tested
 * in game-core where it belongs.
 */
describe('the parcel, opened', () => {
  it('says nothing at all when a round earned nothing', () => {
    const { container } = render(<NieuweDieren plekken={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the animal, its reeks and the level that handed it over', () => {
    // The fourth animal of the first reeks, which is the one level two gives.
    render(<NieuweDieren plekken={[{ reeks: 'brons', plek: 3 }]} />);

    expect(screen.getByRole('heading', { name: 'Je hebt een nieuw dier!' })).toBeInTheDocument();
    expect(screen.getByText('Beer in brons')).toBeInTheDocument();
    expect(screen.getByText('Je haalde niveau 2.')).toBeInTheDocument();
  });

  it('counts them where a long round crossed two levels', () => {
    render(
      <NieuweDieren
        plekken={[
          { reeks: 'brons', plek: 3 },
          { reeks: 'brons', plek: 4 },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Je hebt 2 nieuwe dieren!' })).toBeInTheDocument();
    expect(screen.getByText('Haas in brons')).toBeInTheDocument();
  });

  /**
   * The drawings are decorative. The two lines beside them say which animal and
   * which reeks in words, and a screen reader that read the parcel and the
   * animal as well would announce the same thing three times.
   */
  it('leaves the drawings out of the accessibility tree', () => {
    const { container } = render(<NieuweDieren plekken={[{ reeks: 'ultra', plek: 0 }]} />);

    expect(container.querySelector('.tk-unwrap')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
