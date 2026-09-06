import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility, checked on the screens Lighthouse cannot reach.
 *
 * Lighthouse loads one URL and scores it. This product's hardest screen is
 * three clicks in and is a picture — a map where every province is a control —
 * so the screen most likely to fail is the one an automated first-load audit
 * never sees. These run axe on each screen in turn instead.
 *
 * Automated checks catch perhaps a third of what matters. They are here to stop
 * regressions, not to certify: a keyboard pass on a real device is still the
 * thing that finds the rest, and spec section 8 asks for that too.
 */

async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('heading', { name: `Hoi ${naam}!` })).toBeVisible();
}

function setCard(page: Page, naam: string) {
  return page.getByRole('article').filter({ hasText: naam });
}

test('the name screen has no violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();

  const results = await scan(page);
  expect(results.violations).toEqual([]);
});

test('the home screen has no violations', async ({ page }) => {
  await signIn(page, 'Iris');

  const results = await scan(page);
  expect(results.violations).toEqual([]);
});

test('the map has no violations while asking, and none while showing the answer', async ({
  page,
}) => {
  await signIn(page, 'Bram');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);

  // The revealed state is a different screen in every way that matters: colours
  // change, focus moves, and a panel appears.
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the typing mode has no violations', async ({ page }) => {
  await signIn(page, 'Sem');
  await setCard(page, 'Provincies van Nederland')
    .getByRole('button', { name: 'Typ de naam' })
    .click();
  await expect(page.getByPlaceholder('Naam')).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the capitals map has no violations', async ({ page }) => {
  await signIn(page, 'Lotte');
  await setCard(page, 'Hoofdsteden van de provincies')
    .getByRole('button', { name: 'Wijs aan' })
    .click();
  await expect(page.getByRole('button', { name: 'Maastricht' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

test('the result screen has no violations', async ({ page }) => {
  await signIn(page, 'Yara');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();

  expect((await scan(page)).violations).toEqual([]);
});

/**
 * Not an axe check: axe cannot tell whether a keyboard can actually get
 * anywhere. This walks the map the way a child without a mouse would.
 */
test('a keyboard reaches the map and can answer with it', async ({ page }) => {
  await signIn(page, 'Kees');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  // Tab from the top of the page until a province takes focus, and give up
  // rather than loop forever if the map turns out to be unreachable.
  let reached: string | null = null;
  for (let i = 0; i < 30 && reached === null; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName.toLowerCase() === 'path'
        ? active.getAttribute('aria-label')
        : null;
    });
  }

  expect(reached, 'no province could be reached with the keyboard').not.toBeNull();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  // Focus follows the answer, so a child does not tab back through twelve
  // provinces to carry on.
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeFocused();
});
