import { expect, test, type Page } from '@playwright/test';

/**
 * The flows that exist today. Two of them are the point of the local-first
 * decision (ADR-015): progress survives a reload, and it does so without an
 * account.
 */

/**
 * Into a round, through K2.
 *
 * The front door no longer carries a card per set: K1 gives it one thing to
 * continue and a list of modules, and choosing which set is step 1 of K2. So a
 * test that wants a particular set goes where a child goes.
 *
 * The two steps are named regions and the queries are scoped to them, because
 * the set name is on the start button as well — which is what K2 puts it there
 * for.
 */
async function startRound(page: Page, set: RegExp, way: RegExp) {
  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  const what = page.getByRole('region', { name: /Kies een onderwerp/ });
  const how = page.getByRole('region', { name: /Hoe wil je/ });

  await what.getByRole('button', { name: set }).click();
  await how.getByRole('button', { name: way }).click();
  await start(page);
}

/**
 * The one way out of K2, whatever was chosen.
 *
 * Located by its wrapper rather than by its label on purpose: the label is the
 * combination in words and its measure comes from the round — "· 15 vragen",
 * "· 60 seconden", "· 3 levens", or nothing at all for exploring. A test that
 * matched on "vragen" was quietly asserting which modes exist.
 */
async function start(page: Page) {
  await page.locator('.tk-choose-start button').click();
}

/**
 * The lightning round is only offered when the clock is switched on, and it is
 * off by default (K10). Turning it on is part of getting there, so this tests
 * the setting as well as the round.
 *
 * The switch moves only once the write has landed, so waiting for it to read as
 * on is waiting for IndexedDB. The reload then proves the value survives the
 * page rather than the render.
 */
async function turnTheClockOn(page: Page) {
  const clock = page.getByRole('button', { name: /Klok bij het oefenen/ });

  await page.goto('/jij');
  await expect(clock).toHaveAttribute('aria-pressed', 'false');

  await clock.click();
  await expect(clock).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(clock).toHaveAttribute('aria-pressed', 'true');
}

/**
 * A round with a clock or with lives on it.
 *
 * These were chips that started a round the moment they were pressed. They are
 * ways of practising like the other four now, so getting into one is the same
 * three steps as anything else — which is the point: the two heaviest rounds
 * in the product were the only two nobody read a description of first.
 */
async function startChallenge(page: Page, naam: string) {
  await startRound(page, /Provincies van Nederland/, new RegExp(`^${naam}\\b`));
}

async function signIn(page: Page, naam: string) {
  await page.goto('/');
  await page.getByPlaceholder('Je naam').fill(naam);
  await page.getByRole('button', { name: 'Beginnen' }).click();

  // The name is in the app bar now, beside the streak — K1 puts the profile
  // switch top right, so that is where "you are signed in" is visible.
  await expect(page.getByRole('banner').getByRole('button', { name: naam })).toBeVisible();
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

  await expect(page.getByRole('banner').getByRole('button', { name: 'Sanne' })).toBeVisible();
  await expect(page.getByPlaceholder('Je naam')).toHaveCount(0);
});

/**
 * K1 greets the child by the name they typed, and the front door is the first
 * place that name is worth anything: a profile that is not an account still has
 * to be visibly theirs.
 */
test('greets the child by name on the front door', async ({ page }) => {
  await signIn(page, 'Bo');
  await expect(page.getByRole('heading', { name: 'Welkom Bo!' })).toBeVisible();
});

/**
 * The subject of the soonest test is not decoration: it decides what "Ga
 * verder" carries on with. A child practising for Tuesday's tables should be
 * offered tables, whatever they happened to do last night.
 *
 * There can be more than one test now (ADR-077), so this also checks the thing
 * that makes a list a plan rather than a calendar: the soonest one wins.
 */
test('the subject of the soonest test decides what to carry on with', async ({ page }) => {
  await signIn(page, 'Tijn');

  // With no test set, it is the set touched most recently — and on a first
  // visit that is the way in the content calls the way in.
  await expect(page.getByRole('button', { name: 'Ga verder met Topo' })).toBeVisible();

  await addTest(page, '2099-01-10', 'tafels');
  await expect(page.getByRole('button', { name: 'Ga verder met Rekenen' })).toBeVisible();

  // A second test, earlier than the first. The plan follows the soonest one.
  await addTest(page, '2099-01-05', 'topo');
  await expect(page.getByRole('button', { name: 'Ga verder met Topo' })).toBeVisible();

  // And it is a device setting, so it survives the page rather than the render.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ga verder met Topo' })).toBeVisible();

  // Both are on the list, and taking the soonest one off puts the other back
  // in charge — which is the whole of what makes a list a plan.
  await expect(page.getByRole('button', { name: /^Haal de toets weg/ })).toHaveCount(2);

  await page.getByRole('button', { name: /^Haal de toets weg/ }).first().click();
  await expect(page.getByRole('button', { name: 'Ga verder met Rekenen' })).toBeVisible();
});

/** One test, through the block that is now a list with a form under it. */
async function addTest(page: Page, date: string, subject: string) {
  await page.getByRole('button', { name: 'Toets toevoegen' }).click();
  await page.getByLabel('Wanneer is de toets?').fill(date);
  await page.getByLabel('Voor welk vak?').selectOption(subject);
  await page.getByRole('button', { name: 'Toevoegen', exact: true }).click();
}

test('logs the round that was just played, with its mark', async ({ page }) => {
  await signIn(page, 'Jamie');

  const recent = page.getByRole('region', { name: 'Recent geoefend' });
  const favourites = page.getByRole('region', { name: 'Jouw favorieten' });

  // Before the first round both are empty, and both say so rather than
  // standing there as headings over nothing.
  await expect(
    recent.getByText('Nog niets geoefend. Na je eerste ronde staat het hier.'),
  ).toBeVisible();
  await expect(
    favourites.getByText('Nog geen favorieten. Wat je vaak oefent, komt hier te staan.'),
  ).toBeVisible();

  await startRound(page, /Provincies van Nederland/, /Aanwijzen/);
  await page.getByRole('button', { name: 'Limburg' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('button', { name: 'Terug naar start' }).click();

  // One answer, so the mark is a 10,0 or a 1,0 and never anything between —
  // which is exactly what "over what was answered" means.
  const tegel = recent.getByRole('button', { name: /Provincies van Nederland/ });
  await expect(tegel).toContainText(/cijfer\s*(10,0|1,0)/);
  await expect(tegel).toContainText('Aanwijzen');

  // And it went into the column on the right as a way straight back in.
  await expect(favourites.getByRole('button', { name: /Provincies van Nederland/ })).toBeVisible();

  // The tile is the shortcut it looks like: same set, same way, no chooser.
  await tegel.click();
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
});

/**
 * The animal a child picks is theirs, so it has to stick — and it has to show
 * somewhere other than the card it was chosen on, or it does not look saved.
 *
 * It is on "Jij" now rather than in the column on the right (ADR-067). Six of
 * the twelve are open from the first minute of level one; the other six arrive
 * one per level, and this checks both halves of that — that a reached one can
 * be chosen, and that one further up the ladder cannot.
 */
test('the animal a child picks is theirs, and follows them', async ({ page }) => {
  await signIn(page, 'Puk');
  await page.goto('/ontdekkingsreis');

  const dieren = page.getByRole('region', { name: 'Dieren' });
  await dieren.getByRole('button', { name: 'Vos', exact: true }).click();
  await expect(dieren.getByRole('button', { name: 'Vos', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Level one, so the dragon is not hidden — it is there, faded, saying what it
  // costs. A collection with an invisible end is a mystery, not a ladder. It is
  // not a button either: a control a child cannot use is a question they have to
  // ask somebody about.
  await expect(dieren.getByRole('button', { name: /^Draak/ })).toHaveCount(0);
  await expect(dieren.getByLabel(/Draak in zwart, vanaf niveau \d+/)).toBeVisible();

  // It belongs to the child, not to the page: it survives a reload.
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Jouw dieren' })
      .getByRole('button', { name: 'Vos', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('plays a round: question, map, answer, feedback', async ({ page }) => {
  await signIn(page, 'Noor');
  await startRound(page, /Provincies van Nederland/, /Aanwijzen/);

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
  await startRound(page, /Provincies van Nederland/, /Aanwijzen/);

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
  await startRound(page, /Provincies van Nederland/, /Aanwijzen/);

  // Twelve provinces means twelve questions, not a sample of ten. The dots say
  // so, and say it to a screen reader too.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '12');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'vraag 1 van 12');

  await page.getByRole('button', { name: 'Stoppen' }).click();
  // K8: the heading is what changed, and the score is a line underneath it.
  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terug naar start' })).toBeVisible();
});

test('practises the capitals as points on the map', async ({ page }) => {
  await signIn(page, 'Amir');
  await startRound(page, /Hoofdsteden van de provincies/, /Aanwijzen/);

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // Cities are points, and each one carries a 48px target of its own.
  await expect(page.getByRole('button', { name: 'Maastricht' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leeuwarden' })).toBeVisible();
});

/**
 * Multiple choice, K5. The question is the one typing asks — the map shows the
 * area and does not name it — and the four names below it are where the mode
 * earns its place in the order: three of them are neighbours, so a child who
 * knows roughly where they are still has to know which.
 */
test('multiple choice offers four names, three of them wrong', async ({ page }) => {
  await signIn(page, 'Daan');
  await startRound(page, /Provincies van Nederland/, /Kies uit vier namen/);

  await expect(page.getByRole('heading', { name: 'Hoe heet dit gebied?' })).toBeVisible();

  const options = page.getByRole('group', { name: 'Kies de naam' });
  await expect(options.getByRole('button')).toHaveCount(4);

  // There is nothing to type and nothing to point at: the map is on show.
  await expect(page.getByPlaceholder('Naam')).toHaveCount(0);

  await options.getByRole('button').first().click();

  // Either outcome is a real answer, and both move the round on.
  await expect(page.getByRole('status')).toContainText(/goed\.|ligt hier\./);
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('typing a name: a real place from elsewhere is a near miss, not a cross', async ({ page }) => {
  await signIn(page, 'Roos');
  await startRound(page, /Provincies van Nederland/, /Typ de naam/);

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
  await startRound(page, /Steden van Nederland/, /Aanwijzen/);

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
  await startRound(page, /Steden van Nederland/, /Aanwijzen/);

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
  await startRound(page, /Steden van Nederland/, /Ontdek/);

  // Scoped to main: the live region for screen readers carries the same words,
  // and it should — that is how a child who cannot see the panel hears it.
  const kaartkant = page.getByRole('main');
  await expect(kaartkant.getByText('Kies iets uit de lijst of tik op de kaart.')).toBeVisible();

  await page.getByRole('navigation').getByRole('button', { name: 'Nijmegen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nijmegen' })).toBeVisible();
  await expect(kaartkant.getByText('Nijmegen ligt in de provincie Gelderland.')).toBeVisible();

  await page.getByRole('button', { name: 'Klaar' }).click();

  // The set is still untouched: browsing is not practice. Asked on K2, where
  // the sets live now.
  await page.goto('/topografie');
  const steden = page
    .getByRole('region', { name: /Kies een onderwerp/ })
    .getByRole('button', { name: /Steden van Nederland/ });
  await expect(steden).toContainText('nog niet geoefend');
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
  await turnTheClockOn(page);
  await startChallenge(page, 'Bliksemronde');

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // Sixty seconds reads as 1:00, so the first tick a test can see is not 0:xx.
  await expect(page.getByText(/^[01]:[0-5]\d$/)).toBeVisible();

  await answerWrongly(page);
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toHaveCount(0);

  // No click of ours: the round advances on its own after showing the answer.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible({ timeout: 5000 });
});

/**
 * "Ik weet het niet", drawn on K3 at every size. It is the one control that
 * lets a child stop guessing, so what matters is that it shows the answer and
 * that pressing it is cheaper than a guess — see ADR-048 for why.
 */
test('a child can say they do not know, and is shown the answer', async ({ page }) => {
  await signIn(page, 'Pim');
  await startRound(page, /Provincies van Nederland/, /Aanwijzen/);
  await expect(page.getByRole('button', { name: 'Limburg' })).toBeVisible();

  await page.getByRole('button', { name: 'Ik weet het niet' }).click();

  await expect(page.getByRole('status')).toContainText('ligt hier.');
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();
});

test('saying you do not know costs no life', async ({ page }) => {
  await signIn(page, 'Nora');
  await startChallenge(page, 'Overleven');

  const levens = page
    .getByRole('banner')
    .locator('div')
    .filter({ hasText: /^levens\d$/ });
  await expect(levens).toContainText('3');

  await page.getByRole('button', { name: 'Ik weet het niet' }).click();
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toBeVisible();

  // A wrong guess costs one; this does not, or nobody would ever press it.
  await expect(levens).toContainText('3');
});

/** Overleven ends when the lives do, and a life is lost only for a wrong answer. */
test('overleven spends a life on a wrong answer', async ({ page }) => {
  await signIn(page, 'Lieke');
  await startChallenge(page, 'Overleven');

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
