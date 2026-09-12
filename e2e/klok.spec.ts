import { expect, test, type Page } from '@playwright/test';

/**
 * Klokkijken: the third module, and the first one that asks in two directions.
 *
 * What is worth testing here is not the arithmetic of a clock face —
 * `klok.test.ts` and `klok.content.test.ts` work all hundred and forty-four
 * back out — but that the module has a page in the shape the other two have,
 * that its steps have addresses, and that both directions of the exercise are
 * actually reachable from step 2.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Step 1, step 2, start. The one way into a round, whatever was chosen. */
async function startKlok(page: Page, onderwerp: RegExp, hoe: RegExp) {
  await page.goto('/klokkijken');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });

  await wat.getByRole('button', { name: onderwerp }).click();
  await hoeStap.getByRole('button', { name: hoe }).click();
  await page.locator('.tk-choose-start button').click();
}

test('the clock has a module page in the same shape as the other two', async ({ page }) => {
  await signIn(page, 'Sanne');
  await page.goto('/klokkijken');

  // Four steps and a mix, one set each. No region row — a clock is not
  // anywhere — and no chips, because no subject here holds more than one set.
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  for (const naam of ['Hele uren', 'Halve uren', 'Kwartieren', 'Vijf minuten', 'Klokmix']) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Waar op de kaart?' })).toHaveCount(0);

  // Step 2 is five ways, and the two that read the face come before the one
  // that reads it backwards. The clock and the lives are off by default (K10),
  // so four of the five are on the page.
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Meerkeuze/ })).toBeVisible();
  await expect(hoe.getByRole('button', { name: /^Klok zoeken/ })).toBeVisible();
  await expect(hoe.getByRole('button', { name: /^Zelf typen/ })).toBeVisible();
});

test('the clock answers to the short word as well as its own', async ({ page }) => {
  await signIn(page, 'Bram');

  // "Klok" is what the rail says and what a child would type. Both land here.
  await page.goto('/klok');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Kwartieren/ })).toBeVisible();
});

test('a step of the clock has an address, and the page opens on it', async ({ page }) => {
  await signIn(page, 'Iris');
  await page.goto('/klokkijken/kwartieren');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Kwartieren/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('reading a face: a clock on the stage and four times to choose from', async ({ page }) => {
  await signIn(page, 'Fem');
  await startKlok(page, /^Halve uren/, /^Meerkeuze/);

  // The face is where the map goes on topografie and the sum on rekenen.
  await expect(page.locator('.tk-klok').first()).toBeVisible();

  const opties = page.getByRole('group', { name: 'Kies hoe laat het is' });
  await expect(opties.getByRole('button')).toHaveCount(4);
  // Written out, because the difference between "7:30" and "half acht" is the
  // whole exercise — an option reading "half 8" would do the reading for them.
  await expect(opties.getByRole('button').first()).toContainText(/[a-z]/);

  await opties.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  // Whatever the time was, the answer is given in both notations.
  await expect(page.getByRole('status')).toContainText(':');
});

test('the other direction: a time in words and four faces to point at', async ({ page }) => {
  await signIn(page, 'Loes');
  await startKlok(page, /^Hele uren/, /^Klok zoeken/);

  // Four clocks, and the question is the sentence above them rather than a
  // picture. This is the half of clock reading a child who has learned to
  // recognise twelve pictures has never been asked.
  const klokken = page.getByRole('group', { name: 'Welke klok is dit?' });
  await expect(klokken.getByRole('button')).toHaveCount(4);

  await klokken.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('typing a time takes every way a child writes one', async ({ page }) => {
  await signIn(page, 'Nout');
  await startKlok(page, /^Hele uren/, /^Zelf typen/);

  const antwoord = page.getByPlaceholder('7:30');
  await expect(antwoord).toBeFocused();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');

  // Without a colon, which `judgeKlok` takes: a child who typed "100" knows
  // what time it is, and failing them for a separator would be measuring the
  // keyboard. Right or wrong, the answer comes back in both notations.
  await antwoord.fill('100');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  await expect(page.getByRole('status')).toContainText(':');

  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('the clock is a row on Oefenen like the other modules', async ({ page }) => {
  await signIn(page, 'Timo');

  // The rail holds the four places now; the modules are the rows of Oefenen.
  await page.goto('/oefenen');
  await page.getByRole('button', { name: /^Klokkijken/ }).click();

  // A door that is open opens onto the chooser, not onto "binnenkort".
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(page).toHaveURL(/\/klok$/);
});
