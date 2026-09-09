import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Downloads the raw source geometry into content/geo/_source/.
 *
 * Kept out of the build on purpose: a build that reaches the network fails on
 * the day PDOK is down, for reasons that have nothing to do with the change
 * being built. The processed output is committed; the source is not, and this
 * script is how you get it back.
 *
 * **Why CBS Gebiedsindelingen and not PDOK Bestuurlijke Gebieden.** The obvious
 * source is Bestuurlijke Gebieden, and it is wrong for this product: its
 * province polygons include the water assigned to each province, so the
 * IJsselmeer sits inside Noord-Holland, the Markermeer inside Flevoland and the
 * Waddenzee inside Fryslân. On a map that draws the IJsselmeer as land, and in
 * a game it means a child who clicks the middle of the IJsselmeer is told they
 * correctly found Noord-Holland. The IJsselmeer is itself something they are
 * meant to learn. CBS publishes land-only boundaries, verified by point tests
 * against all three water bodies.
 *
 * Licence: CC-BY-4.0, declared by the service itself in its GetCapabilities
 * AccessConstraints. Attribution required. See docs/DATA_SOURCES.md.
 */

const CBS_WFS = 'https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0';

function wfsUrl(typeName) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: `gebiedsindelingen:${typeName}`,
    outputFormat: 'json',
    srsName: 'EPSG:4326',
  });
  return `${CBS_WFS}?${params}`;
}

const SOURCES = [
  {
    id: 'nl-provincies',
    url: wfsUrl('provincie_gegeneraliseerd'),
    bron: 'CBS Gebiedsindelingen 2023, via PDOK',
    licentie: 'CC-BY-4.0',
    attributie: 'Bron: CBS, Kadaster',
  },
  {
    id: 'nl-provincies-labelpunten',
    url: wfsUrl('provincie_labelpoint'),
    bron: 'CBS Gebiedsindelingen 2023, via PDOK',
    licentie: 'CC-BY-4.0',
    attributie: 'Bron: CBS, Kadaster',
  },
  {
    // The Wadden islands are each their own municipality, so the same licensed
    // layer that gives the capitals their coordinates gives the islands their
    // outlines. They are the smallest shapes in the content by a wide margin,
    // which is what makes them the real test of the touch target.
    id: 'nl-gemeenten',
    url: wfsUrl('gemeente_gegeneraliseerd'),
    bron: 'CBS Gebiedsindelingen 2023, via PDOK',
    licentie: 'CC-BY-4.0',
    attributie: 'Bron: CBS, Kadaster',
  },
  {
    // Every provincial capital is a municipality, so its label point is a
    // sourced coordinate from the same licensed dataset. It is the centre of the
    // municipality rather than of the town, which at national scale is a
    // difference of a few kilometres — well inside the touch target — and it
    // saves inventing coordinates from memory, which spec section 12 forbids.
    id: 'nl-gemeenten-labelpunten',
    url: wfsUrl('gemeente_labelpoint'),
    bron: 'CBS Gebiedsindelingen 2023, via PDOK',
    licentie: 'CC-BY-4.0',
    attributie: 'Bron: CBS, Kadaster',
  },
];

/**
 * Population per municipality, from CBS StatLine. Not geometry, but the thing
 * that turns "which eighty cities" from an opinion into a ranking anyone can
 * check and disagree with on the evidence.
 */
const CBS_BEVOLKING =
  'https://opendata.cbs.nl/ODataApi/odata/70072ned/TypedDataSet' +
  "?$filter=startswith(RegioS,'GM') and Perioden eq '2023JJ00'" +
  '&$select=RegioS,TotaleBevolking_1';

SOURCES.push({
  id: 'nl-bevolking',
  url: CBS_BEVOLKING,
  bron: 'CBS StatLine 70072ned, Regionale kerncijfers Nederland, 2023',
  licentie: 'CC-BY-4.0',
  attributie: 'Bron: CBS',
});

/**
 * Natural Earth, for everything outside the Netherlands.
 *
 * **Public domain**, stated by the project itself: "no permission needed",
 * no attribution required, no restrictions on use — which is the only licence
 * in this repository that asks nothing at all. We credit it anyway, in
 * docs/DATA_SOURCES.md, because a map with no stated origin is a map nobody can
 * check.
 *
 * Two scales, because a continent and a globe want different amounts of
 * coastline. **1:50m** for Europe: at 1:110m Luxembourg, Montenegro, Kosovo and
 * half the Balkans are simply absent from the file, and a set of European
 * countries that quietly omits eleven of them is worse than no set. **1:110m**
 * for the world, where 1:50m would be four megabytes of coastline nobody can
 * see at that size.
 *
 * The Dutch names come with the data — `NAME_NL` on every feature — so the
 * names a child reads are sourced rather than typed out from memory, which is
 * the same rule the provinces follow.
 */
const NATURAL_EARTH =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';

SOURCES.push(
  {
    id: 'ne-landen-50m',
    url: `${NATURAL_EARTH}/ne_50m_admin_0_countries.geojson`,
    bron: 'Natural Earth, admin 0 countries, 1:50m',
    licentie: 'Publiek domein',
    attributie: 'Made with Natural Earth',
  },
  {
    id: 'ne-landen-110m',
    url: `${NATURAL_EARTH}/ne_110m_admin_0_countries.geojson`,
    bron: 'Natural Earth, admin 0 countries, 1:110m',
    licentie: 'Publiek domein',
    attributie: 'Made with Natural Earth',
  },
);

const OUT_DIR = join(process.cwd(), 'content', 'geo', '_source');
mkdirSync(OUT_DIR, { recursive: true });

for (const source of SOURCES) {
  process.stdout.write(`Fetching ${source.id} ... `);

  const response = await fetch(source.url);
  if (!response.ok) {
    console.error(`\nHTTP ${response.status} from ${source.url}`);
    process.exit(1);
  }

  const text = await response.text();
  if (text.trimStart().startsWith('<')) {
    console.error(`\nService returned XML, not JSON. First 300 chars:\n${text.slice(0, 300)}`);
    process.exit(1);
  }

  const body = JSON.parse(text);
  const path = join(OUT_DIR, `${source.id}.json`);

  writeFileSync(
    path,
    JSON.stringify({
      _bron: source.bron,
      _licentie: source.licentie,
      _attributie: source.attributie,
      _url: source.url,
      _opgehaald: new Date().toISOString().slice(0, 10),
      ...body,
    }),
  );

  const count = body.features?.length ?? 0;
  console.log(`${count} feature(s), ${(text.length / 1024 / 1024).toFixed(2)} MB`);
}

console.log(`\nWritten to ${OUT_DIR}`);
console.log('Now run: node tools/content/build-geo.mjs');
console.log('           node tools/content/build-countries.mjs');
