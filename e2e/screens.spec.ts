import { expect, test, type Page } from '@playwright/test';

/**
 * The screens of the design, photographed at every size the app claims to work
 * at.
 *
 * Spec section 8 asks for this, and it is the one check nothing else covers.
 * The a11y and flow specs prove a control exists and can be reached; neither of
 * them can see that the map is letterboxed on a phone, that the question card
 * has landed on top of Limburg, or that a heading has wrapped to three lines on
 * the Chromebook. Those are the bugs this build has actually shipped, and they
 * were all found by looking.
 *
 * The files land in `screenshots/` and CI uploads them, so a size can be
 * inspected without owning the device — which, for the Android and iPad cases,
 * nobody here does.
 *
 * These assert almost nothing on purpose. A screenshot test that fails on a
 * pixel is a test that gets disabled; what makes this useful is that the images
 * are current on every run, not that they are compared to yesterday's.
 */

const READY = { timeout: 15_000 };

async function shoot(page: Page, project: string, naam: string) {
  await page.screenshot({ path: `screenshots/${project}-${naam}.png`, fullPage: false });
}

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function chooseAndStart(page: Page, way: RegExp) {
  await page.getByRole('button', { name: 'Andere manieren' }).first().click();
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const how = page.getByRole('region', { name: /Hoe wil je/ });
  await how.getByRole('button', { name: way }).click();
  await start(page);
}

/** The one way out of K2, whatever was chosen. See e2e/app.spec.ts. */
async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

test('the front door, the chooser and the profile', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();
  await shoot(page, size, '01-naam');

  await signIn(page, 'Fenna');
  await shoot(page, size, '02-thuis');

  await page.getByRole('button', { name: 'Andere manieren' }).first().click();
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await shoot(page, size, '03-kiezen');

  await page.goto('/jij');
  await expect(page.getByRole('heading', { name: 'Jij', exact: true })).toBeVisible();
  await shoot(page, size, '04-jij');
});

/**
 * K3 and K4 in one pass, because the point of K4 is that nothing moves except
 * the words — and two pictures taken a second apart are how you see that.
 */
test('the round: pointing, and the answer', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Joris');
  await page.goto('/topografie');
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /Provincies van Nederland/ })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible(READY);
  await shoot(page, size, '05-wijs-aan');

  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await shoot(page, size, '06-antwoord');

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
  await shoot(page, size, '07-resultaat');
});

test('the round: choosing between four names', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Mila');
  await chooseAndStart(page, /Kies uit vier namen/);

  await expect(page.getByRole('group', { name: 'Kies de naam' })).toBeVisible(READY);
  await shoot(page, size, '08-meerkeuze');
});

test('the round: typing the name', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Stijn');
  await chooseAndStart(page, /Typ de naam/);

  await expect(page.getByPlaceholder('Naam')).toBeVisible(READY);
  await shoot(page, size, '09-typen');
});

/** Rekenen, the second module: the same page, and a round of it. */
test('the tables: choosing one, and a sum', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Bas');
  // The word a parent types, which is now the page itself rather than a card
  // pointing at one.
  await page.goto('/rekenen');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await shoot(page, size, '10-tafels');

  // The page opens on the table of one and on typing, so the start button is
  // enough to get into a round.
  await start(page);

  await expect(page.getByPlaceholder('Antwoord')).toBeVisible(READY);
  await shoot(page, size, '11-som');
});
