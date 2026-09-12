import type { RefObject } from 'react';
import { Teken } from '@/components/ds';

/**
 * De terugkoppeling (S6, S7): one card under the canvas, in three lines and in
 * this order — the right answer as its heading, one thing to hold on to, and
 * the way on. No score, no encouragement, no deduction. Its state is a shape
 * and a sign before it is a colour: a tick for right, a cross for wrong. A near
 * miss is wrong and looks wrong; its heading is what tells it apart.
 *
 * Never a dialog: a round is not interrupted by something a child has to
 * dismiss. Focus goes to the button (the screen moves it there), so one key
 * takes the child on.
 */
export function Terugkoppeling({
  toestand,
  kop,
  detail,
  knop,
  onVolgende,
  knopRef,
}: {
  readonly toestand: 'goed' | 'fout';
  readonly kop: string;
  readonly detail?: string | undefined;
  /** The button's words, or null where the round moves on by itself. */
  readonly knop: string | null;
  readonly onVolgende: () => void;
  readonly knopRef: RefObject<HTMLButtonElement>;
}) {
  return (
    <div className="ln-terugkoppeling">
      <div className="ln-terugkoppeling-tekst">
        <Teken toestand={toestand} />
        <div className="min-w-0">
          <p className="ln-titel">{kop}</p>
          {detail ? <p className="ln-tekst">{detail}</p> : null}
        </div>
      </div>
      {knop === null ? null : (
        <button ref={knopRef} type="button" className="ln-knop" onClick={onVolgende}>
          <span className="ln-knop-label">{knop}</span>
        </button>
      )}
    </div>
  );
}
