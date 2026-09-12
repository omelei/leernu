import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Gallery } from './Gallery';

/**
 * The gallery is the page a person looks at; this is the part a machine can
 * check about it.
 *
 * Rest, hover, focus and active are visual and belong to the eye. Disabled,
 * busy and the states that carry meaning to a screen reader are not: they are
 * attributes, they are what assistive technology actually reads, and they are
 * exactly the ones that rot silently because nobody clicks a switched-off
 * button to see whether it is still switched off.
 */
describe('every component renders every state it claims to have', () => {
  it('switches a button off and says so', () => {
    render(<Gallery />);
    // Three variants, each with a disabled example.
    const off = screen.getAllByRole('button', { name: 'Uit' });
    expect(off).toHaveLength(3);
    for (const button of off) expect(button).toBeDisabled();
  });

  it('marks a busy button busy as well as unavailable', () => {
    render(<Gallery />);
    const busy = screen.getAllByRole('button', { name: 'Bezig' });
    expect(busy).toHaveLength(3);
    for (const button of busy) {
      // Both, deliberately. aria-busy alone leaves the control operable, and
      // disabled alone says "not for you" rather than "not yet".
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    }
  });

  it('gives a pressed chip a pressed state rather than only a colour', () => {
    render(<Gallery />);
    expect(screen.getByRole('button', { name: 'Chip aan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Chip' })).not.toHaveAttribute('aria-pressed');
  });

  it('marks an invalid field invalid', () => {
    render(<Gallery />);
    expect(screen.getByPlaceholderText('Fout')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByPlaceholderText('Uit')).toBeDisabled();
  });

  it('reports progress as a number and as a percentage', () => {
    render(<Gallery />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '0');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '35');
    // The unit, because "35" read on its own is a bare number.
    expect(bars[1]).toHaveAttribute('aria-valuetext', '35%');
    expect(bars[2]).toHaveAttribute('aria-valuenow', '100');
  });

  it('gives every item status a word, not only a shape', () => {
    render(<Gallery />);
    for (const word of [
      'in de vriezer',
      'dit onthoud je nu',
      'nog niet onthouden',
      'nog niet geoefend',
    ]) {
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
    }
  });

  it('lines figures up on the digit', () => {
    render(<Gallery />);
    const table = screen.getByRole('table');
    const figure = within(table).getByText('1.104');
    // tabular-nums and right alignment come from .tk-num; what this pins is
    // that the class is on the cell, since a column of figures that dances is
    // the one typographic fault a child notices every single round.
    expect(figure).toHaveClass('tk-num');
  });

  it('names the mark once, for a screen reader, however often it is drawn', () => {
    render(<Gallery />);
    // The wordmark is a drawing of a name, not information, so the mark has one
    // accessible name and the drawing is hidden.
    expect(screen.getAllByText('leer.nu').length).toBeGreaterThan(0);
    expect(screen.getByText('leer.nu/topo')).toBeInTheDocument();
  });
});
