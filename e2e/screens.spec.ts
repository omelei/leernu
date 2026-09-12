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
  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  // Nothing is chosen for the child any more, so the subject is pressed too.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ })
    .click();
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
  // The child's column and the streak are read from IndexedDB, and on WebKit —
  // both iPads and the iPhone — the read is slower than a screenshot taken the
  // moment the name appears. The page draws the cards at once and fills them
  // when it knows (ADR-094); a picture of the empty cards is not the page a
  // child looks at, so this waits for the filled one.
  const voortgang = page.getByRole('region', { name: 'Jouw voortgang' });
  await expect(voortgang).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.tk-streak')).toBeVisible();
  await shoot(page, size, '02-thuis');

  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await shoot(page, size, '03-kiezen');

  await page.goto('/jij');
  await expect(page.getByRole('heading', { name: 'Jij', exact: true })).toBeVisible();
  await shoot(page, size, '04-jij');

  // The collection, which is the longest page in the product and the one that
  // has to survive being mostly empty: a new child has three of twelve heroes,
  // no stars, no diplomas and no stamps (ADR-076, ADR-098).
  await page.goto('/voortgang');
  await expect(page.getByRole('heading', { name: 'Jouw voortgang', level: 1 })).toBeVisible();
  await shoot(page, size, '12-voortgang');
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
    .getByRole('button', { name: /^Provincies/ })
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

/**
 * The two maps that are not the Netherlands (ADR-086).
 *
 * Worth a picture at every size for the reason the whole file exists: a
 * continent and a globe are the first maps in this product whose shape is
 * nothing like the one the layout was drawn around, and a world map that goes
 * wrong at 393 pixels goes wrong in a classroom.
 */
test('the round: Europe, and the world', async ({ page }, testInfo) => {
  const size = testInfo.project.name;

  await signIn(page, 'Isa');

  // Europa by pointing, which is what a werelddeel is for: forty-six countries
  // and a handful of rings round the microstates. And the world by choosing,
  // because that is the way in there — a hundred and sixty-seven countries are
  // not something a finger can find, so the map lights one up and the child
  // answers in words (ADR-087). The two pictures are the argument.
  for (const [regio, hoe, naam] of [
    ['Europa', /Aanwijzen/, '13-europa'],
    ['Wereld', /Kies uit vier namen/, '14-wereld'],
  ] as const) {
    await page.goto('/topografie');
    await page.getByRole('button', { name: new RegExp(`^${regio}`) }).click();
    await page
      .getByRole('region', { name: /Kies een onderwerp/ })
      .getByRole('button', { name: /^Landen/ })
      .click();
    await page
      .getByRole('region', { name: /Hoe wil je/ })
      .getByRole('button', { name: hoe })
      .click();
    await start(page);

    await expect(page.getByRole('heading', { name: /Waar ligt |Hoe heet dit land/ })).toBeVisible(
      READY,
    );
    await shoot(page, size, naam);

    await page.getByRole('button', { name: 'Stoppen' }).click();
    await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
  }
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
  await chooseAndStart(page, /Zelf typen/);

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

  // Nothing is chosen when the page opens, so the picture is taken once the
  // child has answered every step: the keypad open and the start bar ready.
  await page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Tafels/ })
    .click();
  await page.getByRole('button', { name: 'Tafel van 1', exact: true }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await shoot(page, size, '10-tafels');

  await start(page);

  await expect(page.getByPlaceholder('Antwoord')).toBeVisible(READY);
  await shoot(page, size, '11-som');
});
