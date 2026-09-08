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
    .getByRole('region', { name: /Waarover/ })
    .getByRole('button', { name: /Provincies van Nederland/ })
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

async function addChild(page: Page, naam: string) {
  await page.goto('/jij');
  await page.getByRole('button', { name: 'Nog een kind erbij' }).click();
  await page.getByPlaceholder('Naam van het kind').fill(naam);
  await page.getByRole('button', { name: 'Toevoegen' }).click();

  // Adding reloads, on purpose: every screen holds some of a child's work in
  // React state and none of it may survive the handover.
  await expect(page.getByText(`Je oefent als ${naam}.`)).toBeVisible();
}

test('a second child starts with nothing, and the first keeps everything', async ({ page }) => {
  await signIn(page, 'Anne');
  await answerOne(page);

  // One province has left the pile of things Anne has never seen. The boxes are
  // what this test is about; the streak is keyed the same way and is not
  // asserted here because the app bar drops it on a phone, and a check that
  // only runs at three of the six sizes is worse than one that says less.
  await page.goto('/onthouden');
  await expect(page.getByRole('table').getByText('nog niet onthouden').first()).toBeVisible();

  await addChild(page, 'Bram');

  // Bram starts at nothing: his own boxes, and they are empty.
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Bram' })).toBeVisible();

  await page.goto('/onthouden');
  await expect(page.getByRole('table').getByText('nog niet onthouden')).toHaveCount(0);

  // And handing the device back gives Anne hers, unchanged.
  await page.goto('/jij');
  await page.getByRole('button', { name: /Geef Anne de beurt/ }).click();
  await expect(page.getByText('Je oefent als Anne.')).toBeVisible();

  await page.goto('/onthouden');
  await expect(page.getByRole('table').getByText('nog niet onthouden').first()).toBeVisible();
});

test('the child practising is the one the screen says', async ({ page }) => {
  await signIn(page, 'Iris');
  await addChild(page, 'Tijn');

  const lijst = page.getByRole('region', { name: 'Wie oefent er?' });
  const tijn = lijst.getByRole('button', { name: /Tijn/ });
  const iris = lijst.getByRole('button', { name: /Iris/ });

  await expect(tijn).toHaveAttribute('aria-pressed', 'true');
  await expect(iris).toHaveAttribute('aria-pressed', 'false');

  // The one practising cannot be handed the turn again: there is nothing to do
  // and a control that does nothing is a control that lies.
  await expect(tijn).toBeDisabled();
});
