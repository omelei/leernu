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
  await page.getByRole('button', { name: 'Verder', exact: true }).click();
  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

async function startTable(page: Page, tafel: number, hoe: RegExp) {
  await page.goto('/rekenen');
  await expect(page.getByRole('heading', { name: 'Kies je ronde' })).toBeVisible();

  const wat = page.getByRole('region', { name: /Waarover/ });
  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });

  // Step 1 is five subjects now, and the tables are one of them. Which table is
  // the second, smaller question underneath — a chip whose visible label is the
  // number and whose accessible name is the whole thing (ADR-062).
  // Anchored rather than exact: a subject card's accessible name is everything
  // on it — the name, how it is going, and the line saying what is in it.
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  // Not scoped to step 1 any more: which table is its own numbered step now.
  // Exact, which is what keeps it off the start button and off the diploma
  // wall — both of those name the table inside a longer label.
  await page.getByRole('button', { name: `Tafel van ${tafel}`, exact: true }).click();
  await hoeStap.getByRole('button', { name: hoe }).click();
  await start(page);
}

/** The one way out of K2, whatever was chosen. See e2e/app.spec.ts. */
async function start(page: Page) {
  await page.locator('.ln-start-knop').click();
}

test('Oefenen is the map of the product, not a list of what is finished', async ({ page }) => {
  await signIn(page, 'Sam');
  await page.goto('/oefenen');

  // ADR-051, on S3 now rather than in the rail: every module is a row, the
  // ones not open yet as well — a list with only the built ones would read as
  // the whole product, and a child could not tell what leer.nu is for.
  const lijst = page.getByRole('list', { name: 'Waar wil je in oefenen?' });
  const namen = ['Topografie', 'Tafels', 'Klokkijken', 'Woordjes', 'Spelling', 'Tijdvakken'];
  for (const naam of [...namen, 'Vlaggen']) {
    await expect(lijst.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }

  // And a door that is not open says so rather than opening onto nothing,
  // which is the half of ADR-037 that survives.
  await lijst.getByRole('button', { name: /^Woordjes/ }).click();
  await expect(
    page.getByText('Deze module bestaat nog niet. We zijn hem aan het maken.'),
  ).toBeVisible();
});

test('a new child finds a table to start with on Vandaag, at every size', async ({ page }) => {
  await signIn(page, 'Fien');

  // Before any round, Verder oefenen holds the starters (S2): one set per
  // module, the tables among them.
  const lijst = page.getByRole('region', { name: 'Verder oefenen' });
  // The list is read from IndexedDB and fills in after the first paint; a
  // press before that can land on a card that is about to move.
  await expect(page.locator('.ln-verder')).not.toHaveAttribute('aria-busy', 'true');
  await lijst.getByRole('button', { name: /Tafel van 2/ }).click();

  await expect(page.getByRole('heading', { name: 'Kies je ronde' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tafel van 2', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the tables have an address of their own', async ({ page }) => {
  await signIn(page, 'Roos');
  // The slug still works — it has been written down — and it is the same page.
  await page.goto('/tafels');

  await expect(page.getByRole('heading', { name: 'Kies je ronde' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Kies je ronde' })).toBeVisible();
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
  const wat = page.getByRole('region', { name: /Waarover/ });

  await page.goto('/rekenen/tafel-7');
  await expect(page.getByRole('button', { name: 'Tafel van 7', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // And the subject the chip sits under is open, so the page shows the chips at
  // all rather than opening on the first subject and hiding the one asked for.
  await expect(wat.getByRole('button', { name: /^Tafels/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Topography's cities are one subject with two chips under it now, so an
  // address for one of them has to open the card as well as press the chip
  // (ADR-083).
  await page.goto('/topografie/hoofdsteden');
  await expect(
    page.getByRole('button', { name: 'Hoofdsteden van de provincies', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(wat.getByRole('button', { name: /^Steden/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('typing a table: right, wrong, and not knowing', async ({ page }) => {
  await signIn(page, 'Fenna');
  await startTable(page, 2, /Zelf typen/);

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
  await page.getByPlaceholder('Antwoord').fill('999');
  await page.getByRole('button', { name: 'Kijk na' }).click();
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
  await startTable(page, 1, /Zelf typen/);

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
 * No clock in the learning core (house style v2): time and speed belong to the
 * game forms with a clock, which are not built. So the lightning round is not
 * offered, and Jij has no switch that would bring it back.
 */
test('the lightning round is not offered, and nothing switches it on', async ({ page }) => {
  await signIn(page, 'Timo');

  await page.goto('/rekenen');
  await expect(
    page
      .getByRole('region', { name: /Hoe wil je/ })
      .getByRole('button', { name: /^Bliksemronde\b/ }),
  ).toHaveCount(0);

  await page.goto('/jij');
  await expect(page.getByRole('switch', { name: /Vragen voorlezen/ })).toBeVisible();
  await expect(page.getByRole('switch', { name: /tijd|klok/i })).toHaveCount(0);
});

/**
 * Rekenen is four kinds of sum now, not one.
 *
 * What is worth checking is not that 34 + 9 is 43 — `sums.content.test.ts`
 * works all five hundred of them back out — but that a child can reach each
 * kind, that the page keeps its shape while they do, and that no section ever
 * grows past six cards.
 */
test('rekenen offers six subjects, and never more than six', async ({ page }) => {
  await signIn(page, 'Bram');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Waarover/ });

  for (const naam of [
    'Tafels',
    'Keersommen',
    'Deelsommen',
    'Plussommen',
    'Minsommen',
    'Rekenmix',
  ]) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }

  // Six is the ceiling a section may hold (ADR-061, ADR-062). Rekenen's subjects
  // are chips now (ADR-095) and the step holds nothing else, so the region's
  // buttons are the subjects.
  await expect(wat.getByRole('button')).toHaveCount(6);
});

test('a subject with many sets asks which, instead of showing all of them', async ({ page }) => {
  await signIn(page, 'Sten');
  await page.goto('/rekenen');

  const wat = page.getByRole('region', { name: /Waarover/ });

  // Each second question is a step of its own, named by what it asks, so its
  // answers are the buttons in that region and nothing else — not the chips
  // further down that say how long the round is (ADR-074).
  const welke = (vraag: RegExp) => page.getByRole('region', { name: vraag }).getByRole('button');

  // Twelve tables as a keypad under the subjects (ADR-095), and no mix square
  // among them: the Rekenmix is a subject of its own (ADR-100).
  await wat.getByRole('button', { name: /^Tafels/ }).click();
  await expect(welke(/^Welke tafel/)).toHaveCount(12);

  // The keersommen past the tables, in two ranges.
  await wat.getByRole('button', { name: /^Keersommen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 100', 'tot 1000']);

  // Plus has three ranges, and they are offered smallest first. Sorted as
  // numbers: "1000" falls between "100" and "20" in every alphabet there is.
  await wat.getByRole('button', { name: /^Plussommen/ }).click();
  await expect(welke(/^Tot welk getal/)).toHaveCount(3);
  await expect(welke(/^Tot welk getal/)).toHaveText(['tot 20', 'tot 100', 'tot 1000']);

  // The Rekenmix has three difficulties and an everything, out of the level
  // every set already carried (ADR-073).
  await wat.getByRole('button', { name: /^Rekenmix/ }).click();
  await expect(welke(/^Hoe moeilijk/)).toHaveCount(4);
  await expect(welke(/^Hoe moeilijk/)).toHaveText([
    'Makkelijk',
    'Gemiddeld',
    'Pittig',
    'Door elkaar',
  ]);
});

test('a plus sum is a plus sum, and a division is a division', async ({ page }) => {
  await signIn(page, 'Lieve');
  await page.goto('/rekenen/plus-20');

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
    .click();
  await start(page);

  await expect(page.locator('.tk-sum')).toContainText('+');

  await page.goto('/rekenen/deel-7');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Zelf typen/ })
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

  const wat = page.getByRole('region', { name: /Waarover/ });
  // "Topo-mix" rather than "Mix": the tile says which module's mix it is, the
  // way Rekenmix always did. The address is untouched — /topografie/mix still
  // opens it, because a rename that breaks a link a parent wrote down is a
  // rename that costs somebody a page.
  await expect(wat.getByRole('button', { name: /^Topo-mix/ })).toHaveAttribute(
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
