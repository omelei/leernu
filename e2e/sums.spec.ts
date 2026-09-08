import { expect, test, type Page } from '@playwright/test';

/**
 * Rekenen: the second module, and the first thing in this product that is not a
 * map.
 *
 * What is worth testing here is not the arithmetic — `sums.test.ts` multiplies
 * every one of the hundred and twenty back out — but that the module has an
 * address, that a round of it writes to the same schedule the map writes to,
 * and that the rail exists at all, which it did not while there was one module
 * (ADR-037).
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('heading', { name: `Hoi ${naam}!` })).toBeVisible();
}

async function startTable(page: Page, tafel: number, hoe: RegExp) {
  await page.goto('/tafels');
  await expect(page.getByRole('heading', { name: 'Welke tafel?' })).toBeVisible();

  const wat = page.getByRole('region', { name: /Waarover/ });
  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });

  // Anchored, or "Tafel van 1" also matches ten, eleven and twelve, and the
  // name carries the mastery line after it.
  await wat.getByRole('button', { name: new RegExp(`^Tafel van ${tafel}\\D`) }).click();
  await hoeStap.getByRole('button', { name: hoe }).click();
  await page
    .getByRole('button', { name: /sommen$/ })
    .last()
    .click();
}

test('the rail appears now that there are two modules', async ({ page }) => {
  await signIn(page, 'Sam');

  const rail = page.getByRole('navigation', { name: 'Modules' });
  await expect(rail.getByRole('button', { name: 'Topografie' })).toBeVisible();
  await expect(rail.getByRole('button', { name: 'Tafels' })).toBeVisible();

  // ADR-037 still holds for the rest: a rail entry is an offer, and five of the
  // seven modules have nothing to offer yet.
  await expect(rail.getByRole('button')).toHaveCount(2);
});

test('the tables have an address of their own', async ({ page }) => {
  await signIn(page, 'Roos');
  await page.goto('/tafels');

  await expect(page.getByRole('heading', { name: 'Welke tafel?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Tafel van 7\D/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Tafel van 12\D/ })).toBeVisible();
});

test('rekenen is the word a parent looks for, and it leads to the tables', async ({ page }) => {
  await signIn(page, 'Daan');
  await page.goto('/rekenen');

  // Scoped to the list: the rail carries the same name, and it should — this
  // page is the word a parent types, not a second navigation.
  //
  // Tafels sits under rekenen; klokkijken does not (ADR-044).
  const lijst = page.getByRole('list');
  await lijst.getByRole('button', { name: /Tafels/ }).click();
  await expect(page.getByRole('heading', { name: 'Welke tafel?' })).toBeVisible();
});

test('typing a table: right, wrong, and not knowing', async ({ page }) => {
  await signIn(page, 'Fenna');
  await startTable(page, 2, /Typ het antwoord/);

  const answer = page.getByPlaceholder('Antwoord');
  await expect(answer).toBeFocused();

  // Ten dots for ten sums: a round is the whole table.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');

  await answer.fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();

  // Whatever the sum was, the answer is shown and what the child said is quoted
  // back — a cross beside a number teaches nothing.
  await expect(page.getByRole('status')).toContainText('= ');
  await expect(page.getByRole('status')).toContainText('999');

  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('choosing a table: four numbers, one of them right', async ({ page }) => {
  await signIn(page, 'Joris');
  await startTable(page, 3, /Kies uit vier/);

  const options = page.getByRole('group', { name: 'Kies het antwoord' });
  await expect(options.getByRole('button')).toHaveCount(4);

  await options.getByRole('button').first().click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('a finished table says what changed, not only what was scored', async ({ page }) => {
  await signIn(page, 'Mila');
  await startTable(page, 1, /Typ het antwoord/);

  // The table of one, so every answer is the multiplier itself and the round
  // can be finished honestly rather than by guessing.
  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const antwoord = som.split('×')[1]?.trim() ?? '';

    await page.getByPlaceholder('Antwoord').fill(antwoord);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
  await expect(page.getByText('10 van de 10 goed')).toBeVisible();
  await expect(page.getByText('Alles goed. Morgen komen er nieuwe bij.')).toBeVisible();
});

/**
 * The clock and the lives, over all twelve tables rather than the chosen one.
 * Ten sums is over long before a minute is, and a child who reaches for the
 * clock is one who already knows a table.
 */
test('a survival round of tables runs on lives, not on ten questions', async ({ page }) => {
  await signIn(page, 'Lieke');
  await page.goto('/tafels');
  await page.getByRole('button', { name: 'Overleven', exact: true }).click();

  await expect(page.getByPlaceholder('Antwoord')).toBeVisible();

  // No dots: there is no ten to count towards.
  await expect(page.getByRole('progressbar')).toHaveCount(0);

  const levens = page
    .getByRole('banner')
    .locator('div')
    .filter({ hasText: /^levens\d$/ });
  await expect(levens).toContainText('3');

  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  await expect(levens).toContainText('2');

  // Saying you do not know still costs nothing, here as on the map (ADR-048).
  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(levens).toContainText('2');
});

test('the lightning round is offered only once the clock is on', async ({ page }) => {
  await signIn(page, 'Timo');

  await page.goto('/tafels');
  await expect(page.getByRole('button', { name: 'Bliksemronde', exact: true })).toHaveCount(0);

  const clock = page.getByRole('button', { name: /Klok bij het oefenen/ });
  await page.goto('/jij');
  await clock.click();
  await expect(clock).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/tafels');
  await expect(page.getByRole('button', { name: 'Bliksemronde', exact: true })).toBeVisible();
});
