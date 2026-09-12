import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import type { IconProps } from '../Icon';

/**
 * kaart, plaat, tegel, lijst en rij (S2, S3, S4): the surfaces a page is made
 * of. A card holds data about one thing; a tile is a card that is a choice; a
 * row is one line in a list of things that each lead somewhere.
 */

type Pictogram = ComponentType<Omit<IconProps, 'children'>>;

export function Kaart({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly as?: 'div' | 'section' | 'article' | 'li' | undefined;
  readonly 'aria-labelledby'?: string | undefined;
  readonly 'aria-label'?: string | undefined;
}) {
  return (
    <Tag {...rest} className={['ln-kaart', className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}

/**
 * A module's identity plate: its pictogram in ink on its own tint, the one
 * place the seven tints appear. `module` names the tint; without it the plate
 * is the inset, which is what an unchosen tile carries.
 */
export function Plaat({
  Icoon,
  module,
  klein = false,
  leeg = false,
}: {
  readonly Icoon?: Pictogram | undefined;
  readonly module?: string | undefined;
  readonly klein?: boolean | undefined;
  readonly leeg?: boolean | undefined;
}) {
  const klassen = ['ln-plaat', klein ? 'ln-plaat-klein' : null, leeg ? 'ln-plaat-leeg' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={klassen} data-module={module} aria-hidden="true">
      {Icoon ? <Icoon size={18} /> : null}
    </span>
  );
}

/**
 * A tile (S4). Chosen, it wears the accent's double rule and tint and a
 * diamond stands in its plate — no tick, one idiom of choosing for the whole
 * product.
 */
export function Tegel({
  titel,
  sub,
  gekozen,
  Icoon,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
  readonly titel: string;
  readonly sub?: string | undefined;
  readonly gekozen: boolean;
  readonly Icoon?: Pictogram | undefined;
}) {
  const inDePlaat = gekozen ? (
    <span className="ln-tegel-ruit" />
  ) : Icoon ? (
    <Icoon size={18} />
  ) : null;

  return (
    <button type="button" {...rest} className="ln-tegel" aria-pressed={gekozen}>
      <span className="ln-plaat" aria-hidden="true">
        {inDePlaat}
      </span>
      <span className="ln-titel">{titel}</span>
      {sub ? <span className="ln-sub">{sub}</span> : null}
    </button>
  );
}

export function Lijst({
  children,
  'aria-label': label,
}: {
  readonly children: ReactNode;
  readonly 'aria-label'?: string | undefined;
}) {
  return (
    <ul className="ln-lijst" aria-label={label}>
      {children}
    </ul>
  );
}

/**
 * One row of 72: a plate, a title with one line under it, and a figure or a
 * label at the end. A button when it leads somewhere, a plain line otherwise.
 */
export function Rij({
  titel,
  sub,
  plaat,
  einde,
  onClick,
  huidig = false,
  gedimd = false,
}: {
  readonly titel: string;
  readonly sub?: string | undefined;
  readonly plaat?: ReactNode;
  readonly einde?: ReactNode;
  readonly onClick?: (() => void) | undefined;
  readonly huidig?: boolean | undefined;
  readonly gedimd?: boolean | undefined;
}) {
  const inhoud = (
    <>
      {plaat}
      <span className="ln-rij-tekst">
        <span className="ln-titel">{titel}</span>
        {sub ? <span className="ln-sub">{sub}</span> : null}
      </span>
      {einde}
    </>
  );
  const klassen = ['ln-rij', gedimd ? 'ln-rij-dim' : null].filter(Boolean).join(' ');

  return (
    <li>
      {onClick ? (
        <button
          type="button"
          className={klassen}
          aria-current={huidig ? 'page' : undefined}
          onClick={onClick}
        >
          {inhoud}
        </button>
      ) : (
        <div className={klassen}>{inhoud}</div>
      )}
    </li>
  );
}
