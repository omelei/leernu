import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { KruisIcon } from '../Icon';

/**
 * paginakop, sectiekop, label, statuslabel, invoerveld, laden en foutmelding
 * (S1, S2, S10, S11): the parts of a page that are words.
 */

/**
 * The page's first heading and its one meta line. A place — Vandaag, the
 * collection, Jij — takes the display size; a page about one thing — a module's
 * chooser, a result — takes the title size (stap 2, S2 and S4).
 */
export function PaginaKop({
  titel,
  meta,
  soort = 'plek',
  id,
}: {
  readonly titel: string;
  readonly meta?: string | undefined;
  readonly soort?: 'plek' | 'ding' | undefined;
  readonly id?: string | undefined;
}) {
  return (
    <header className={soort === 'ding' ? 'ln-paginakop ln-paginakop-ding' : 'ln-paginakop'}>
      <h1 id={id}>{titel}</h1>
      {meta ? <p className="ln-sub">{meta}</p> : null}
    </header>
  );
}

export function SectieKop({
  titel,
  id,
  actie,
}: {
  readonly titel: string;
  readonly id?: string | undefined;
  /** At most one tertiary way on, at the end of the line ("Alles"). */
  readonly actie?: ReactNode;
}) {
  return (
    <div className="ln-sectiekop">
      <h2 id={id}>{titel}</h2>
      {actie}
    </div>
  );
}

export function Label({ children, id }: { readonly children: ReactNode; readonly id?: string }) {
  return (
    <span id={id} className="ln-label">
      {children}
    </span>
  );
}

/** A fact about a row: in ink on the inset, never a control. */
export function Chip({
  children,
  toon = 'rustig',
}: {
  readonly children: ReactNode;
  readonly toon?: 'rustig' | 'sterk' | 'accent' | undefined;
}) {
  const klasse = toon === 'sterk' ? ' ln-chip-sterk' : toon === 'accent' ? ' ln-chip-accent' : '';
  return <span className={`ln-chip${klasse}`}>{children}</span>;
}

/**
 * A field with its label above it, and the error under it in words with a
 * cross — never a red border alone (S1).
 */
export function Veld({
  label,
  fout,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  readonly label: string;
  readonly fout?: string | null | undefined;
}) {
  const id = useId();
  const foutId = `${id}-fout`;

  return (
    <div className="ln-veld-groep">
      <label htmlFor={id} className="ln-label">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        className="ln-veld"
        aria-invalid={fout ? true : undefined}
        aria-describedby={fout ? foutId : undefined}
      />
      {fout ? (
        <p id={foutId} className="ln-veld-fout">
          <KruisIcon size={16} />
          {fout}
        </p>
      ) : null}
    </div>
  );
}

/** Three dots in the shape of what is coming: never a wheel, never filling. */
export function Laden({ label }: { readonly label: string }) {
  return (
    <span className="ln-laden" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </span>
  );
}

/** One shape for every error in the app; only the sentence differs (S2). */
export function Foutmelding({
  titel,
  children,
}: {
  readonly titel: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="ln-foutmelding" role="alert">
      <span className="ln-teken" aria-hidden="true">
        <KruisIcon size={20} />
      </span>
      <div>
        <p className="ln-titel">{titel}</p>
        {children ? <p className="ln-tekst">{children}</p> : null}
      </div>
    </div>
  );
}
