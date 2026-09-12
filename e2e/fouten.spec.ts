import { expect, test, type Page } from '@playwright/test';

/**
 * "Oefen je fouten" on the map and on the clock (ADR-103).
 *
 * A child who says "ik weet het niet" has not known it, and the boxes record
 * that as a mistake — so a round answered that way is the quickest honest way
 * to five of them. After it, the list is on the page it was made on.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function kies(page: Page, pad: string, onderwerp: RegExp, hoe: RegExp) {
  await page.goto(pad);
  await page
    .getByRole('region', { name: /Waarover/ })
    .getByRole('button', { name: onderwerp })
    .click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: hoe })
    .click();
  await page.locator('.ln-start-knop').click();
}

/** Says "ik weet het niet" to every question, to the end of the round. */
async function weetHetNiet(page: Page) {
  const klaar = page.getByRole('button', { name: 'Terug naar start' });
  const weetNiet = page.getByRole('button', { name: 'Ik weet het niet' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });

  for (let vraag = 0; vraag < 40; vraag++) {
    await expect(klaar.or(volgende).or(weetNiet).first()).toBeVisible();
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) await volgende.click();
    else await weetNiet.click();
  }
  throw new Error('De ronde hield niet op.');
}

test('the clock offers the faces you did not know', async ({ page }) => {
  await signIn(page, 'Ties');
  const wat = page.getByRole('region', { name: /Waarover/ });

  await page.goto('/klokkijken');
  await expect(wat.getByRole('button', { name: /^Oefen je fouten/ })).toHaveCount(0);

  await kies(page, '/klokkijken', /^Hele uren/, /^Meerkeuze/);
  await weetHetNiet(page);

  await page.goto('/klokkijken');
  await wat.getByRole('button', { name: /^Oefen je fouten/ }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Meerkeuze/ })
    .click();
  await page.locator('.ln-start-knop').click();
  await expect(page.getByRole('group', { name: 'Kies hoe laat het is' })).toBeVisible();
});

test('topography offers the places you did not know, on their own map', async ({ page }) => {
  await signIn(page, 'Isa');
  await kies(page, '/topografie', /^Provincies/, /^Meerkeuze/);
  await weetHetNiet(page);

  await page.goto('/topografie');
  const wat = page.getByRole('region', { name: /Waarover/ });
  await expect(wat.getByRole('button', { name: /^Oefen je fouten/ })).toBeVisible();

  // And it has an address, the one word, like the mix.
  await page.goto('/topografie/fouten');
  await expect(wat.getByRole('button', { name: /^Oefen je fouten/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
