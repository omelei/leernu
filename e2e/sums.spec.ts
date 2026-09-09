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
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function startTable(page: Page, tafel: number, hoe: RegExp) {
  await page.goto('/rekenen');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });

  // Step 1 is five subjects now, and the tables are one of them. Which table is
  // the second, smaller question underneath — a chip whose visible label is the
  // number and whose accessible name is the whole thing (ADR-062).
  // Anchored rather than exact: a subject card's accessible name is everything
  // on it — the name, how it is going, and the line saying what is in it.
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  await wat.getByRole('button', { name: `Tafel van ${tafel}`, exact: true }).click();
  await hoeStap.getByRole('button', { name: hoe }).click();
  await start(page);
}

/** The one way out of K2, whatever was chosen. See e2e/app.spec.ts. */
async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

test('the rail is the map of the product, not a list of what is finished', async ({
  page,
}, testInfo) => {
  // Not on a phone: §D drops the rail at that size and K1 carries the modules
  // as cards in the flow instead. The test below covers those, at every size.
  test.skip(['iphone', 'android'].includes(testInfo.project.name), 'no rail on a phone');

  await signIn(page, 'Sam');

  // ADR-051. Five doors, of which three are not open yet — a rail with only
  // the two built ones does not read as a short list, it reads as the whole
  // product, and a child could not tell what leer.nu is for.
  const rail = page.getByRole('navigation', { name: 'Modules' });
  await expect(rail.getByRole('button')).toHaveCount(5);

  for (const naam of ['Topo', 'Rekenen', 'Klok', 'Taal', 'Vlaggen']) {
    await expect(rail.getByRole('button', { name: naam, exact: true })).toBeVisible();
  }

  // And a door that is not open says so rather than opening onto nothing,
  // which is the half of ADR-037 that survives.
  await rail.getByRole('button', { name: 'Klok', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Klok' })).toBeVisible();
});

test('the front door lists every module, at every size', async ({ page }) => {
  await signIn(page, 'Fien');

  // The phone has no rail, so this is the only way to a module there — and on
  // a laptop it stands beside the rail, which is what K1 draws.
  const lijst = page.getByRole('region', { name: 'Verder oefenen' });

  for (const naam of ['Rekenen', 'Klok', 'Taal', 'Vlaggen']) {
    await expect(lijst.getByRole('button', { name: new RegExp(naam) })).toBeVisible();
  }

  await lijst.getByRole('button', { name: /Rekenen/ }).click();
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeVisible();
});

test('the tables have an address of their own', async ({ page }) => {
  await signIn(page, 'Roos');
  // The slug still works — it has been written down — and it is the same page.
  await page.goto('/tafels');

  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 7', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 12', exact: true })).toBeVisible();
});

test('rekenen is the word a parent looks for, and it is the page itself', async ({ page }) => {
  await signIn(page, 'Daan');
  await page.goto('/rekenen');

  // A category holding one built module *is* that module. There used to be a
  // page here with a single card on it saying "Rekenen", which charged a child
  // a click to be told what they had already typed. Tafels sits under rekenen;
  // klokkijken sits beside it (ADR-044).
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 3', exact: true })).toBeVisible();
});

/**
 * A set has an address, so a parent can send a child to one exercise rather
 * than to a chooser. The page opens on it rather than on its own first set.
 */
test('a set has an address, and the page opens on it', async ({ page }) => {
  await signIn(page, 'Nienke');

  // Scoped to step 1, because the start button names the chosen set as well —
  // which is what K2 puts it there for, and which makes an unscoped query for
  // the set name ambiguous on exactly the page that opened on it.
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  await page.goto('/rekenen/tafel-7');
  await expect(wat.getByRole('button', { name: 'Tafel van 7', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // And the subject the chip sits under is open, so the page shows the chips at
  // all rather than opening on the first subject and hiding the one asked for.
  await expect(wat.getByRole('button', { name: /^Tafels/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goto('/topografie/hoofdsteden');
  await expect(wat.getByRole('button', { name: /Hoofdsteden/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
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
  await startTable(page, 1, /^Overleven\b/);

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

  const bliksem = page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Bliksemronde\b/ });

  await page.goto('/rekenen');
  await expect(bliksem).toHaveCount(0);

  const clock = page.getByRole('button', { name: /Klok bij het oefenen/ });
  await page.goto('/jij');
  await clock.click();
  await expect(clock).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/rekenen');
  await expect(bliksem).toBeVisible();
});

/**
 * Rekenen is four kinds of sum now, not one.
 *
 * What is worth checking is not that 34 + 9 is 43 — `sums.content.test.ts`
 * works all five hundred of them back out — but that a child can reach each
 * kind, that the page keeps its shape while they do, and that no section ever
 * grows past six cards.
 */
test('rekenen offers five subjects, and never more than six', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  for (const naam of ['Tafels', 'Deelsommen', 'Plussommen', 'Minsommen', 'Rekenmix']) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }

  // Six is the ceiling a section may hold (ADR-061, ADR-062). The chips are
  // buttons in the same region, so this counts the cards themselves.
  await expect(page.locator('.tk-sets > button')).toHaveCount(5);
});

test('a subject with many sets asks which, instead of showing all of them', async ({ page }) => {
  await signIn(page, 'Sten');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });

  // Scoped to step 1: the same chip says how long the round is (ADR-074), and
  // an unscoped count would be counting the answers to two questions at once.
  const chips = wat.locator('.tk-variant-chip');

  // Twelve tables and "door elkaar", as chips under the card. Twelve cards is
  // the page this replaced, and it pushed step 2 off the screen.
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  await expect(chips).toHaveCount(13);

  // Plus has three ranges, and they are offered smallest first. Sorted as
  // numbers: "1000" falls between "100" and "20" in every alphabet there is.
  await wat.getByRole('button', { name: /^Plussommen/ }).click();
  await expect(chips).toHaveCount(3);
  await expect(chips).toHaveText(['tot 20', 'tot 100', 'tot 1000']);

  // The Rekenmix has three difficulties and an everything, out of the level
  // every set already carried (ADR-073).
  await wat.getByRole('button', { name: /^Rekenmix/ }).click();
  await expect(chips).toHaveCount(4);
  await expect(chips).toHaveText(['Makkelijk', 'Gemiddeld', 'Pittig', 'Door elkaar']);
});

test('a plus sum is a plus sum, and a division is a division', async ({ page }) => {
  await signIn(page, 'Lieve');
  await page.goto('/rekenen/plus-20');

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Typ het antwoord/ })
    .click();
  await start(page);

  await expect(page.locator('.tk-sum')).toContainText('+');

  await page.goto('/rekenen/deel-7');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Typ het antwoord/ })
    .click();
  await start(page);

  // The colon Dutch primary school divides with, never the obelus.
  await expect(page.locator('.tk-sum')).toContainText(':');
});

/**
 * The tafeldiploma: the test a child already knows from school, without the
 * stopwatch (ADR-064). Ten sums of one table, in order, and one mistake ends
 * the attempt.
 */
test('a diploma is passed or it is not, and one mistake ends the attempt', async ({ page }) => {
  await signIn(page, 'Guus');

  // Not offered on a mix: there is no diploma for "alle tafels door elkaar".
  await page.goto('/rekenen/mix');
  await expect(
    page.getByRole('region', { name: /Hoe wil je/ }).getByRole('button', { name: /Tafeldiploma/ }),
  ).toHaveCount(0);

  await startTable(page, 1, /Tafeldiploma/);

  // A diploma asks the table straight through, so the first sum is 1 x 1.
  await expect(page.locator('.tk-sum')).toContainText('1 × 1');

  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();
  // The button says what it does: this attempt is over, not "next question".
  await page.getByRole('button', { name: 'Bekijk je poging' }).click();

  await expect(
    page.getByText('Nog geen diploma. Alle tien goed, dan is hij van jou.'),
  ).toBeVisible();
});

test('a diploma passed goes on the wall, where the gaps are the point', async ({ page }) => {
  await signIn(page, 'Sanne');
  await startTable(page, 1, /Tafeldiploma/);

  // The table of one, so every answer is the multiplier itself and the attempt
  // can be passed honestly rather than by guessing.
  for (let n = 1; n <= 10; n++) {
    const som = await page.locator('.tk-sum').innerText();
    const antwoord = som.split('×')[1]?.trim() ?? '';

    await page.getByPlaceholder('Antwoord').fill(antwoord);
    await page.getByRole('button', { name: 'Kijk na' }).click();
    // Right every time, so the button stays "Volgende vraag" — the attempt only
    // ends early on a mistake, and on the tenth it ends because it is over.
    await page.getByRole('button', { name: 'Volgende vraag' }).click();
  }

  await expect(page.getByText('Diploma gehaald: tafel van 1')).toBeVisible();

  await page.goto('/rekenen');
  const muur = page.getByRole('region', { name: /tafeldiploma/i });
  await expect(muur.getByRole('button', { name: 'Tafel van 1: diploma gehaald' })).toBeVisible();
  await expect(muur.getByRole('button', { name: 'Tafel van 7: nog geen diploma' })).toBeVisible();
  await expect(muur).toContainText('1 van de 12 gehaald');
});

/**
 * The Topomix: everything on the map at once, which means the answer layer
 * belongs to the question rather than to the round (ADR-063).
 */
test('the topomix asks about more than one kind of thing in one round', async ({ page }) => {
  await signIn(page, 'Jill');
  await page.goto('/topografie/mix');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /Topomix/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Exploring is one set's own layer and is not offered here — a mix is not
  // where anybody meets a set for the first time.
  await expect(
    page.getByRole('region', { name: /Hoe wil je/ }).getByRole('button', { name: /Ontdekken/ }),
  ).toHaveCount(0);

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);

  // A round starts and asks something. Which of the five sets the first
  // question comes from is the scheduler's business, so this asserts the shape
  // rather than the item.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '15');
});
