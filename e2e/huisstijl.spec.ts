import { expect, test, type Page } from '@playwright/test';

/**
 * The house style in the running app (ADR-109).
 *
 * The unit tests hold the tokens to the handoff's values; this holds that the
 * page actually uses them: the ground is the handoff's papier, headings are
 * Archivo, and a round turns dark with its controls at 56 on every size.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function startRound(page: Page) {
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await page.locator('.tk-choose-start button').click();
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
}

test('stands on the handoff’s paper and sets its headings in Archivo', async ({ page }) => {
  await signIn(page, 'Noor');

  const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(ground).toBe('rgb(239, 237, 228)');

  const heading = page.getByRole('heading', { name: /^Welkom / });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Archivo');
  expect(await heading.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');

  // Running text is Public Sans.
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain(
    'Public Sans',
  );
});

test('turns a round dark, with its controls at 56 whatever the size', async ({ page }) => {
  await signIn(page, 'Daan');
  await startRound(page);

  const ronde = page.locator('[data-thema="ronde"]');
  await expect(ronde).toBeVisible();
  expect(await ronde.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(26, 32, 27)',
  );

  const stop = await page.locator('.tk-stop').boundingBox();
  expect(stop?.height ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
  expect(stop?.width ?? 0, 'the stop in a round').toBeGreaterThanOrEqual(56);
});
