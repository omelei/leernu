import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The flags: 196 countries and the twelve provinces, and one file the app reads.
 *
 * **Which countries.** The ones the Netherlands recognises, with one deliberate
 * exception, written down here and in `content/vlaggen/AFBAKENING.md` so nobody
 * reverses it by accident: the 193 member states of the United Nations, Kosovo
 * (recognised by the Netherlands since 2008), Vaticaanstad (recognised, not a
 * member) and Taiwan (not recognised — the one-China policy — and here as
 * something children learn rather than as a position). Palestina is not here:
 * the Netherlands does not recognise it as a state. No dependencies and no
 * overseas territories.
 *
 * **Which pictures.** `fonttools/region-flags`, pinned to one commit: every
 * national flag from Wikimedia Commons, checked by that project to be in the
 * public domain or exempt from copyright under the law of its own country. The
 * province flags come from Commons directly, each of them marked public domain
 * there. The files are copied unchanged, except that a file without a `viewBox`
 * gets one — without it an `<img>` cannot scale the picture.
 *
 * **Which names and which werelddeel.** The ones topography already uses, so a
 * child never meets two spellings of Kirgizië: the name is read from
 * `content/sets/*-landen.json`, and the werelddeel is whichever of those sets
 * the country is in — Cyprus is in two, as it is on the map. Eight member states
 * are on no topography map, because Natural Earth files three of them under no
 * continent and the other five are too small for its 1:50m map. They take the
 * source's own `NAME_NL`, and its `REGION_UN` for the werelddeel.
 *
 * **What is ours.** Which flags count as well known, the sentence that
 * describes each one to a screen reader, the one fact a child is told about it,
 * and the capital — in `content/vlaggen/redactie.json`. Capitals follow the
 * United Nations (UNdata country profiles), not our preference. Which flags look
 * alike is in `content/vlaggen/groepen.json`, each group with its reason.
 *
 * Output: `public/vlaggen/*.svg` and `content/vlaggen/vlaggen.json`. Both are
 * generated: a hand correction there is lost at the next run.
 */

const ROOT = process.cwd();
const BRON = join(ROOT, 'content', 'vlaggen', '_source');
const UIT_BEELDEN = join(ROOT, 'public', 'vlaggen');
const UIT_DATA = join(ROOT, 'content', 'vlaggen', 'vlaggen.json');
/** One file per werelddeel and one for the provinces, so an edit is a small diff. */
const REDACTIE = join(ROOT, 'content', 'vlaggen', 'redactie');
const GROEPEN = join(ROOT, 'content', 'vlaggen', 'groepen.json');
const NE_BRON = join(ROOT, 'content', 'geo', '_source', 'ne-landen-50m.json');
const SETS = join(ROOT, 'content', 'sets');

const CONTENT_VERSIE = '2026-09-12';

/** The one commit every national flag comes from. Changing it is a content change. */
const REGION_FLAGS = {
  repo: 'fonttools/region-flags',
  commit: 'c7f54514b5094f124e53c5e58c776c857f757a04',
};

/** Wikimedia asks every automated client to say who it is. */
const USER_AGENT = 'leer.nu content build (https://github.com/omelei/topografie)';

/** The 193 member states of the United Nations, by ISO 3166-1 alpha-2. */
const VN_LEDEN = (
  'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH ' +
  'CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI ' +
  'FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP ' +
  'KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM ' +
  'NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST ' +
  'SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV ' +
  'UG UA AE GB US UY UZ VU VE VN YE ZM ZW'
).split(' ');

/** The three that are not members, and why each is here. See AFBAKENING.md. */
const ERBIJ = {
  XK: 'Door Nederland erkend sinds 2008.',
  VA: 'Door Nederland erkend; geen lid van de VN.',
  TW: 'Bewuste uitzondering: niet erkend (één-China-beleid), wel een eigen vlag.',
};

const LANDEN = [...VN_LEDEN, ...Object.keys(ERBIJ)];

/**
 * Where region-flags notes that a flag is exempt under that country's own law
 * rather than tagged public domain on Commons (its `COPYING`). Recorded per
 * flag, because "public domain" would be the wrong word for these.
 */
const NATIONAAL_VRIJGESTELD = new Set(['AM', 'AZ', 'KG', 'KZ', 'MD', 'MX', 'MY', 'RS']);

/**
 * Flags that changed after region-flags last touched them, taken from Commons
 * instead — each marked public domain there, checked on 2026-09-12.
 *
 * Kyrgyzstan straightened the rays of its sun in December 2023, and Syria went
 * back to its independence flag in 2025. A child shown the old one would be
 * learning a flag the country no longer flies.
 */
const COMMONS_NIEUWER = {
  KG: 'Flag_of_Kyrgyzstan.svg',
  SY: 'Flag_of_Syria.svg',
};

/** The source's region for the eight countries no topography map holds. */
const REGION_UN = { Africa: 'afrika', Asia: 'azie', Oceania: 'oceanie' };

/**
 * The twelve provinces, by ISO 3166-2, with the Commons file for each. The
 * file names are the ones Commons redirects to, so a fetch lands on the file
 * whose licence was checked rather than on a redirect page.
 */
const PROVINCIES = [
  { iso: 'NL-GR', provincie: 'nl-prov-groningen', commons: 'Flag_of_Groningen.svg' },
  { iso: 'NL-FR', provincie: 'nl-prov-fryslan', commons: 'Frisian_flag.svg' },
  { iso: 'NL-DR', provincie: 'nl-prov-drenthe', commons: 'Flag_of_Drenthe.svg' },
  { iso: 'NL-OV', provincie: 'nl-prov-overijssel', commons: 'Flag_of_Overijssel.svg' },
  { iso: 'NL-FL', provincie: 'nl-prov-flevoland', commons: 'Flag_of_Flevoland.svg' },
  { iso: 'NL-GE', provincie: 'nl-prov-gelderland', commons: 'Flag_of_Gelderland.svg' },
  { iso: 'NL-UT', provincie: 'nl-prov-utrecht', commons: 'Utrecht_(province)-Flag.svg' },
  { iso: 'NL-NH', provincie: 'nl-prov-noord-holland', commons: 'Flag_of_North_Holland.svg' },
  { iso: 'NL-ZH', provincie: 'nl-prov-zuid-holland', commons: 'Flag_of_Zuid-Holland.svg' },
  { iso: 'NL-ZE', provincie: 'nl-prov-zeeland', commons: 'Flag_of_Zeeland.svg' },
  { iso: 'NL-NB', provincie: 'nl-prov-noord-brabant', commons: 'North_Brabant-Flag.svg' },
  { iso: 'NL-LI', provincie: 'nl-prov-limburg', commons: 'Flag_of_Limburg_(Netherlands).svg' },
];

/** The same corrections `build-countries.mjs` makes, for the same reasons. */
const NAAMCORRECTIES = new Map([
  ['Swaziland', { naam: 'Eswatini', aliassen: ['Swaziland'] }],
  ['Wit-Rusland', { naam: 'Belarus', aliassen: ['Wit-Rusland'] }],
  ['Volksrepubliek China', { naam: 'China', aliassen: ['Volksrepubliek China'] }],
  [
    'Verenigde Staten van Amerika',
    { naam: 'Verenigde Staten', aliassen: ['Verenigde Staten van Amerika', 'Amerika', 'VS'] },
  ],
]);

const KLASSEN = new Set(['bekend', 'normaal', 'lastig']);

function fail(message) {
  console.error(`build-vlaggen: ${message}`);
  process.exit(1);
}

function leesJson(pad) {
  return JSON.parse(readFileSync(pad, 'utf8'));
}

// ---------------------------------------------------------------------------
// The pictures

async function haal(url, doel) {
  if (existsSync(doel)) return readFileSync(doel, 'utf8');
  const antwoord = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!antwoord.ok) fail(`${url} gaf ${antwoord.status}`);
  const tekst = await antwoord.text();
  if (!/<svg\b/.test(tekst)) fail(`${url} is geen SVG`);
  writeFileSync(doel, tekst);
  return tekst;
}

/**
 * Width over height, as an `<img>` will draw it: from the root element's size
 * where it gives one, and from its viewBox where it does not.
 *
 * The size first, because that is what a browser does. Qatar's file draws in a
 * box of 75 by 18 and asks to be stretched to 1400 by 550: read from the
 * viewBox it is four times as long as it is high, and on screen it is two and a
 * half.
 */
function verhoudingVan(svg, naam) {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
  const breed = /\swidth\s*=\s*["']\s*([\d.]+)\s*(?:px)?\s*["']/.exec(root);
  const hoog = /\sheight\s*=\s*["']\s*([\d.]+)\s*(?:px)?\s*["']/.exec(root);
  if (breed && hoog) return Number(breed[1]) / Number(hoog[1]);

  const vak = /\sviewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([\d.eE]+)[\s,]+([\d.eE]+)/.exec(
    root,
  );
  if (vak) return Number(vak[3]) / Number(vak[4]);
  fail(`${naam}: geen breedte en hoogte en geen viewBox`);
}

/**
 * The file as published: unchanged, except for a viewBox where there is none.
 * An SVG without one is drawn at its own size inside an `<img>` rather than
 * scaled to it.
 */
function zonderVerrassingen(svg) {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
  if (/\sviewBox\s*=/.test(root)) return svg;
  const breed = /\swidth\s*=\s*["']([\d.]+)/.exec(root)?.[1];
  const hoog = /\sheight\s*=\s*["']([\d.]+)/.exec(root)?.[1];
  return svg.replace(root, root.replace(/^<svg\b/, `<svg viewBox="0 0 ${breed} ${hoog}"`));
}

async function beeld(iso, url, bestand) {
  const svg = await haal(url, join(BRON, bestand));
  const uit = `${iso.toLowerCase()}.svg`;
  writeFileSync(join(UIT_BEELDEN, uit), zonderVerrassingen(svg));
  return {
    beeld: `vlaggen/${uit}`,
    verhouding: Math.round(verhoudingVan(svg, iso) * 10_000) / 10_000,
  };
}

// ---------------------------------------------------------------------------
// Names and werelddelen, from topography

function topografie() {
  if (!existsSync(NE_BRON)) {
    fail(`${NE_BRON} ontbreekt — draai eerst node tools/content/fetch-source.mjs`);
  }

  // Natural Earth, for the ISO code behind each name and for the eight
  // countries no map holds.
  const perIso = new Map();
  for (const feature of leesJson(NE_BRON).features) {
    const p = feature.properties;
    const iso = String(p.ISO_A2_EH ?? p.ISO_A2 ?? '');
    if (!LANDEN.includes(iso) || perIso.has(iso)) continue;
    perIso.set(iso, {
      ...(NAAMCORRECTIES.get(p.NAME_NL) ?? { naam: p.NAME_NL, aliassen: [] }),
      regionUn: p.REGION_UN,
    });
  }

  // Which maps each name is on, and under which ids.
  const kaarten = new Map();
  for (const regio of [
    'afrika',
    'azie',
    'europa',
    'noord-amerika',
    'zuid-amerika',
    'oceanie',
    'wereld',
  ]) {
    const set = leesJson(join(SETS, `${regio}-landen.json`));
    for (const item of set.items) {
      const op = kaarten.get(item.naam) ?? { werelddelen: [], topo: [], aliassen: item.aliassen };
      if (regio !== 'wereld') op.werelddelen.push(regio);
      op.topo.push(item.id);
      kaarten.set(item.naam, op);
    }
  }

  return new Map(
    LANDEN.map((iso) => {
      const ne = perIso.get(iso);
      if (!ne) fail(`${iso} staat niet in Natural Earth`);
      const kaart = kaarten.get(ne.naam);
      const werelddelen = kaart?.werelddelen.length ? kaart.werelddelen : [REGION_UN[ne.regionUn]];
      if (!werelddelen[0]) fail(`${iso} (${ne.naam}): geen werelddeel`);

      return [
        iso,
        {
          naam: ne.naam,
          aliassen: kaart?.aliassen ?? ne.aliassen,
          werelddelen,
          topo: kaart?.topo ?? [],
        },
      ];
    }),
  );
}

function provincieData() {
  const provincies = leesJson(join(SETS, 'nl-provincies.json')).items;
  const hoofdsteden = leesJson(join(SETS, 'nl-hoofdsteden.json')).items;

  return new Map(
    PROVINCIES.map(({ iso, provincie }) => {
      const item = provincies.find((kandidaat) => kandidaat.id === provincie);
      const stad = hoofdsteden.find((kandidaat) => kandidaat.relaties?.hoofdstadVan === provincie);
      if (!item || !stad) fail(`${iso}: provincie of hoofdstad niet gevonden`);
      return [iso, { naam: item.naam, aliassen: item.aliassen, hoofdstad: stad.naam }];
    }),
  );
}

// ---------------------------------------------------------------------------

/**
 * Every file in the folder, as one map per kind. A code in two files is an
 * error rather than a quiet override: Cyprus is on two maps, and its text
 * belongs in one place.
 */
function leesRedactie() {
  const samen = { landen: {}, provincies: {} };
  for (const bestand of readdirSync(REDACTIE).filter((naam) => naam.endsWith('.json')).sort()) {
    const inhoud = leesJson(join(REDACTIE, bestand));
    for (const soort of ['landen', 'provincies']) {
      for (const [iso, tekst] of Object.entries(inhoud[soort] ?? {})) {
        if (samen[soort][iso]) fail(`${iso} staat in meer dan één redactiebestand (${bestand})`);
        samen[soort][iso] = tekst;
      }
    }
  }
  return samen;
}

function redactieVan(redactie, iso, velden) {
  const tekst = redactie[iso];
  if (!tekst) return null;
  for (const veld of velden) {
    if (typeof tekst[veld] !== 'string' || tekst[veld].trim() === '') {
      fail(`redactie ${iso}: "${veld}" ontbreekt`);
    }
  }
  if (!KLASSEN.has(tekst.klasse)) fail(`redactie ${iso}: klasse "${tekst.klasse}"`);
  return tekst;
}

async function main() {
  mkdirSync(BRON, { recursive: true });
  mkdirSync(UIT_BEELDEN, { recursive: true });

  const namen = topografie();
  const provNamen = provincieData();

  // Pictures first: they need nothing from us, and a run that stops at the
  // text below still leaves them in place to be looked at.
  const beelden = new Map();
  for (const iso of LANDEN) {
    const nieuwer = COMMONS_NIEUWER[iso];
    const url = nieuwer
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${nieuwer}`
      : `https://raw.githubusercontent.com/${REGION_FLAGS.repo}/${REGION_FLAGS.commit}/svg/${iso}.svg`;
    beelden.set(iso, await beeld(iso, url, nieuwer ? `commons-${iso}.svg` : `${iso}.svg`));
  }
  for (const { iso, commons } of PROVINCIES) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${commons}`;
    beelden.set(iso, await beeld(iso, url, `${iso}.svg`));
  }

  if (!existsSync(REDACTIE)) fail(`${REDACTIE} ontbreekt; de beelden staan klaar`);
  const redactie = leesRedactie();
  const groepen = leesJson(GROEPEN).groepen;

  const ontbreekt = [
    ...LANDEN.filter((iso) => !redactie.landen?.[iso]),
    ...PROVINCIES.map(({ iso }) => iso).filter((iso) => !redactie.provincies?.[iso]),
  ];
  if (ontbreekt.length > 0) fail(`redactie ontbreekt voor ${ontbreekt.join(' ')}`);

  const lidVan = (iso) => groepen.filter((groep) => groep.leden.includes(iso)).map((g) => g.id);

  const landen = LANDEN.map((iso) => {
    const tekst = redactieVan(redactie.landen, iso, ['klasse', 'hoofdstad', 'beschrijving', 'weetje']);
    const { naam, aliassen, werelddelen, topo } = namen.get(iso);
    return {
      id: `vlag-${iso.toLowerCase()}`,
      iso,
      naam,
      aliassen,
      werelddelen,
      klasse: tekst.klasse,
      groepen: lidVan(iso),
      hoofdstad: tekst.hoofdstad,
      // Where the United Nations add a footnote to the capital — a second city
      // that is the seat of government, or a designation it does not recognise
      // — the child is told the same, in one short sentence.
      ...(tekst.hoofdstadNoot ? { hoofdstadNoot: tekst.hoofdstadNoot } : {}),
      beschrijving: tekst.beschrijving,
      weetje: tekst.weetje,
      ...beelden.get(iso),
      licentie: NATIONAAL_VRIJGESTELD.has(iso) ? 'vrijgesteld-nationaal' : 'publiek-domein',
      topo,
    };
  }).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));

  const provincies = PROVINCIES.map(({ iso, provincie }) => {
    const tekst = redactieVan(redactie.provincies, iso, ['klasse', 'beschrijving', 'weetje']);
    const { naam, aliassen, hoofdstad } = provNamen.get(iso);
    return {
      id: `vlag-${iso.toLowerCase()}`,
      iso,
      naam,
      aliassen,
      werelddelen: ['nederland'],
      klasse: tekst.klasse,
      groepen: lidVan(iso),
      hoofdstad,
      beschrijving: tekst.beschrijving,
      weetje: tekst.weetje,
      ...beelden.get(iso),
      licentie: 'publiek-domein',
      topo: [provincie],
    };
  });

  // What must hold before a child sees any of it. `vlaggen.content.test.ts`
  // checks the same things again on the file, for anyone who edits it by hand.
  const alle = [...landen, ...provincies];
  if (landen.length !== 196) fail(`${landen.length} landen, en het moeten er 196 zijn`);
  if (new Set(alle.map((vlag) => vlag.iso)).size !== alle.length) fail('dubbele ISO-code');
  for (const groep of groepen) {
    const onbekend = groep.leden.filter((iso) => !alle.some((vlag) => vlag.iso === iso));
    if (onbekend.length > 0) fail(`groep ${groep.id}: onbekend ${onbekend.join(' ')}`);
    if (groep.leden.length < 2) fail(`groep ${groep.id}: minder dan twee leden`);
  }
  for (const iso of ['VA', 'XK']) {
    if (redactie.landen[iso].klasse === 'bekend') fail(`${iso} hoort niet bij de bekende vlaggen`);
  }

  writeFileSync(
    UIT_DATA,
    `${JSON.stringify(
      {
        _generated:
          'Geschreven door tools/content/build-vlaggen.mjs. Handmatige wijzigingen gaan bij de volgende run verloren.',
        contentVersie: CONTENT_VERSIE,
        bron: {
          landen: `${REGION_FLAGS.repo}@${REGION_FLAGS.commit}`,
          provincies: 'Wikimedia Commons, elk bestand gemarkeerd als publiek domein',
        },
        landen,
        provincies,
        groepen: groepen.map(({ id, leden, reden }) => ({
          id,
          leden: leden.map((iso) => `vlag-${iso.toLowerCase()}`),
          reden,
        })),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`build-vlaggen: ${landen.length} landen, ${provincies.length} provincies`);
  console.log(`  ${groepen.length} groepen die op elkaar lijken`);
}

await main();
