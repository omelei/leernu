import { expect, test, type Page } from '@playwright/test';

/**
 * The flows that exist today. Two of them are the point of the local-first
 * decision (ADR-015): progress survives a reload, and it does so without an
 * account.
 */

/** The three topography sets these flows use, as the path through step 1. */
const PROVINCIES: Keuze = [/^Provincies/];
const HOOFDSTEDEN: Keuze = [/^Steden/, /^Hoofdsteden van de provincies$/];
const STEDEN: Keuze = [/^Steden/, /^Steden van Nederland$/];

/**
 * Step 1 of K2, which is two decisions where a subject holds more than one set.
 *
 * Topography's subjects are one word each now, and where on the map is asked
 * above them (ADR-083): "Provincies" rather than "Provincies van Nederland",
 * and the twelve capitals and the eighty cities are two chips under one card
 * called "Steden". So the path to a set is a card, and sometimes a chip after
 * it — which is exactly the path a child takes.
 */
type Keuze = readonly [RegExp] | readonly [RegExp, RegExp];

async function kiesOnderwerp(page: Page, [vak, chip]: Keuze) {
  const what = page.getByRole('region', { name: /Kies een onderwerp/ });

  // First rather than exact: after the card is pressed its chips are in the
  // same region, and a chip's accessible name is the set's full name.
  await what.getByRole('button', { name: vak }).first().click();
  // The chips are a numbered step of their own now, not a caption inside step
  // 1, so they are no longer in that region. The chip patterns are anchored at
  // both ends, which is what keeps them off the start button — that one names
  // the set too, inside a longer sentence.
  if (chip) await page.getByRole('button', { name: chip }).click();
}

/**
 * Into a round, through K2.
 *
 * The front door no longer carries a card per set: K1 gives it the tests, the
 * exercises this child goes back to, and a list of modules — choosing which set
 * is step 1 of K2. So a test that wants a particular set goes where a child
 * goes.
 *
 * The steps are named regions and the queries are scoped to them, because the
 * set name is on the start button as well — which is what K2 puts it there for.
 */
async function startRound(page: Page, set: Keuze, way: RegExp, toetsstand = false) {
  await page.goto('/topografie');
  await expect(page.getByRole('heading', { name: /^Wat wil je oefenen,/ })).toBeVisible();

  await kiesOnderwerp(page, set);
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: way })
    .click();
  if (toetsstand) await page.getByRole('button', { name: /^Oefentoets/ }).click();
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
  await startRound(page, PROVINCIES, new RegExp(`^${naam}\\b`));
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
 * The subject of the soonest test is not decoration: it is the subject the
 * front door's one accented block is about, and the block wears that module's
 * accent to say so.
 *
 * There can be more than one test (ADR-077), so this also checks the thing that
 * makes a list a plan rather than a calendar: the soonest one wins.
 *
 * It used to be asserted through "Ga verder met Rekenen", the card that stood
 * between the test block and the log. That card is gone (ADR-082) and the rule
 * it demonstrated is not, so the assertion moved to where the rule still shows.
 */
test('the soonest test decides what the block on the front door is about', async ({ page }) => {
  await signIn(page, 'Tijn');
  const toetsblok = page.locator('.tk-card-accented');

  // With no test set there is no subject, so the block takes no accent at all
  // rather than guessing at one.
  await expect(toetsblok).not.toHaveAttribute('data-module', /\w/);

  await addTest(page, '2099-01-10', 'tafels');
  await expect(toetsblok).toHaveAttribute('data-module', 'tafels');

  // A second test, earlier than the first. The plan follows the soonest one.
  await addTest(page, '2099-01-05', 'topo');
  await expect(toetsblok).toHaveAttribute('data-module', 'topo');

  // And it is a device setting, so it survives the page rather than the render.
  await page.reload();
  await expect(toetsblok).toHaveAttribute('data-module', 'topo');

  // Both are on the list, and taking the soonest one off puts the other back
  // in charge — which is the whole of what makes a list a plan.
  await expect(page.getByRole('button', { name: /^Haal de toets weg/ })).toHaveCount(2);

  await page
    .getByRole('button', { name: /^Haal de toets weg/ })
    .first()
    .click();
  await expect(toetsblok).toHaveAttribute('data-module', 'tafels');
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

  await startRound(page, PROVINCIES, /Aanwijzen/);
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
 * Europe, which is the first round in this product that is not about the
 * Netherlands (ADR-086).
 *
 * Two things it proves that no unit test can. The region row is a way in and
 * not a label — pressing Europa changes what step 2 offers — and the round that
 * follows draws a different map: the countries of Europe rather than the
 * provinces with something on top of them.
 */
test('a round of Europe draws Europe, not the Netherlands', async ({ page }) => {
  await signIn(page, 'Mees');
  await page.goto('/topografie');

  await page.getByRole('button', { name: /^Europa/ }).click();

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Landen/ })).toBeVisible();
  // And the Dutch subjects are gone: a region is a filter, not a heading.
  await expect(wat.getByRole('button', { name: /^Provincies/ })).toHaveCount(0);

  await wat.getByRole('button', { name: /^Landen/ }).click();
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /Aanwijzen/ })
    .click();
  await start(page);

  // A country on the map, asked for in the words a country is asked for in.
  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  await expect(page.getByText('Wijs het land aan')).toBeVisible();
  await expect(page.locator('svg').getByRole('button', { name: 'Spanje' })).toBeVisible();
  // The provinces are not underneath it.
  await expect(page.locator('svg').getByRole('button', { name: 'Limburg' })).toHaveCount(0);
});

/**
 * An address for a map that is not the Netherlands, which is the whole reason
 * a set has one: a parent can send a child to the countries of the world.
 */
test('the countries of the world have an address of their own', async ({ page }) => {
  await signIn(page, 'Noor');
  await page.goto('/topografie/wereld');

  const wat = page.getByRole('region', { name: /Kies een onderwerp/ });
  await expect(wat.getByRole('button', { name: /^Landen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /^Wereld/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

/**
 * The toetsstand: a round that does not answer back until the end (ADR-085).
 *
 * Two halves, and both matter. **Nothing in between** — no Volgende button, no
 * green shape, no waiting: the next question is simply there, which is the
 * thing a test does that no other round in this product does. And **a mark at
 * the end**, which is the only round that gets one, because it is the only
 * round where nothing helped on the way.
 */
test('the toetsstand asks without answering, and marks at the end', async ({ page }) => {
  await signIn(page, 'Roos');
  await startRound(page, PROVINCIES, /Aanwijzen/, true);

  const gevraagd = async () =>
    (await page.getByRole('heading', { name: /Waar ligt / }).textContent()) ?? '';

  const eerste = await gevraagd();
  await answerWrongly(page);

  // Straight on: the round asks the next question instead of telling the child
  // about the last one. The order of these two matters — the absence is only
  // worth asserting once the round has demonstrably moved.
  await expect.poll(gevraagd).not.toBe(eerste);
  await expect(page.getByRole('button', { name: 'Volgende vraag' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Stoppen' }).click();

  // One answer, and it was wrong on purpose, so the mark is the lowest there
  // is. What is being checked is that there is one at all.
  await expect(page.getByText('Zonder hulp onderweg, net als op school.')).toBeVisible();
  await expect(page.locator('.tk-cijfer')).toContainText(/1,0|10,0/);
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
  await page.goto('/voortgang');

  const dieren = page.getByRole('region', { name: 'Dieren' });
  await dieren.getByRole('button', { name: 'Vos', exact: true }).click();
  await expect(dieren.getByRole('button', { name: 'Vos', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Level one, so the ninth cell of the first row is a parcel: it has a place,
  // it says what it costs, and it does not say what is in it (ADR-081). It is
  // not a button either — a control a child cannot use is a question they have
  // to ask somebody about.
  await expect(dieren.getByRole('button', { name: /^Draak/ })).toHaveCount(0);
  await expect(
    dieren.getByLabel(/Nog onbekend dier in brons, vanaf niveau \d+/).first(),
  ).toBeVisible();

  // It belongs to the child, not to the page: it survives a reload.
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Dieren' }).getByRole('button', { name: 'Vos', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('plays a round: question, map, answer, feedback', async ({ page }) => {
  await signIn(page, 'Noor');
  await startRound(page, PROVINCIES, /Aanwijzen/);

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
  await startRound(page, PROVINCIES, /Aanwijzen/);

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
  await startRound(page, PROVINCIES, /Aanwijzen/);

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
  await startRound(page, HOOFDSTEDEN, /Aanwijzen/);

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
  await startRound(page, PROVINCIES, /Kies uit vier namen/);

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
  await startRound(page, PROVINCIES, /Zelf typen/);

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
  await startRound(page, STEDEN, /Aanwijzen/);

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
  await startRound(page, STEDEN, /Aanwijzen/);

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
  await startRound(page, STEDEN, /Ontdek/);

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
    .getByRole('button', { name: /^Steden/ })
    .first();
  // The accessible name and not the visible text: a subject tile shows an icon
  // and a word, and how the subject is going follows it in the label and in the
  // line under the row for whichever subject is chosen. Steden is not the one
  // that is chosen here, so the label is where the fact lives.
  await expect(steden).toHaveAccessibleName(/nog niet geoefend/);
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
 * The tijdrit: the same pointing, against a clock that counts up (ADR-090).
 *
 * Three things no unit test can show. It is offered without the clock setting
 * being touched — which is the line ADR-090 draws between a stopwatch and a
 * time limit. The counter runs while the child is being timed. And a finished
 * round ends on a time, with a record that was not there before.
 *
 * Twelve provinces answered wrongly on purpose: what is being tested is the
 * clock and the record, and a test that had to know where Drenthe is would be
 * testing the map.
 */
test('a tijdrit runs a stopwatch and leaves a record behind', async ({ page }) => {
  await signIn(page, 'Bram');
  // No visit to /jij: the stopwatch is not behind K10's switch, and a test that
  // turned the clock on first could not tell whether that was why it appeared.
  await startRound(page, PROVINCIES, /^Tijdrit/);

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // Counting up, and to a tenth, so two attempts a week apart can differ.
  await expect(page.getByText(/^\d:[0-5]\d,\d$/)).toBeVisible();

  // All twelve, and every one of them wrong. Five strafseconden apiece, which
  // is what the result screen has to add up.
  for (let vraag = 0; vraag < 12; vraag++) {
    await answerWrongly(page);
    await expect(page.getByText(/strafseconden/)).toBeVisible();
    const volgende = page.getByRole('button', { name: 'Volgende vraag' });
    if (await volgende.isVisible()) await volgende.click();
  }

  await expect(page.getByRole('heading', { name: 'Wat er is veranderd' })).toBeVisible();
  await expect(page.getByText('jouw tijd')).toBeVisible();
  // A first time on this track is a record, and it says which it was.
  await expect(page.getByText(/Nieuw record/)).toBeVisible();
  await expect(page.getByText(/12 fout/)).toBeVisible();

  // And the record is on the page that offers the round, before the next one.
  await page.goto('/topografie/provincies');
  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Tijdrit/ })
    .click();
  await expect(page.locator('.tk-choose-start')).toContainText('Je record:');
});

/**
 * The world, asked on the map of a werelddeel (ADR-091).
 *
 * The whole point of the decision, and the only place it can be seen: a round
 * started on "Wereld" draws a map that is not the world. What proves it is a
 * country that is on one werelddeel map and not on the others — every question
 * in the round is answered on a map with at most fifty-two countries on it,
 * where the globe had a hundred and sixty-seven.
 */
test('a round of the world draws the werelddeel, not the globe', async ({ page }) => {
  await signIn(page, 'Julia');
  await page.goto('/topografie/wereld');

  await page
    .getByRole('region', { name: /Hoe wil je/ })
    .getByRole('button', { name: /^Aanwijzen/ })
    .click();
  await start(page);

  await expect(page.getByRole('heading', { name: /Waar ligt / })).toBeVisible();
  // The screen says which map it put up, because the map changes per question
  // and nothing else would announce it.
  await expect(page.getByText(/^op de kaart van /)).toBeVisible();

  // And the map is one werelddeel rather than all of them: whichever it is,
  // Australië and Spanje cannot both be on it.
  const kaart = page.locator('svg');
  const australie = await kaart.getByRole('button', { name: 'Australië' }).count();
  const spanje = await kaart.getByRole('button', { name: 'Spanje' }).count();
  expect(australie + spanje).toBeLessThan(2);
});

/**
 * "Ik weet het niet", drawn on K3 at every size. It is the one control that
 * lets a child stop guessing, so what matters is that it shows the answer and
 * that pressing it is cheaper than a guess — see ADR-048 for why.
 */
test('a child can say they do not know, and is shown the answer', async ({ page }) => {
  await signIn(page, 'Pim');
  await startRound(page, PROVINCIES, /Aanwijzen/);
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
