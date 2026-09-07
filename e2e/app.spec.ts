import { expect, test, type Page } from '@playwright/test';

/**
 * The flows that exist today. Two of them are the point of the local-first
 * decision (ADR-015): progress survives a reload, and it does so without an
 * account.
 */

/** The home screen offers a card per set; this picks one by its name. */
function setCard(page: Page, naam: string) {
  return page.getByRole('article').filter({ hasText: naam });
}

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('heading', { name: `Hoi ${naam}!` })).toBeVisible();
}

test('asks for a name on the first visit and never for anything else', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();

  // The two sentences that used to be asserted here — no adverts, no account
  // needed — are gone (ADR-046). The second stopped being true for the parent
  // the moment they had to sign in, and a claim on the first screen is exactly
  // the kind this product should not be making loosely.
  //
  // What is still asserted is the thing itself rather than the boast about it:
  // no child is asked for anything that would make this an account.
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test('refuses an empty name', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await expect(page.getByRole('alert')).toHaveText('Typ eerst je naam.');
});

test('keeps the profile across a reload, with no sign-in', async ({ page }) => {
  await signIn(page, 'Sanne');
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hoi Sanne!' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
});

test('plays a round: question, map, answer, feedback', async ({ page }) => {
  await signIn(page, 'Noor');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();

  // The question arrives with the map, not before it.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  // All twelve provinces are reachable as controls, not just drawn.
  for (const naam of ['Groningen', 'Fryslân', 'Zeeland', 'Limburg']) {
    await expect(page.getByRole('button', { name: naam })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Limburg' }).click();

  // Feedback appears and offers the way on.
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();
});

test('announces the question and the outcome to a screen reader', async ({ page }) => {
  await signIn(page, 'Fatima');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();

  const live = page.getByRole('status');
  await expect(live).toContainText('Waar ligt');

  await page.getByRole('button', { name: 'Limburg' }).click();
  // Either outcome is fine; what matters is that one of them is spoken.
  await expect(live).toContainText(/goed\.|ligt hier\./);
});

test('every button meets the 48px touch target', async ({ page }) => {
  await page.goto('/');

  for (const control of await page.getByRole('button').all()) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});

test('asks about every province, and lets a child stop early', async ({ page }) => {
  await signIn(page, 'Jesse');
  await setCard(page, 'Provincies van Nederland').getByRole('button', { name: 'Wijs aan' }).click();

  // Twelve provinces means twelve questions, not a sample of ten. The dots say
  // so, and say it to a screen reader too.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '12');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'vraag 1 van 12');

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('heading', { name: /goed/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();
});

test('practises the capitals as points on the map', async ({ page }) => {
  await signIn(page, 'Amir');
  await setCard(page, 'Hoofdsteden van de provincies')
    .getByRole('button', { name: 'Wijs aan' })
    .click();

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // Cities are points, and each one carries a 48px target of its own.
  await expect(page.getByRole('button', { name: 'Maastricht' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leeuwarden' })).toBeVisible();
});

test('typing a name: a real place from elsewhere is a near miss, not a cross', async ({ page }) => {
  await signIn(page, 'Roos');
  await setCard(page, 'Provincies van Nederland')
    .getByRole('button', { name: 'Typ de naam' })
    .click();

  // The map shows which area is meant; it does not say its name.
  await expect(page.getByRole('heading', { name: 'Hoe heet dit gebied?' })).toBeVisible();

  const answer = page.getByPlaceholder('Naam');
  await expect(answer).toBeFocused();

  // A different real province: wrong, but named as something that exists.
  await answer.fill('Zeeland');
  await page.getByRole('button', { name: 'Kijk na' }).click();

  const feedback = page.getByRole('status');
  await expect(feedback).toContainText(/Bijna|goed\./);
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

/**
 * The cities set is the first one where the map cannot show everything it
 * knows. Eighty points on the Netherlands puts Beverwijk six pixels from
 * Heemskerk, so reachablePoints draws only the ones a finger can separate. This
 * is the test that would catch that rule being removed: a screen that renders
 * all eighty is not a harmless regression, it is a map a child cannot answer.
 */
test('cities: draws only points that are far enough apart to hit', async ({ page }) => {
  await signIn(page, 'Bram');
  await setCard(page, 'Steden van Nederland').getByRole('button', { name: 'Wijs aan' }).click();

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();

  const markers = page.locator('svg [role="button"]');
  const count = await markers.count();
  expect(count).toBeGreaterThan(5);
  expect(count).toBeLessThan(60);

  const boxes = await markers.evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { cx: x + width / 2, cy: y + height / 2 };
    }),
  );

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const gap = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      expect(gap, `twee steden op ${gap.toFixed(0)} px van elkaar`).toBeGreaterThanOrEqual(40);
    }
  }
});

/** A round of eighty would be twenty minutes. It is capped, and the counter says so. */
test('cities: asks a round a child can finish', async ({ page }) => {
  await signIn(page, 'Fenna');
  await setCard(page, 'Steden van Nederland').getByRole('button', { name: 'Wijs aan' }).click();

  // Fifteen questions, not eighty: a set larger than a round is sampled from
  // (ADR-022), and the dots are what say how many are coming.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '15');
});

/**
 * Explore exists because being asked is not the same as being taught. It must
 * therefore teach without scoring: nothing it does may reach the scheduler, or
 * the retention figure on the home screen starts describing browsing rather
 * than knowing.
 */
test('explore names a city, places it, and scores nothing', async ({ page }) => {
  await signIn(page, 'Joris');
  await setCard(page, 'Steden van Nederland').getByRole('button', { name: 'Ontdek' }).click();

  // Scoped to main: the live region for screen readers carries the same words,
  // and it should — that is how a child who cannot see the panel hears it.
  const kaartkant = page.getByRole('main');
  await expect(kaartkant.getByText('Kies iets uit de lijst of tik op de kaart.')).toBeVisible();

  await page.getByRole('navigation').getByRole('button', { name: 'Nijmegen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nijmegen' })).toBeVisible();
  await expect(kaartkant.getByText('Nijmegen ligt in de provincie Gelderland.')).toBeVisible();

  await page.getByRole('button', { name: 'Klaar' }).click();

  // Back on the home screen the set is still untouched: browsing is not practice.
  await expect(setCard(page, 'Steden van Nederland')).toContainText('nog niet geoefend');
});

/** Answers the current province question wrongly, whatever it happens to be. */
async function answerWrongly(page: Page) {
  const vraag = await page.getByRole('heading', { name: /Waar ligt / }).textContent();
  const fout = vraag?.includes('Limburg') ? 'Groningen' : 'Limburg';
  await page.locator('svg').getByRole('button', { name: fout, exact: true }).click();
}

/**
 * The bliksemronde adds a clock and takes away the Volgende button. Both matter:
 * a timed round where a child pays for a button press with their own seconds is
 * a timed round that measures the wrong thing.
 */
test('bliksemronde runs a clock and moves on by itself', async ({ page }) => {
  await signIn(page, 'Sem');
  await setCard(page, 'Provincies van Nederland')
    .getByRole('button', { name: 'Bliksemronde' })
    .click();

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // Sixty seconds reads as 1:00, so the first tick a test can see is not 0:xx.
  await expect(page.getByText(/^[01]:[0-5]\d$/)).toBeVisible();

  await answerWrongly(page);
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toHaveCount(0);

  // No click of ours: the round advances on its own after showing the answer.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible({ timeout: 5000 });
});

/** Overleven ends when the lives do, and a life is lost only for a wrong answer. */
test('overleven spends a life on a wrong answer', async ({ page }) => {
  await signIn(page, 'Lieke');
  await setCard(page, 'Provincies van Nederland')
    .getByRole('button', { name: 'Overleven' })
    .click();

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  const levens = page
    .getByRole('banner')
    .locator('div')
    .filter({ hasText: /^levens\d$/ });
  await expect(levens).toContainText('3');

  await answerWrongly(page);
  await expect(levens).toContainText('2');

  await page.getByRole('button', { name: 'Volgende vraag' }).click();
  await answerWrongly(page);
  await expect(levens).toContainText('1');
});
