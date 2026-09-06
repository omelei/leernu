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
