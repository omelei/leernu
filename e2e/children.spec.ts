import { expect, test, type Page } from '@playwright/test';

/**
 * Two children on one device, ADR-046.
 *
 * This is the failure that was already in the schema rather than a feature
 * anybody asked for: `itemStates` was keyed by item alone, so a family iPad had
 * one set of Leitner boxes and the youngest kept meeting the eldest's
 * provinces. Nobody would have seen it as a bug — they would have seen a
 * forecast that was quietly wrong.
 *
 * So what is worth asserting is separation, not the buttons: one child's answer
 * must not appear in the other's progress, and one child's streak must not keep
 * the other's going.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function answerOne(page: Page) {
  await page.goto('/');
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

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();

  // The streak is written after the round ends and the result screen does not
  // wait for it, so leaving now would race the write. This line is the screen
  // saying it landed — either wording, because which of the two appears turns
  // on whether a streak was broken and that is not what is being tested here.
  await expect(page.getByText(/Je bent begonnen|Dat is je eerste dag/)).toBeVisible();
}

/** How the Provincies tile on /topografie speaks of this child's progress. */
async function provincies(page: Page) {
  await page.goto('/topografie');
  return page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /^Provincies/ });
}

async function openKinderen(page: Page) {
  await page.goto('/jij');
  await page.getByRole('button', { name: 'Wissel naar een ander kind' }).click();
}

async function addChild(page: Page, naam: string) {
  await openKinderen(page);
  await page.getByLabel('Naam van het kind').fill(naam);
  await page.getByRole('button', { name: 'Nog een kind erbij' }).click();

  // Adding reloads, on purpose: every screen holds some of a child's work in
  // React state and none of it may survive the handover.
  await expect(page.getByText(`Je oefent als ${naam}.`)).toBeVisible();
}

test('a second child starts with nothing, and the first keeps everything', async ({ page }) => {
  await signIn(page, 'Anne');
  await answerOne(page);

  // Anne has practised the provinces; the tile says so rather than "nog niet
  // geoefend".
  await expect(await provincies(page)).not.toHaveAccessibleName(/nog niet geoefend/);

  await addChild(page, 'Bram');

  // Bram starts at nothing: his own boxes, and they are empty.
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Bram' })).toBeVisible();
  await expect(await provincies(page)).toHaveAccessibleName(/nog niet geoefend/);

  // And handing the device back gives Anne hers, unchanged.
  await openKinderen(page);
  await page.getByRole('button', { name: /Geef Anne de beurt/ }).click();
  await expect(page.getByText('Je oefent als Anne.')).toBeVisible();
  await expect(await provincies(page)).not.toHaveAccessibleName(/nog niet geoefend/);
});

test('the child practising is the one the screen says', async ({ page }) => {
  await signIn(page, 'Iris');
  await addChild(page, 'Tijn');
  await openKinderen(page);

  const lijst = page.getByRole('region', { name: 'Wie oefent er?' });

  // The one practising is not a button: there is nothing to hand them.
  await expect(lijst.getByRole('button', { name: /Tijn/ })).toHaveCount(0);
  await expect(lijst.getByText('oefent nu')).toBeVisible();
  await expect(lijst.getByRole('button', { name: /Geef Iris de beurt/ })).toBeVisible();
});
