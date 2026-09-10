import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoundOutcome } from '@/store/rewardStore';
import { Beloning } from './Beloning';

/**
 * What a round earned, on the screen at the end of it (ADR-096).
 *
 * Checked here rather than through the browser because getting there for real
 * costs fifty correct answers, and a Playwright test that plays five rounds to
 * assert one card makes every run slower for everybody. Which hero comes out is
 * chance, and the arithmetic around it is in game-core, tested there.
 */
function uitkomst(deel: Partial<RoundOutcome>): RoundOutcome {
  return {
    xp: 0,
    coins: 0,
    totalXp: 0,
    stamps: [],
    diploma: null,
    sterren: { erbij: 0, inKist: 0 },
    kisten: [],
    ...deel,
  };
}

describe('the reward after a round', () => {
  it('says nothing at all when a round earned nothing', () => {
    const { container } = render(<Beloning reward={uitkomst({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts the stars towards the next chest', () => {
    render(<Beloning reward={uitkomst({ sterren: { erbij: 2, inKist: 3 } })} />);

    expect(screen.getByRole('heading', { name: 'Je verdiende 2 sterren.' })).toBeInTheDocument();
    expect(screen.getByText('3 van de 5 sterren voor je volgende kist.')).toBeInTheDocument();
  });

  it('names the hero that came out of a chest, and its reeks', () => {
    render(
      <Beloning
        reward={uitkomst({
          sterren: { erbij: 1, inKist: 0 },
          kisten: [{ plek: 2, reeks: 'brons', dubbelen: 0, soort: 'nieuw' }],
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Je kist gaat open!' })).toBeInTheDocument();
    expect(screen.getByText('Vos komt erbij, in brons')).toBeInTheDocument();
  });

  it('counts a duplicate towards the next reeks, and says when a hero went up', () => {
    render(
      <Beloning
        reward={uitkomst({
          kisten: [
            { plek: 1, reeks: 'brons', dubbelen: 2, soort: 'dubbel' },
            { plek: 0, reeks: 'zilver', dubbelen: 0, soort: 'hoger' },
          ],
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Je 2 kisten gaan open!' })).toBeInTheDocument();
    expect(screen.getByText('Uil nog een keer: 2 van de 3 voor zilver')).toBeInTheDocument();
    expect(screen.getByText('Kat gaat naar zilver')).toBeInTheDocument();
  });

  /**
   * The drawings are decorative. The sentence beside them says which hero and
   * which reeks in words, and a screen reader that read the chest and the plate
   * as well would say the same thing three times.
   */
  it('leaves the chest and the hero out of the accessibility tree', () => {
    const { container } = render(
      <Beloning
        reward={uitkomst({ kisten: [{ plek: 11, reeks: 'ultra', dubbelen: 0, soort: 'vol' }] })}
      />,
    );

    expect(container.querySelector('.tk-unwrap')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Draak is al ultra')).toBeInTheDocument();
  });
});
