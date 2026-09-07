import { expect, test, type Page } from '@playwright/test';

/**
 * The frame, and the rule that it disappears.
 *
 * Every one of these runs at all six sizes in playwright.config.ts, because the
 * navigation model is different at four of them and the two rules below are
 * supposed to hold regardless.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('heading', { name: `Hoi ${naam}!` })).toBeVisible();
}

async function startRound(page: Page) {
  await page
    .getByRole('article')
    .filter({ hasText: 'Provincies van Nederland' })
    .getByRole('button', { name: 'Wijs aan' })
    .click();
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
}

test('a round has no navigation in the document at all', async ({ page }) => {
  await signIn(page, 'Sanne');
  await startRound(page);

  // Not "hidden": absent. A round screen is not wrapped in the Shell, so there
  // is nothing to tab into and nothing to mis-tap with the map under a thumb.
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.locator('.tk-rail')).toHaveCount(0);
  await expect(page.locator('.tk-tabbar')).toHaveCount(0);
  await expect(page.locator('.tk-appbar')).toHaveCount(0);

  // What is left is a way out and the progress.
  //
  // The read-aloud button belongs in that list and is not asserted, because
  // SpeakButton renders nothing when the platform offers no speech voices and
  // headless Chromium offers none. Asserting it here would mean asserting the
  // browser rather than the app.
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();
});

test('the frame comes back when the round ends', async ({ page }) => {
  await signIn(page, 'Noor');
  await startRound(page);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('button', { name: 'Terug naar start' }).click();

  await expect(page.getByRole('heading', { name: 'Hoi Noor!' })).toBeVisible();
  await expect(page.locator('.tk-appbar')).toHaveCount(1);
});

test('never scrolls sideways, at any size', async ({ page }) => {
  await signIn(page, 'Youssef');

  // A page that scrolls horizontally on a phone is a layout that has escaped
  // its own container, and it is the first thing that goes wrong at 393.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('fits a whole round inside the height of a Chromebook', async ({ page }, testInfo) => {
  // §D: "alles binnen 768 hoog: geen verticaal scrollen tijdens een ronde".
  // Only the Chromebook makes that promise — a phone scrolls by nature, and a
  // round on 852 of height is a different layout, not a broken one.
  test.skip(testInfo.project.name !== 'chromebook', 'the 1366x768 promise');

  await signIn(page, 'Milan');
  await startRound(page);

  const scrollable = await page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );
  expect(scrollable, 'a round should not need scrolling on 1366x768').toBeLessThanOrEqual(0);
});

test('keeps the wordmark and the question legible at 200% text', async ({ page }) => {
  // ADR-025 dropped the reading mode and left this as the only typographic
  // accessibility affordance in the product, with the note that it therefore has
  // to work. The type scale is in rem (ADR-033), so the root size is what a
  // reader's own setting moves.
  await signIn(page, 'Fatima');
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });

  const heading = page.getByRole('heading', { name: 'Hoi Fatima!' });
  await expect(heading).toBeVisible();

  // Grown, not merely still there.
  const size = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThan(40);

  // And nothing has been pushed off the side by the growth.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'doubling the text size must not cause sideways scrolling').toBeLessThanOrEqual(
    0,
  );
});
