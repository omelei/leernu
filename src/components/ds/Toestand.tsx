import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { t } from '@/i18n';
import { KruisIcon, VinkjeIcon } from '../Icon';

/**
 * The three states of an answer (README, "De vier vormregels"), as the
 * classes and signs every surface that shows one uses.
 *
 *   goed    closed fill and a tick
 *   fout    hatched fill and a cross
 *   gemist  the right answer the child did not give: open, a double rule and
 *           a dot
 *
 * "Bijna" is not a fourth state: the README has three. A near miss is wrong,
 * and it looks wrong; the word "Bijna" is what tells it apart, in the copy.
 */
export type Toestand = 'goed' | 'fout' | 'gemist';

export const VORM_KLASSE: Record<Toestand, string> = {
  goed: 'ln-vorm-goed',
  fout: 'ln-vorm-fout',
  gemist: 'ln-vorm-gemist',
};

/** The sign of a state, decorative: the word beside it says the same. */
export function Teken({
  toestand,
  maat = 24,
}: {
  readonly toestand: Toestand;
  readonly maat?: number | undefined;
}) {
  return (
    <span className={`ln-teken ln-teken-${toestand}`} aria-hidden="true">
      {toestand === 'goed' ? <VinkjeIcon size={maat} /> : null}
      {toestand === 'fout' ? <KruisIcon size={maat} /> : null}
      {toestand === 'gemist' ? <span /> : null}
    </span>
  );
}

const WOORD: Record<Toestand, 'ds.goed' | 'ds.fout' | 'ds.gemist'> = {
  goed: 'ds.goed',
  fout: 'ds.fout',
  gemist: 'ds.gemist',
};

/**
 * One answer of an answer set (S8): an equal secondary button, and once the
 * question is settled, its state — shape, sign, and the state's word for a
 * screen reader, which cannot see the hatch.
 */
export function AntwoordKnop({
  toestand,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  readonly toestand?: Toestand | null | undefined;
  readonly children: ReactNode;
}) {
  const klassen = ['ln-antwoord', toestand ? VORM_KLASSE[toestand] : null]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" {...rest} className={klassen}>
      <span>{children}</span>
      {toestand ? (
        <>
          <span className="ln-sr-only">{t(WOORD[toestand])}</span>
          <Teken toestand={toestand} />
        </>
      ) : null}
    </button>
  );
}
