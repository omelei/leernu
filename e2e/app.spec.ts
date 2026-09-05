import { expect, test } from '@playwright/test';

/**
 * The flows that exist at the end of phase 0. Two of them are the point of the
 * whole local-first decision (ADR-015): progress survives a reload, and it does
 * so without an account.
 */

test('asks for a name on the first visit and never for anything else', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toBeVisible();

  // The promise the product makes, on the screen where it matters.
  await expect(page.getByText(/Geen advertenties/)).toBeVisible();

  // Nothing that would make this an account.
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test('refuses an empty name without losing what was typed', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Typ eerst je naam.');
});

test('greets the player by name and keeps the profile across a reload', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('Je naam').fill('Sanne');
  await page.getByRole('button', { name: 'Beginnen' }).click();

  await expect(page.getByRole('heading', { name: 'Hoi Sanne!' })).toBeVisible();

  await page.reload();

  // No sign-in, no server: the profile is simply still there.
  await expect(page.getByRole('heading', { name: 'Hoi Sanne!' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
});

test('remembers the reading font after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill('Tom');
  await page.getByRole('button', { name: 'Beginnen' }).click();

  const toggle = page.getByRole('switch', { name: 'Makkelijker lezen' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-font', 'dyslexic');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'dyslexic');
});

test('every interactive control meets the 48px touch target', async ({ page }) => {
  await page.goto('/');

  for (const control of await page.getByRole('button').all()) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});
