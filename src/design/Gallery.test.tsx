import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Gallery } from './Gallery';

/**
 * The gallery is the page a person looks at; this is the part a machine can
 * check about it. Rest, hover and focus are visual and belong to the eye.
 * Disabled, busy, pressed, checked and invalid are attributes — what assistive
 * technology actually reads — and they are exactly the ones that rot silently.
 */
describe('every component renders every state it claims to have', () => {
  it('switches a button off and says so', () => {
    render(<Gallery />);
    const off = screen.getAllByRole('button', { name: 'Uit' });
    expect(off).toHaveLength(3);
    for (const button of off) expect(button).toBeDisabled();
  });

  it('marks a busy button busy as well as unavailable', () => {
    render(<Gallery />);
    const busy = screen.getAllByRole('button', { name: 'Bezig' });
    expect(busy).toHaveLength(3);
    for (const button of busy) {
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    }
  });

  it('gives a chosen tile a pressed state rather than only a colour', () => {
    render(<Gallery />);
    expect(screen.getByRole('button', { name: /^Provincies Gekozen/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Hoofdsteden/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('marks an invalid field invalid and says why in words', () => {
    render(<Gallery />);
    const fout = screen.getByPlaceholderText('Fout');
    expect(fout).toHaveAttribute('aria-invalid', 'true');
    expect(fout).toHaveAccessibleDescription('Vul minstens twee letters in.');
    expect(screen.getByPlaceholderText('Uit')).toBeDisabled();
  });

  it('reports progress as a number and as a percentage', () => {
    render(<Gallery />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
    expect(bars[1]).toHaveAttribute('aria-valuenow', '35');
    expect(bars[1]).toHaveAttribute('aria-valuetext', '35%');
  });

  it('says what a dot shows, and draws no dot where there is no value', () => {
    render(<Gallery />);
    expect(screen.getAllByRole('img', { name: '62% onthouden' })).toHaveLength(7);
    expect(screen.getByRole('img', { name: '75% onthouden' })).toBeInTheDocument();
    // Five fills of 40, seven sizes of 62 — and nothing for the one with none.
    expect(screen.getAllByRole('img', { name: /% onthouden$/ })).toHaveLength(12);
  });

  it('counts a round in words as well as diamonds', () => {
    render(<Gallery />);
    expect(screen.getAllByRole('img', { name: '6 van de 12 vragen gedaan' })).toHaveLength(2);
    expect(screen.getAllByText('Vraag 7 van 12')).toHaveLength(2);
  });

  it('tells each answer state in words, not only in shape', () => {
    render(<Gallery />);
    expect(screen.getAllByRole('button', { name: /Fryslân Goed/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Drenthe Fout/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Overijssel Het goede antwoord/ })).toHaveLength(
      2,
    );
  });

  it('switches with its state in the role, not only in the drawing', () => {
    render(<Gallery />);
    const schakelaar = screen.getByRole('switch', { name: /Vragen voorlezen/ });
    expect(schakelaar).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(schakelaar);
    expect(schakelaar).toHaveAttribute('aria-checked', 'false');
  });

  it('opens the one dialog with focus inside it, and Escape keeps the round', () => {
    render(<Gallery />);
    fireEvent.click(screen.getByRole('button', { name: 'Open de dialoog' }));
    const dialoog = screen.getByRole('dialog', { name: 'Ronde afbreken?' });
    expect(dialoog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Afbreken' })).toHaveFocus();
    fireEvent.keyDown(dialoog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the logo once, however it is drawn', () => {
    render(<Gallery />);
    // Two lockups, each one image with the brand as its name; the mark alone
    // is decorative.
    expect(screen.getAllByRole('img', { name: 'leer.nu' })).toHaveLength(2);
  });
});
