import { t } from '@/i18n';
import { ruitStanden, tellerTekst } from './meten';

/**
 * The two instruments of a round (S5): the diamonds that count its questions
 * and the counter beside them. Neither says anything about how well it is
 * going — that is the dot's, and the dot is not in a round.
 */

/**
 * De ruiten: one per question, filled once it has been answered. A picture
 * with its count as its name — or, where something around it already says the
 * count (a progress bar), only a picture.
 */
export function Ruiten({
  beantwoord,
  totaal,
  decoratief = false,
}: {
  readonly beantwoord: number;
  readonly totaal: number;
  readonly decoratief?: boolean | undefined;
}) {
  const standen = ruitStanden(beantwoord, totaal);
  const gedaan = standen.filter((stand) => stand === 'gedaan').length;
  const benoemd = decoratief
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': t('ds.ruiten', { gedaan, totaal: standen.length }) };

  return (
    <span className="ln-ruiten" {...benoemd}>
      {standen.map((stand, index) => (
        <span key={index} className="ln-ruit" data-stand={stand} />
      ))}
    </span>
  );
}

/** De teller: "07 / 12", said out loud as "Vraag 7 van 12". */
export function Teller({ huidig, totaal }: { readonly huidig: number; readonly totaal: number }) {
  return (
    <span className="ln-teller">
      <span aria-hidden="true">{tellerTekst(huidig, totaal)}</span>
      <span className="ln-sr-only">{t('ds.teller', { huidig, totaal })}</span>
    </span>
  );
}
