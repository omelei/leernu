import { expect, test, type Request } from '@playwright/test';

/**
 * The app asks nobody anything.
 *
 * This is the product's central claim and the stated reason the repository is
 * public, and until now it was a promise rather than a fact. A promise about
 * network behaviour is exactly the kind that breaks by accident: one webfont
 * link, one analytics snippet, one CDN import in a dependency, and a child's
 * browser is telling a third party which school-night they practised on. None
 * of those look like anything in review.
 *
 * So the test is not "we did not add tracking". It is: over a real run of the
 * app, every single request went to our own origin. That is the claim, whole.
 */

const ALLOWED_SCHEMES = ['data:', 'blob:', 'about:'];

function isForeign(request: Request, origin: string): boolean {
  const url = request.url();
  if (ALLOWED_SCHEMES.some((scheme) => url.startsWith(scheme))) return false;
  return !url.startsWith(origin);
}

test('never asks a third party for anything', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  const foreign: string[] = [];

  // Every request, not just documents and scripts: fonts, images, XHR, fetch,
  // beacons and preloads all count, and a beacon is the one that would matter
  // most and show least.
  page.on('request', (request) => {
    if (isForeign(request, origin)) foreign.push(`${request.method()} ${request.url()}`);
  });

  // A real run rather than a page load: the fonts, the map geometry and the
  // stylesheet all arrive at different moments, and a request made only when a
  // child answers a question is precisely the one worth catching.
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Sofie');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sofie' })).toBeVisible();

  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  // The wrapper rather than the label: the label is the combination in words
  // and its measure comes from the round, so matching on "vragen" was quietly
  // asserting which modes exist — and one of the mode cards ends in it too.
  await page.locator('.tk-choose-start button').click();
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();

  // Fonts load lazily on first paint of the face that needs them, so give the
  // document's own font loading a chance to finish before deciding.
  await page.evaluate(() => document.fonts.ready);

  expect(foreign, `these went somewhere other than ${origin}`).toEqual([]);
});

test('carries no link or import pointing off-origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  await page.goto('/');

  // Belt and braces for the request test above: a stylesheet that fails to load
  // makes no successful request either, and would otherwise pass silently.
  const references = await page.evaluate(() =>
    [
      ...[...document.querySelectorAll('link[href]')].map((el) => el.getAttribute('href')),
      ...[...document.querySelectorAll('script[src]')].map((el) => el.getAttribute('src')),
      ...[...document.querySelectorAll('img[src]')].map((el) => el.getAttribute('src')),
    ].filter((value): value is string => value !== null),
  );

  const offOrigin = references.filter((href) => {
    const resolved = new URL(href, origin);
    return resolved.origin !== origin;
  });

  expect(offOrigin, 'markup references something off-origin').toEqual([]);
});
