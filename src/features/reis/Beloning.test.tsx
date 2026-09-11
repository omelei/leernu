import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uitLadder, type HeldenStand, type KistUitkomst } from '@/game-core';
import { kiesHeld, kistenOpenstaand, loadHelden } from '@/store/heldenStore';
import type { RoundOutcome } from '@/store/rewardStore';
import { Beloning } from './Beloning';

/**
 * What a round earned, on the screen at the end of it (ADR-096, ADR-097).
 *
 * Checked here rather than through the browser because getting there for real
 * costs fifty correct answers, and a Playwright test that plays five rounds to
 * assert one card makes every run slower for everybody. What a chest may offer
 * and what choosing one does is arithmetic, tested in game-core; what is here
 * is that the three are laid out, that pressing one spends exactly one chest,
 * and that the sentence afterwards says which chest handed it over.
 */

vi.mock('@/store/heldenStore', () => ({
  loadHelden: vi.fn(),
  kistenOpenstaand: vi.fn(),
  kiesHeld: vi.fn(),
}));

function uitkomst(deel: Partial<RoundOutcome>): RoundOutcome {
  return {
    xp: 0,
    coins: 0,
    totalXp: 0,
    stamps: [],
    diploma: null,
    sterren: { erbij: 0, inKist: 0 },
    kistenTeGoed: 0,
    ...deel,
  };
}

/** A child who has only ever had the three the ladder started with. */
const begin: HeldenStand = uitLadder(0);

function stel(open: number, stand: HeldenStand = begin): void {
  vi.mocked(loadHelden).mockResolvedValue(stand);
  vi.mocked(kistenOpenstaand).mockResolvedValue(open);
}

beforeEach(() => {
  vi.clearAllMocks();
  stel(0);
});

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
});

describe('a chest on the result screen', () => {
  it('lays out three heroes the child does not have, and says what each would do', async () => {
    stel(1);
    render(<Beloning reward={uitkomst({ sterren: { erbij: 1, inKist: 0 }, kistenTeGoed: 1 })} />);

    expect(screen.getByRole('heading', { name: 'Je kist gaat open.' })).toBeInTheDocument();

    // The three the fixed order offers a child holding the first three.
    expect(
      await screen.findByRole('button', { name: 'Willem Wolf erbij, in brons' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Fem Flamingo erbij, in brons' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ben Buizerd erbij, in brons' })).toBeInTheDocument();

    // And none of them is a hero this child already has.
    expect(screen.queryByRole('button', { name: /Valerie Vos/ })).not.toBeInTheDocument();
  });

  it('names the hero the child chose, its reeks, and which chest handed it over', async () => {
    stel(1);
    const gekozen: KistUitkomst = {
      plek: 11,
      reeks: 'brons',
      dubbelen: 0,
      soort: 'nieuw',
      kist: 7,
    };
    vi.mocked(kiesHeld).mockResolvedValue(gekozen);
    vi.mocked(kistenOpenstaand).mockResolvedValueOnce(1).mockResolvedValue(0);

    render(<Beloning reward={uitkomst({ kistenTeGoed: 1 })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ben Buizerd erbij, in brons' }));

    expect(
      await screen.findByText('Ben Buizerd komt erbij, in brons. Uit kist 7.'),
    ).toBeInTheDocument();
    expect(vi.mocked(kiesHeld)).toHaveBeenCalledWith(11);
  });

  /**
   * The drawings are decorative. The sentence beside them says which hero and
   * which reeks in words, and a screen reader that read the chest and the plate
   * as well would say the same thing three times.
   */
  it('leaves the chest and the hero out of the accessibility tree', async () => {
    stel(1);
    vi.mocked(kiesHeld).mockResolvedValue({
      plek: 4,
      reeks: 'brons',
      dubbelen: 0,
      soort: 'nieuw',
      kist: 1,
    });
    vi.mocked(kistenOpenstaand).mockResolvedValueOnce(1).mockResolvedValue(0);

    const { container } = render(<Beloning reward={uitkomst({ kistenTeGoed: 1 })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Willem Wolf erbij, in brons' }));

    expect(
      await screen.findByText('Willem Wolf komt erbij, in brons. Uit kist 1.'),
    ).toBeInTheDocument();
    expect(container.querySelector('.tk-unwrap')).toHaveAttribute('aria-hidden', 'true');
  });
});
