import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

/**
 * Prints the gzipped size of the app shell against the budget in spec section 8.
 *
 * It reports and does not fail. Keeping Framer Motion was a deliberate choice
 * (ADR-010), and the point of measuring is that the trade stays visible while
 * the app is still small enough to change course cheaply — not to ambush anyone
 * with a red build.
 *
 * Geodata is excluded on purpose: it is fetched per region set and judging the
 * shell together with it would hide the number that actually matters.
 */

const SHELL_BUDGET_BYTES = 300 * 1024;
const ASSETS_DIR = join(process.cwd(), 'dist', 'assets');

function gzippedSize(path) {
  return gzipSync(readFileSync(path)).length;
}

function humanKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

let files;
try {
  files = readdirSync(ASSETS_DIR);
} catch {
  console.error('No dist/assets directory — run the build first.');
  process.exit(0);
}

const shellFiles = files
  .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
  .map((name) => {
    const path = join(ASSETS_DIR, name);
    return { name, raw: statSync(path).size, gzip: gzippedSize(path) };
  })
  .sort((a, b) => b.gzip - a.gzip);

const total = shellFiles.reduce((sum, file) => sum + file.gzip, 0);

console.log('\nApp shell, gzipped:');
for (const file of shellFiles) {
  console.log(`  ${humanKb(file.gzip).padStart(9)}  ${file.name}`);
}

/**
 * The component gallery is development-only and must not be in here.
 *
 * It hangs behind `import.meta.env.DEV`, which Vite replaces with a literal so
 * that Rollup can drop the branch and the whole tree beneath it. That is how it
 * is meant to work; this is the part that checks it did. "Should be tree-shaken"
 * is a belief until something looks.
 *
 * Unlike the budget below, this fails the build. A size overrun is a trade-off
 * worth seeing; a second interface shipping to children is a mistake.
 */
const GALLERY_MARKER = 'Alleen in ontwikkeling.';
const leaked = shellFiles.filter((file) =>
  readFileSync(join(ASSETS_DIR, file.name), 'utf8').includes(GALLERY_MARKER),
);

const percent = Math.round((total / SHELL_BUDGET_BYTES) * 100);
console.log(`  ${'-'.repeat(30)}`);
console.log(`  ${humanKb(total).padStart(9)}  total`);
console.log(`\nBudget ${humanKb(SHELL_BUDGET_BYTES)} (spec section 8) — using ${percent}%.`);

if (total > SHELL_BUDGET_BYTES) {
  console.log('Over budget. Not failing the build; see ADR-010.\n');
} else {
  console.log('Within budget.\n');
}

if (leaked.length > 0) {
  const names = leaked.map((file) => file.name).join(', ');
  console.error(`The development gallery reached the production bundle: ${names}.\n`);
  process.exit(1);
}

console.log('Development gallery is not in the bundle.\n');
