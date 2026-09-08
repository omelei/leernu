import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NoStorage } from './NoStorage';
import { brand } from '@/config/brand';

/**
 * The screen exists to not be blank. That is the whole test: a heading a person
 * can read, a reason, steps, and a control — the four things the empty <div>
 * this replaces had none of.
 */
describe('the no-storage screen', () => {
  it('names the product and says what is wrong', () => {
    render(<NoStorage cause="blocked" onRetry={() => {}} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(brand.name);
    expect(screen.getByText('De browser houdt het bewaren tegen.')).toBeInTheDocument();
  });

  // Two causes, one screen, one different sentence. An open that said no and an
  // open that said nothing are not the same fact, and the person who has to fix
  // it is the one who can tell them apart.
  it('tells an open that refused apart from one that never answered', () => {
    render(<NoStorage cause="silent" onRetry={() => {}} />);

    expect(screen.getByText('Het apparaat geeft geen antwoord.')).toBeInTheDocument();
    expect(screen.queryByText('De browser houdt het bewaren tegen.')).not.toBeInTheDocument();
  });

  // Steps, not one instruction: the cause is different on every device, so the
  // screen offers the four that between them cover the ones we know of.
  it('offers something to do about it', () => {
    const retry = vi.fn();
    render(<NoStorage cause="silent" onRetry={retry} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
