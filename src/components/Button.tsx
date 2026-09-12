import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Three weights, and no fourth.
 *
 * Primary is the way on, and a screen has one. Secondary is a real alternative
 * — "Datum wijzigen" beside "Begin de ronde". Tertiary is a link that needs a
 * hit target, which on a touch screen is most links.
 *
 * No accent variant, deliberately. A module may colour the highlight on the
 * image, the progress bar and the module entrance, and nothing else; an accent
 * button would make the way on a different colour in every module, which is
 * how a child learns to look for a colour rather than for a word.
 *
 * Height comes from --control-height, which is 56 in PO and 44 in VO. It is a
 * token rather than a prop because it follows the guise, and the guise follows
 * the age in the profile — never a choice made at a call site.
 */

type Variant = 'primary' | 'secondary' | 'tertiary';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'tk-button',
  secondary: 'tk-button tk-button-secondary',
  tertiary: 'tk-button tk-button-tertiary',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: Variant;
  /**
   * Waiting on something. The button keeps its size and its label, because a
   * control that changes shape while you wait invites a second click on
   * whatever moved into its place.
   */
  readonly busy?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Button({
  variant = 'primary',
  busy = false,
  disabled = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

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
      <span className="tk-button-label">{children}</span>
    </button>
  );
}
