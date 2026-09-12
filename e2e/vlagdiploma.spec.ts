import { expect, test, type Page } from '@playwright/test';

/**
 * The vlaggendiploma (ADR-104): six on the flags page with the gaps showing,
 * one press to sit one, nothing said until the end, and the six again on the
 * collection page.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Takes the first option every time until the round is over. */
async function speel(page: Page) {
  const klaar = page.getByRole('heading', { name: 'Wat er is veranderd' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  const vlaggen = page.getByRole('group', { name: 'Kies een vlag' });
  const namen = page.getByRole('group', { name: 'Kies een naam' });

  for (let vraag = 0; vraag < 40; vraag++) {
    try {
      await expect(klaar.or(volgende).or(vlaggen).or(namen).first()).toBeVisible();
    } catch (error) {
      // Say where the round stood, which the locator alone cannot: which
      // question, and what the screen said instead of asking it.
      const scherm = (await page.locator('body').innerText()).slice(0, 1500);
      throw new Error(
        `Vraag ${vraag + 1}: niets om te beantwoorden. Op het scherm:\n${scherm}\n\n${String(error)}`,
      );
    }
    if (await klaar.isVisible()) return;
    // A diploma says nothing until the end, so there is never a "next".
    await expect(volgende).toHaveCount(0);
    if (await vlaggen.isVisible()) await vlaggen.getByRole('button').first().click();
    else await namen.getByRole('button').first().click();
  }
  throw new Error('Het diploma hield niet op.');
}

test('six vlaggendiploma’s, and one press chooses a whole werelddeel to sit', async ({ page }) => {
  await signIn(page, 'Anouk');
  await page.goto('/vlaggen');

  const muur = page.getByRole('region', { name: 'Jouw vlaggendiploma’s' });
  await expect(muur.getByRole('button')).toHaveCount(6);
  await muur.getByRole('button', { name: 'Zuid-Amerika: nog geen vlaggendiploma' }).click();

  const waar = page.getByRole('region', { name: 'Waar op de kaart?' });
  await expect(waar.getByRole('button', { name: 'Zuid-Amerika' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Alle vlaggen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  await expect(hoe.getByRole('button', { name: /^Vlaggendiploma/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // A diploma is its own length.
  await expect(page.getByRole('region', { name: 'Hoeveel vragen?' })).toHaveCount(0);

  await page.locator('.tk-choose-start button').click();
  await speel(page);

  await expect(page.getByText(/^Vlaggendiploma gehaald|^Nog geen diploma/)).toBeVisible();
  await expect(page.getByText('cijfer', { exact: true })).toBeVisible();

  // And on the collection page, as pictures rather than buttons.
  await page.goto('/voortgang');
  const verzameling = page.getByRole('region', { name: 'Jouw vlaggendiploma’s' });
  await expect(verzameling.getByRole('img')).toHaveCount(6);
});
