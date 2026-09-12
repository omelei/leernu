import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * knop-primair, knop-secundair, knop-tertiair (stap 2, S1 and S2).
 *
 * Primary is the way on: one per screen, always the largest, always the
 * shortest way to practising. Secondary is a real alternative beside it.
 * Tertiary is a link that needs a hit target. The fourth case the contract
 * gained — the answer set of S8 — is `AntwoordKnop` in the component set,
 * because four equal answers are not a primary and three alternatives.
 *
 * No accent variant: the accent means right, chosen and progress, and a
 * button in it would be a fourth meaning. Height is --control-height, 56 in
 * the PO guise and 44 in VO; a token, because it follows the guise.
 */

type Variant = 'primary' | 'secondary' | 'tertiary';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'ln-knop',
  secondary: 'ln-knop ln-knop-secundair',
  tertiary: 'ln-knop ln-knop-tertiair',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: Variant;
  /**
   * Waiting on something. The button keeps its size, because a control that
   * changes shape while you wait invites a second click on whatever moved
   * into its place.
   */
  readonly busy?: boolean;
  /** The whole width: the start bar on a phone. */
  readonly full?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Button({
  variant = 'primary',
  busy = false,
  full = false,
  disabled = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [VARIANT_CLASS[variant], full ? 'ln-knop-vol' : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      // Busy is a kind of unavailable, and saying so twice is how a screen
      // reader user learns it is not simply switched off.
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      <span className="ln-knop-label">{children}</span>
    </button>
  );
}
