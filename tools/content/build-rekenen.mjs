import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Rekenen, as content: the twelve tables, the division facts that mirror them,
 * and plus and minus in three ranges.
 *
 * Generated rather than written by hand, and that is the opposite of the rule
 * the geography sets follow. The reason is that these need no editor for the
 * *arithmetic*. A province's name, its aliases and its weetje are judgements
 * someone has to make and defend; 7 × 8 = 56 is not a judgement, and a file of
 * a hundred and twenty of them written out by hand is a hundred and twenty
 * chances to make a typo that no reviewer would catch by reading.
 *
 * What replaces the editor is `sums.content.test.ts`, which works every entry
 * back out. That is a stronger guarantee than a careful read, and it is the
 * only place in the content pipeline where that trade is available.
 *
 * **Which sums to practise is still a judgement**, and this file makes it in
 * the open. A table is every sum in it, because that is what a table is. Plus
 * and minus have no such natural edge — "alle sommen tot 100" is nine thousand
 * of them — so the ranges below are curated lists with the rule that chose them
 * written above each one. That is the part a teacher could disagree with, and
 * it should be readable rather than buried in a loop.
 *
 * **One to twelve.** The app design says so in as many words — "Tafels en klok ·
 * Van 1 tot 12, hele en halve uren" — so twelve tables, not the ten that groep
 * 5 gets first. Each runs to ten, which is where a table ends in Dutch primary
 * school; eleven and twelve as multipliers are a different exercise.
 *
 * One set per table, because that is the unit a child is asked to learn and the
 * unit a teacher sets. A single set of a hundred and twenty would make "de
 * tafel van 7 ken ik" unsayable, and that sentence is the whole point. The
 * mixes — all tables at once, everything at once — are not files: they are the
 * union of these sets, composed at run time from the same items, so that
 * answering 7 × 8 in a mix moves the same Leitner box as answering it in the
 * table (`src/content/loadSums.ts`).
 */

const TAFEL_DIR = join(process.cwd(), 'content', 'tafels');
const SOM_DIR = join(process.cwd(), 'content', 'sommen');

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

const header = 'tools/content/build-rekenen.mjs — gegenereerd, niet met de hand bewerken.';

function write(dir, set) {
  writeFileSync(
    join(dir, `${set.id}.json`),
    `${JSON.stringify({ _gegenereerd: header, ...set }, null, 2)}\n`,
  );
}

mkdirSync(TAFEL_DIR, { recursive: true });
mkdirSync(SOM_DIR, { recursive: true });

let geschreven = 0;
let sommen = 0;

// ---------------------------------------------------------------------------
// De tafels. Elke tafel tot tien, elk item met het id dat het altijd had:
// `tafel-7x8` staat in de Leitner-doos van elk kind dat ooit geoefend heeft.

for (let tafel = 1; tafel <= TABLES; tafel++) {
  const items = [];

  for (let by = 1; by <= UPTO; by++) {
    items.push({
      id: `tafel-${tafel}x${by}`,
      op: 'keer',
      links: tafel,
      rechts: by,
      antwoord: tafel * by,
    });
  }

  write(TAFEL_DIR, {
    id: `tafel-${tafel}`,
    op: 'keer',
    tafel,
    niveau: NIVEAU[tafel],
    contentVersie: CONTENT_VERSION,
    items,
  });
  geschreven++;
  sommen += items.length;
}

// ---------------------------------------------------------------------------
// De deelsommen, één set per tafel en elk de omkering van een keersom die er al
// staat: 56 : 7 = 8 hoort bij de tafel van 7. Dat is waarom ze per tafel gaan
// en niet per deeltal — een kind dat de tafel van 7 kent, kan deze tien maken,
// en een kind dat ze niet kan, weet meteen welke tafel het nog moet oefenen.

for (let tafel = 1; tafel <= TABLES; tafel++) {
  const items = [];

  for (let uitkomst = 1; uitkomst <= UPTO; uitkomst++) {
    const deeltal = tafel * uitkomst;
    items.push({
      id: `deel-${deeltal}-${tafel}`,
      op: 'delen',
      links: deeltal,
      rechts: tafel,
      antwoord: uitkomst,
    });
  }

  write(SOM_DIR, {
    id: `deel-${tafel}`,
    op: 'delen',
    tafel,
    niveau: NIVEAU[tafel],
    contentVersie: CONTENT_VERSION,
    items,
  });
  geschreven++;
  sommen += items.length;
}

// ---------------------------------------------------------------------------
// Plus en min, in drie bereiken.
//
// Hier houdt het rekenen op en begint de keuze. "Alle plussommen tot 100" zijn
// er negenduizend; welke veertig een kind oefent, is een oordeel. De regel
// staat boven elke lijst en de lijst staat er voluit, zodat een leerkracht het
// oneens kan zijn met iets wat te lezen valt.

/** Elke combinatie van twee getallen onder de tien, één keer. Dit zijn de
 *  optelsommen waar alle andere op leunen — 45 stuks, precies de helft van de
 *  tafel van tien in de andere richting. */
function plusTotTwintig() {
  const items = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      items.push({ id: `plus-${a}+${b}`, op: 'plus', links: a, rechts: b, antwoord: a + b });
    }
  }
  return items;
}

/** De aftreksommen die over het tiental heen gaan, en alleen die: 15 − 8 is de
 *  som waar het misgaat, 18 − 3 is er een die een kind al kan. Deeltal van tien
 *  tot achttien, aftrekker en uitkomst allebei onder de tien. */
function minTotTwintig() {
  const items = [];
  for (let deeltal = 10; deeltal <= 18; deeltal++) {
    for (let af = 1; af <= 9; af++) {
      const uit = deeltal - af;
      if (uit < 1 || uit > 9) continue;
      items.push({
        id: `min-${deeltal}-${af}`,
        op: 'min',
        links: deeltal,
        rechts: af,
        antwoord: uit,
      });
    }
  }
  return items;
}

/**
 * Vijftien beginzetallen, verspreid over de tientallen, elk met drie
 * getallen erbij of eraf. De erbij-getallen gaan over een tiental heen (6, 9)
 * of zijn zelf tweecijferig (14), want dat zijn de twee dingen die een kind
 * hier leert. Precies vijfenveertig, net als de sommen tot twintig.
 */
const HONDERD_PLUS = [12, 17, 23, 28, 34, 39, 45, 48, 53, 57, 62, 68, 71, 76, 85];
const HONDERD_MIN = [23, 31, 36, 42, 44, 54, 58, 65, 67, 73, 76, 81, 84, 92, 95];
const DUIZEND_PLUS = [120, 175, 234, 308, 346, 425, 487, 512, 563, 608, 647, 725, 764, 806, 845];
const DUIZEND_MIN = [230, 315, 367, 428, 441, 546, 589, 652, 673, 738, 768, 812, 845, 924, 956];

function plusSommen(basis, erbij, naam) {
  const items = [];
  for (const a of basis) {
    for (const b of erbij) {
      items.push({ id: `${naam}-${a}+${b}`, op: 'plus', links: a, rechts: b, antwoord: a + b });
    }
  }
  return items;
}

function minSommen(basis, eraf, naam) {
  const items = [];
  for (const a of basis) {
    for (const b of eraf) {
      items.push({ id: `${naam}-${a}-${b}`, op: 'min', links: a, rechts: b, antwoord: a - b });
    }
  }
  return items;
}

const PLUS_MIN = [
  { id: 'plus-20', op: 'plus', niveau: 1, items: plusTotTwintig() },
  { id: 'min-20', op: 'min', niveau: 1, items: minTotTwintig() },
  { id: 'plus-100', op: 'plus', niveau: 2, items: plusSommen(HONDERD_PLUS, [6, 9, 14], 'plus100') },
  { id: 'min-100', op: 'min', niveau: 2, items: minSommen(HONDERD_MIN, [7, 9, 14], 'min100') },
  {
    id: 'plus-1000',
    op: 'plus',
    niveau: 3,
    items: plusSommen(DUIZEND_PLUS, [60, 95, 140], 'plus1000'),
  },
  {
    id: 'min-1000',
    op: 'min',
    niveau: 3,
    items: minSommen(DUIZEND_MIN, [70, 95, 140], 'min1000'),
  },
];

for (const set of PLUS_MIN) {
  write(SOM_DIR, {
    id: set.id,
    op: set.op,
    tafel: null,
    niveau: set.niveau,
    contentVersie: CONTENT_VERSION,
    items: set.items,
  });
  geschreven++;
  sommen += set.items.length;
}

// Een uitkomst onder de één of boven het bereik zou hier stil doorheen glippen
// en pas op een scherm van een kind opvallen. De test controleert het ook, maar
// de generator hoort geen bestand te schrijven waarvan hij weet dat het fout is.
for (const set of PLUS_MIN) {
  const grens = Number(set.id.split('-')[1]);
  for (const som of set.items) {
    if (som.antwoord < 1 || som.antwoord > grens) {
      throw new Error(`${set.id}: ${som.links} ${som.op} ${som.rechts} = ${som.antwoord}`);
    }
  }
}

console.log(`${geschreven} sets, ${sommen} sommen`);
