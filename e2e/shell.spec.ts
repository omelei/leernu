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
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
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
  // The wrapper rather than the label: the label is the combination in words
  // and its measure comes from the round, so matching on "vragen" was quietly
  // asserting which modes exist — and one of the mode cards ends in it too.
  await page.locator('.tk-choose-start button').click();
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

test('shows the question and the map together, at every size', async ({ page }) => {
  // The failure this is here for: the question used to share a row with the
  // counters and the stop button, and on 393 it was squeezed to nothing — in
  // the document, zero pixels wide, with a child looking at a map and no
  // question. K3 gives it a place of its own at each size.
  await signIn(page, 'Lotte');
  await startRound(page);

  const question = page.getByRole('heading', { name: /Waar ligt / });
  await expect(question).toBeVisible();

  const box = await question.boundingBox();
  expect(box, 'the question has no box at all').not.toBeNull();
  // Wide enough to hold a province name rather than technically present.
  expect(box?.width ?? 0, 'the question was squeezed').toBeGreaterThan(120);

  // And the map is on screen with it, which is the whole point of the layout.
  await expect(page.locator('.tk-round-map svg').first()).toBeVisible();

  // The ten dots, and nothing that could be mistaken for navigation.
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('the frame comes back when the round ends', async ({ page }) => {
  await signIn(page, 'Noor');
  await startRound(page);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('button', { name: 'Terug naar start' }).click();

  await expect(page.getByRole('banner').getByRole('button', { name: 'Noor' })).toBeVisible();
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

  // The heading of the page, not the name in the app bar: what this is checking
  // is that the type scale moves with the root size, and only a heading is set
  // on the scale. A label in a pill would pass this by staying small.
  const heading = page.getByRole('heading', { name: 'Welkom Fatima!' });
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

test('below 1200 the modules are a menu under the app bar', async ({ page }, testInfo) => {
  // ADR-093: the rail stands up at a desk and nowhere else. On both iPads and
  // both phones the way to a module is this one control.
  test.skip(
    ['chromebook', 'desktop-1440'].includes(testInfo.project.name),
    'the rail, at a desk',
  );

  await signIn(page, 'Ilse');

  const knop = page.getByRole('button', { name: /^vak / });
  await expect(knop).toHaveAccessibleName('vak Kies een vak');
  await expect(knop).toHaveAttribute('aria-expanded', 'false');

  await knop.click();
  await expect(knop).toHaveAttribute('aria-expanded', 'true');
  await page
    .getByRole('navigation', { name: 'Modules' })
    .getByRole('button', { name: 'Klok', exact: true })
    .click();

  // Where it was asked to go, closed again, and saying so on its own face.
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(knop).toHaveAccessibleName('vak Klok');
  await expect(knop).toHaveAttribute('aria-expanded', 'false');

  // And it lets go on Escape, with focus back on the control that opened it.
  await knop.click();
  await page.keyboard.press('Escape');
  await expect(knop).toHaveAttribute('aria-expanded', 'false');
  await expect(knop).toBeFocused();
});
