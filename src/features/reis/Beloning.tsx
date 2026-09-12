import { Sterren } from '@/components/Sterren';
import { t } from '@/i18n';
import type { RoundOutcome } from '@/store/rewardStore';
import { Kistkeuze } from './Kistkeuze';

/**
 * What a round earned, on the screen at the end of it (ADR-096, ADR-097).
 *
 * The stars it added and how full the next chest is; and when a chest was
 * earned, the three heroes it lays out for the child to choose between, and
 * then what they chose. The chest opens the way the parcel always has
 * (ADR-084): the wrapping goes and the hero is there, and where a reader has
 * asked for less movement the hero is simply there.
 *
 * Absent when the round earned nothing, which is most short rounds. What it
 * never says is "well done": the product says what happened, not what to feel
 * about it.
 */
export function Beloning({ reward }: { readonly reward: RoundOutcome | null }) {
  if (reward === null) return null;

  const { sterren, kistenTeGoed } = reward;
  if (sterren.erbij === 0 && kistenTeGoed === 0) return null;

  const kop =
    kistenTeGoed === 1
      ? t('result.kistEen')
      : kistenTeGoed > 1
        ? t('result.kistVeel', { aantal: kistenTeGoed })
        : sterren.erbij === 1
          ? t('result.sterEen')
          : t('result.sterVeel', { aantal: sterren.erbij });

  return (
    <section className="tk-card flex flex-col gap-4" aria-label={t('result.beloningTitle')}>
      <h2 className="tk-display text-sectiekop">{kop}</h2>

      {/* The chest reads the row itself rather than being handed what came out
          of it: a chest is now a choice, and a choice cannot be settled before
          the screen it is made on has been drawn. */}
      {kistenTeGoed > 0 ? <Kistkeuze /> : null}

      <Sterren inKist={sterren.inKist} />
    </section>
  );
}
