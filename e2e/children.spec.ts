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
  await expect(page.getByRole('heading', { name: `Hoi ${naam}!` })).toBeVisible();
}

async function answerOne(page: Page) {
  await page.goto('/');
  const kaart = page.getByRole('article').filter({ hasText: 'Provincies van Nederland' });
  await kaart.getByRole('button', { name: 'Wijs aan' }).click();

  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
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

  // Anne turned up today, so she has a day on the board.
  await page.goto('/');
  await expect(page.getByText('1 dag op rij')).toBeVisible();

  // And one province has left the pile of things she has never seen.
  await page.goto('/onthouden');
  await expect(page.getByRole('table').getByText('nog niet onthouden').first()).toBeVisible();

  await addChild(page, 'Bram');

  // Bram starts at nothing. Not Anne's day, and not Anne's boxes.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoi Bram!' })).toBeVisible();
  await expect(page.getByText('Je begint vandaag')).toBeVisible();

  await page.goto('/onthouden');
  await expect(page.getByRole('table').getByText('nog niet onthouden')).toHaveCount(0);

  // And handing the device back gives Anne hers, unchanged.
  await page.goto('/jij');
  await page.getByRole('button', { name: /Geef Anne de beurt/ }).click();
  await expect(page.getByText('Je oefent als Anne.')).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoi Anne!' })).toBeVisible();
  await expect(page.getByText('1 dag op rij')).toBeVisible();
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
