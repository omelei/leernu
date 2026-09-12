import { expect, test, type Page } from '@playwright/test';

/**
 * Flags: the fourth module, and one integration test per way of practising.
 *
 * What is tested here is what only a browser can show: that the page has the
 * shape the other modules have, that each way can be chosen, played to the end
 * and lands in the child's own history. The wrong answers, the sets and the
 * scope of the content are tested without a browser, in
 * `src/game-core/vlaggen.test.ts` and `src/content/vlaggen.content.test.ts`.
 */

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
}

/** Where, what, how, start: the one way into a round, whatever was chosen. */
async function kies(page: Page, regio: string, onderwerp: RegExp, hoe: RegExp) {
  await page.goto('/vlaggen');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const waar = page.getByRole('region', { name: 'Waar op de kaart?' });
  await waar.getByRole('button', { name: regio, exact: true }).click();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await wat.getByRole('button', { name: onderwerp }).click();

  const hoeStap = page.getByRole('region', { name: /Hoe wil je/ });
  await hoeStap.getByRole('button', { name: hoe }).click();
}

async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

/**
 * Plays a round to its end by always taking the first option. Whether that is
 * right does not matter here: a round of flags ends on its last question or on
 * its third life, and both are what is being tested.
 */
async function speel(page: Page) {
  const klaar = page.getByRole('heading', { name: 'Wat er is veranderd' });
  const volgende = page.getByRole('button', { name: 'Volgende vraag' });
  const vlaggen = page.getByRole('group', { name: 'Kies een vlag' });
  const namen = page.getByRole('group', { name: 'Kies een naam' });

  for (let vraag = 0; vraag < 120; vraag++) {
    await expect(klaar.or(volgende).or(vlaggen).or(namen).first()).toBeVisible();
    if (await klaar.isVisible()) return;
    if (await volgende.isVisible()) {
      await volgende.click();
      continue;
    }
    if (await vlaggen.isVisible()) await vlaggen.getByRole('button').first().click();
    else await namen.getByRole('button').first().click();
  }
  throw new Error('De ronde hield niet op.');
}

/** Back to the front door, and the round is in the child's history. */
async function inGeschiedenis(page: Page, set: string) {
  await page.getByRole('button', { name: 'Terug naar start' }).click();
  const recent = page.getByRole('region', { name: 'Recent geoefend' });
  await expect(recent.getByRole('button', { name: new RegExp(set) }).first()).toBeVisible();
}

test('flags have a module page in the shape topography has', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/vlaggen');

  // Where, in the same eight words as topography, opening on the world: flags
  // are mostly other countries', and nothing but the region is chosen for you.
  const waar = page.getByRole('region', { name: 'Waar op de kaart?' });
  await expect(waar.getByRole('button')).toHaveCount(8);
  await expect(waar.getByRole('button', { name: 'Wereld', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Vlaggenmix/ })).toBeVisible();

  // Nederland has one subject and nothing else to choose.
  await waar.getByRole('button', { name: 'Nederland', exact: true }).click();
  await expect(wat.getByRole('button', { name: /^Provincievlaggen/ })).toBeVisible();
  await expect(wat.getByRole('button')).toHaveCount(1);

  await waar.getByRole('button', { name: 'Europa', exact: true }).click();
  for (const naam of ['Bekende vlaggen', 'Alle vlaggen', 'Lijkt op elkaar']) {
    await expect(wat.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  await expect(wat.getByRole('button', { name: /^Vlaggenmix/ })).toHaveCount(0);

  // Four ways and the oefentoets, and no typing: spelling is not the point.
  // A set first, because the ways are the ways of a chosen set.
  await wat.getByRole('button', { name: /^Bekende vlaggen/ }).click();
  const hoe = page.getByRole('region', { name: /Hoe wil je/ });
  for (const naam of ['Vlag zoeken', 'Meerkeuze', 'Ontdekken', 'Overleven', 'Oefentoets']) {
    await expect(hoe.getByRole('button', { name: new RegExp(`^${naam}`) })).toBeVisible();
  }
  await expect(hoe.getByRole('button', { name: /^Zelf typen/ })).toHaveCount(0);

  await waar.getByRole('button', { name: 'Wereld', exact: true }).click();
  await expect(wat.getByRole('button', { name: /^Vlaggenmix/ })).toBeVisible();
});

test('a set of flags has an address, and the page opens on it', async ({ page }) => {
  await signIn(page, 'Daan');
  await page.goto('/vlaggen/europa-bekend');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Bekende vlaggen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('region', { name: 'Waar op de kaart?' }).getByRole('button', { name: 'Europa' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('Vlag zoeken: a name, flags to choose from, and the round in the history', async ({
  page,
}) => {
  await signIn(page, 'Lotte');
  await kies(page, 'Europa', /^Bekende vlaggen/, /^Vlag zoeken/);
  await start(page);

  await expect(page.getByRole('group', { name: 'Kies een vlag' })).toBeVisible();
  // The flags are read out as what they look like, never as their names.
  const eerste = page.getByRole('group', { name: 'Kies een vlag' }).getByRole('button').first();
  await expect(eerste).toHaveAttribute('aria-label', /./);

  await speel(page);
  await inGeschiedenis(page, 'Bekende vlaggen van Europa');
});

test('Meerkeuze: a flag, four names, and the round in the history', async ({ page }) => {
  await signIn(page, 'Sem');
  await kies(page, 'Nederland', /^Provincievlaggen/, /^Meerkeuze/);
  await start(page);

  await expect(page.getByRole('group', { name: 'Kies een naam' }).getByRole('button')).toHaveCount(
    4,
  );
  await speel(page);
  await inGeschiedenis(page, 'Provincievlaggen');
});

test('Overleven: three lives, both ways round, and it ends', async ({ page }) => {
  await signIn(page, 'Mila');
  await kies(page, 'Zuid-Amerika', /^Alle vlaggen/, /^Overleven/);
  await start(page);

  await expect(page.getByText('levens', { exact: true })).toBeVisible();
  await speel(page);
  await inGeschiedenis(page, 'Alle vlaggen van Zuid-Amerika');
});

test('Oefentoets: no answers until the end, and then a mark', async ({ page }) => {
  await signIn(page, 'Jesse');
  await kies(page, 'Afrika', /^Bekende vlaggen/, /^Oefentoets/);
  await start(page);

  await speel(page);
  await expect(page.getByText('cijfer', { exact: true })).toBeVisible();
  await inGeschiedenis(page, 'Bekende vlaggen van Afrika');
});

test('Ontdekken: a flag, where it is, its capital and one fact', async ({ page }) => {
  await signIn(page, 'Fleur');
  await kies(page, 'Europa', /^Alle vlaggen/, /^Ontdekken/);
  await start(page);

  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Nederland', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 2, name: 'Nederland' })).toBeVisible();
  // In the facts, not in the sentence the read-aloud button says, which holds
  // the capital as well.
  await expect(page.getByRole('definition').filter({ hasText: 'Amsterdam' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'De vlag van Nederland' })).toBeVisible();

  // Nothing was asked, so nothing is in the history — and the way out is home.
  await page.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByRole('region', { name: 'Verder oefenen' })).toBeVisible();
});
