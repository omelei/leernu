import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Makes a deep link work on GitHub Pages.
 *
 * Pages serves static files. Ask it for /topografie and there is no such file,
 * so it serves 404.html — which is the whole trick: if 404.html *is* the app,
 * the app boots, reads the path it was asked for and shows topography. Without
 * this, every address in the product works when you click to it and breaks when
 * you type it or share it, which is the worse half.
 *
 * The status code really is 404, which is wrong for a page that renders. It
 * costs nothing today — nobody is indexing an app behind a name field — and the
 * honest fix is a host that can rewrite, not a cleverer trick here. Written
 * down so that whoever moves off Pages knows this can go.
 */
const dist = join(process.cwd(), 'dist');
const index = join(dist, 'index.html');

if (!existsSync(index)) {
  console.error('No dist/index.html — run the build first.');
  process.exit(1);
}

copyFileSync(index, join(dist, '404.html'));
console.log('Deep links: dist/404.html is a copy of index.html.\n');
