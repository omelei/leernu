import { klokHoeken, type KlokItem } from '@/game-core';

/**
 * The clock, drawn.
 *
 * What the map is on the topography round and what the sum is on rekenen's: the
 * thing being asked about, given the whole stage. It is not an icon and does not
 * follow §E — §E draws marks at 24px on a 2px stroke, and this is a piece of
 * apparatus a child reads a hand position off from across a kitchen table.
 *
 * Three decisions worth writing down.
 *
 * **The little hand moves.** At half past seven it sits exactly between the 7
 * and the 8, because that is where it sits on a real clock — and because a child
 * who learns to look for "just past the 7" is learning the thing that makes half
 * past seven "half acht". A drawing that parked it on the 7 would be teaching a
 * clock that does not exist. `klokHoeken` is where that is worked out.
 *
 * **The numbers stay on wherever the face is the question.** A face without
 * numerals is what a child graduates to, not what they learn on — and on the
 * mode that asks which of four clocks says half past seven, they are the whole
 * of how a child finds the seven. They come off in one place only: the
 * thumbnail beside a time on the result screen, where a numeral would be four
 * pixels tall and the words beside it have already said what it is.
 *
 * **It is ink, not the module accent.** A module colours three things (ADR-039)
 * and this is not one of them — the same call `.tk-sum` makes, for the same
 * reason: the thing a child has to read is ink, like everything else they read.
 */
export function KlokFace({
  item,
  cijfers = true,
  label,
}: {
  readonly item: KlokItem;
  /** The twelve numerals. Off on the small faces, where they would be a smudge. */
  readonly cijfers?: boolean;
  /**
   * What a screen reader should say. Left out, the face is decorative — which
   * is right wherever the words beside it already say the time.
   */
  readonly label?: string;
}) {
  const hoek = klokHoeken(item);

  return (
    <svg
      viewBox="0 0 100 100"
      className="tk-klok"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}

      <circle className="tk-klok-rand" cx="50" cy="50" r="46" />

      {/* Twelve marks, and they are the reason the numerals can come off: the
          hand points at a mark whether or not there is a figure beside it. */}
      {HOEKEN.map((graden) => (
        <line
          key={graden}
          className="tk-klok-streep"
          x1="50"
          y1="8"
          x2="50"
          y2="14"
          transform={`rotate(${graden} 50 50)`}
        />
      ))}

      {cijfers
        ? HOEKEN.map((graden, index) => {
            const punt = opDeRing(graden, 33);

            return (
              <text
                key={graden}
                className="tk-klok-cijfer"
                x={punt.x}
                y={punt.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {index === 0 ? 12 : index}
              </text>
            );
          })
        : null}

      {/* The short one first, so the long one lies over it where they meet. */}
      <line
        className="tk-klok-uurwijzer"
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        transform={`rotate(${hoek.uur} 50 50)`}
      />
      <line
        className="tk-klok-minuutwijzer"
        x1="50"
        y1="50"
        x2="50"
        y2="14"
        transform={`rotate(${hoek.minuut} 50 50)`}
      />
      <circle className="tk-klok-as" cx="50" cy="50" r="3" />
    </svg>
  );
}

/** Twelve o'clock first, then round. The index is the numeral. */
const HOEKEN = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/** Where a numeral sits, `straal` from the middle of a 100 x 100 face. */
function opDeRing(graden: number, straal: number): { readonly x: number; readonly y: number } {
  const radialen = ((graden - 90) * Math.PI) / 180;
  return { x: 50 + straal * Math.cos(radialen), y: 50 + straal * Math.sin(radialen) };
}
