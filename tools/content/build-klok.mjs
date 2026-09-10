import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Klokkijken, as content: the four steps a Dutch classroom teaches it in.
 *
 * Generated for the same reason rekenen is (build-rekenen.mjs): a hundred and
 * forty-four faces written out by hand is a hundred and forty-four chances to
 * put the hands in the wrong place, and no reviewer catches that by reading
 * JSON. What replaces the editor is `klok.content.test.ts`, which works every
 * entry back out.
 *
 * **Where the content stops is a judgement, and it is made here.**
 *
 * Five minutes, not one. Groep 4 and 5 learn whole hours, half hours, quarters
 * and then the five-minute steps, and "23 minuten over zeven" is not on that
 * list — it is on a digital display, which is a different thing to read. Going
 * to the minute would mean seven hundred and twenty faces, of which five
 * hundred and seventy-six would be positions no schoolbook shows and no child
 * has words for. The app design's line for this module is "hele en halve uren";
 * this is that, plus the two steps that follow it, and nothing beyond them.
 *
 * Twelve hours, not twenty-four. The face has twelve numbers on it. What a
 * child may *type* is wider — 19:30 is a true reading of half past seven and
 * `judgeKlok` accepts it — but the thing being shown is a face, and a face does
 * not know whether it is morning.
 *
 * One set per step, because that is the unit a teacher sets and the unit a
 * child finishes: "de hele uren ken ik" is sayable and "de klok ken ik" is not.
 * The mix is not a file — it is the union of the four, composed at run time from
 * the same items, so a face answered in the mix moves the same Leitner box it
 * moves anywhere else (`src/content/loadKlok.ts`).
 */

const KLOK_DIR = join(process.cwd(), 'content', 'klok');

/** A twelve-hour face, so the hours run 1 to 12 and never 0 or 13. */
const UREN = 12;

/**
 * The date the content last changed, not the date the build ran. A version that
 * moves every time the generator runs tells you nothing and invalidates every
 * cache for no reason.
 */
const CONTENT_VERSION = '2026-09-09';

/**
 * The four sets, in the order a child meets them.
 *
 * `stap` is how fine the times in a set are and `minuten` is which positions on
 * the rim belong to it. Every five-minute position belongs to exactly one set,
 * which is what lets the mix be a union without counting a face twice: whole
 * hours take :00, halves take :30, quarters take :15 and :45, and the last set
 * takes the eight that are left.
 *
 * The level decides the order the sets are offered in and nothing else. Whole
 * and half hours are level one because they are one lesson in Dutch schools;
 * quarters are the step after; the five-minute steps are where "tien voor half
 * acht" arrives, which is the sentence that makes this module hard.
 */
const SETS = [
  { id: 'klok-heel', stap: 60, niveau: 1, minuten: [0] },
  { id: 'klok-half', stap: 30, niveau: 1, minuten: [30] },
  { id: 'klok-kwart', stap: 15, niveau: 2, minuten: [15, 45] },
  { id: 'klok-vijf', stap: 5, niveau: 3, minuten: [5, 10, 20, 25, 35, 40, 50, 55] },
];

const header = 'tools/content/build-klok.mjs — gegenereerd, niet met de hand bewerken.';

function write(set) {
  writeFileSync(
    join(KLOK_DIR, `${set.id}.json`),
    `${JSON.stringify({ _gegenereerd: header, ...set }, null, 2)}\n`,
  );
}

/** `klok-07-30`. Zero-padded, so the files read in the order of the face. */
function idVoor(uur, minuut) {
  return `klok-${String(uur).padStart(2, '0')}-${String(minuut).padStart(2, '0')}`;
}

mkdirSync(KLOK_DIR, { recursive: true });

let geschreven = 0;
let tijden = 0;

for (const set of SETS) {
  const items = [];

  // Hour first, then minute: the file reads down the clock rather than round
  // it, which is the order a child would count them out.
  for (let uur = 1; uur <= UREN; uur++) {
    for (const minuut of set.minuten) {
      items.push({ id: idVoor(uur, minuut), uur, minuut });
    }
  }

  write({
    id: set.id,
    stap: set.stap,
    niveau: set.niveau,
    contentVersie: CONTENT_VERSION,
    items,
  });
  geschreven++;
  tijden += items.length;
}

// Every five-minute position on the face, exactly once across the four sets.
// A position in two sets would be counted twice in the module's total and a
// position in none would be a face a child is never shown; both slip through
// silently and both are caught here rather than on a screen.
const alle = SETS.flatMap((set) => set.minuten);
if (new Set(alle).size !== alle.length) {
  throw new Error(`een minuutstand zit in twee sets: ${alle.join(', ')}`);
}
for (let minuut = 0; minuut < 60; minuut += 5) {
  if (!alle.includes(minuut)) throw new Error(`minuutstand :${minuut} zit in geen enkele set`);
}

console.log(`${geschreven} sets, ${tijden} tijden`);
