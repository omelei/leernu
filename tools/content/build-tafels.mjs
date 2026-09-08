import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The multiplication tables, as content.
 *
 * Generated rather than written by hand, and that is the opposite of the rule
 * the geography sets follow. The reason is that these need no editor. A
 * province's name, its aliases and its weetje are judgements someone has to
 * make and defend; 7 × 8 = 56 is not a judgement, and a file of a hundred and
 * twenty of them written out by hand is a hundred and twenty chances to make a
 * typo that no reviewer would catch by reading.
 *
 * What replaces the editor is `sums.test.ts`, which multiplies every entry back
 * out. That is a stronger guarantee than a careful read, and it is the only
 * place in the content pipeline where that trade is available.
 *
 * **One to twelve.** The app design says so in as many words — "Tafels en klok ·
 * Van 1 tot 12, hele en halve uren" — so twelve tables, not the ten that groep
 * 5 gets first. Each runs to ten, which is where a table ends in Dutch primary
 * school; eleven and twelve as multipliers are a different exercise.
 *
 * One set per table, because that is the unit a child is asked to learn and the
 * unit a teacher sets. A single set of a hundred and twenty would make "de
 * tafel van 7 ken ik" unsayable, and that sentence is the whole point.
 */

const OUT_DIR = join(process.cwd(), 'content', 'tafels');

/** Tables one through twelve, from the design. */
const TABLES = 12;
/** Each table runs to ten. */
const UPTO = 10;

/**
 * The date the content last changed, not the date the build ran. A version that
 * moves every time the generator runs tells you nothing and invalidates every
 * cache for no reason.
 */
const CONTENT_VERSION = '2026-09-08';

/**
 * Which tables a child is expected to meet first.
 *
 * Not difficulty for its own sake — it decides the order the sets are offered
 * in and nothing else. One, two, five and ten have a rule you can say out loud;
 * three, four, six and eight have a doubling you can lean on; seven, nine,
 * eleven and twelve are the ones that get learned last, and nine only looks
 * hard until somebody shows you the trick.
 */
const NIVEAU = { 1: 1, 2: 1, 5: 1, 10: 1, 3: 2, 4: 2, 6: 2, 8: 2, 7: 3, 9: 3, 11: 3, 12: 3 };

mkdirSync(OUT_DIR, { recursive: true });

for (let table = 1; table <= TABLES; table++) {
  const items = [];

  for (let by = 1; by <= UPTO; by++) {
    items.push({
      id: `tafel-${table}x${by}`,
      table,
      by,
      antwoord: table * by,
    });
  }

  const set = {
    _gegenereerd: 'tools/content/build-tafels.mjs — gegenereerd, niet met de hand bewerken.',
    id: `tafel-${table}`,
    tafel: table,
    niveau: NIVEAU[table],
    contentVersie: CONTENT_VERSION,
    items,
  };

  writeFileSync(join(OUT_DIR, `tafel-${table}.json`), `${JSON.stringify(set, null, 2)}\n`);
}

console.log(`${TABLES} tafels, elk tot ${UPTO}: ${TABLES * UPTO} sommen`);
