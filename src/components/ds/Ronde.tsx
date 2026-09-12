import { t } from '@/i18n';
import { ruitStanden, tellerTekst } from './meten';

/**
 * The two instruments of a round (S5): the diamonds that count its questions
 * and the counter beside them. Neither says anything about how well it is
 * going — that is the dot's, and the dot is not in a round.
 */

/** De ruiten: one per question, filled once it has been answered. */
export function Ruiten({
  beantwoord,
  totaal,
}: {
  readonly beantwoord: number;
  readonly totaal: number;
}) {
  const standen = ruitStanden(beantwoord, totaal);
  const gedaan = standen.filter((stand) => stand === 'gedaan').length;

  return (
    <ol
      className="ln-ruiten"
      role="img"
      aria-label={t('ds.ruiten', { gedaan, totaal: standen.length })}
    >
      {standen.map((stand, index) => (
        <li key={index} className="ln-ruit" data-stand={stand} />
      ))}
    </ol>
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
