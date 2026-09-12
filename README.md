# Leernu

Practice for Dutch primary and lower-secondary education. Short rounds, a map
that fills the screen, and progress a child can feel. No advertising, no
tracking, no account required.

Four modules today: **topografie**, **rekenen**, **klokkijken** and **vlaggen**.
Three more are planned and they stand in the rail beside the four that exist
([ADR-051](docs/DECISIONS.md)), because a rail that showed only what was
finished made the product look like it stopped there. What none of them does is pretend: a module that is not built
says so on its own page and points at the ones that are.

That last sentence is why this repository is public. The best-known free
alternative is paid for by advertising from over a hundred vendors, on a page
eleven-year-olds sit on. "No trackers" is a claim; here it is something you can
check — there is no analytics, no third-party script, and no network traffic
beyond the map files in `public/`.

The product name lives in `src/config/brand.ts` and is never hardcoded, so
renaming or white-labelling stays a one-file change.

## What it does today

A child types a name — kept on the device, never sent anywhere — and then
practises one of five sets:

| Set                               | Items | What it teaches                     |
| --------------------------------- | ----- | ----------------------------------- |
| **Provincies van Nederland**      | 12    | the twelve provinces as shapes      |
| **Hoofdsteden van de provincies** | 12    | each capital as a point             |
| **De Waddeneilanden**             | 5     | five islands, west to east          |
| **Zeeën en meren**                | 6     | the large bodies of water           |
| **Steden van Nederland**          | 80    | cities, and the province each is in |

Beyond the Netherlands there are seven more maps: the **six werelddelen** and
the **wereld** — from Afrika's 52 countries to Oceanië's 9, and 167 of them at
once — all from Natural Earth and projected offline like everything else. Each
continent takes the same stereographic as the provinces, re-centred; the globe
takes Miller, because Mercator draws Greenland the size of Africa and this
product exists to teach how big things are ([ADR-086](docs/DECISIONS.md)).

On /topografie they are offered as **where** and then **what**: the world, a
werelddeel, or Nederland — and then Provincies, Steden, Wateren, Eilanden, Mix,
or simply Landen, one word each ([ADR-083](docs/DECISIONS.md)).

**And the way of practising follows the map.** Pointing at a country is fine on
a map of Zuid-Amerika and hopeless on a map of the world: measured over every map
at three screen sizes, ninety of the world's 167 countries cannot be hit even on
a laptop. So past fifteen shapes on a phone, and past a hundred anywhere,
pointing moves to the end of step 2 and **meerkeuze leads** — the map lights a
country up and the child answers in words, which is also what a Dutch
topografietoets asks ([ADR-087](docs/DECISIONS.md)).

In six ways. **Wijs aan** points at the map; **meerkeuze** offers four names,
three of them places that border the right one; **typ de naam** names what is
highlighted; **ontdekken** asks nothing at all and exists so a child's first
meeting with an item is not a question they get wrong; **bliksemronde** puts
sixty seconds on it and **overleven** gives three lives.

Rekenen is four kinds of sum: the twelve tables, the division facts that mirror
them, and addition and subtraction in three ranges each — five hundred and ten
sums in all. A round is ten of them. Typing the answer comes before choosing
between four, which is the opposite of the map and for a reason
([ADR-049](docs/DECISIONS.md)).

Klokkijken is the clock in the four steps a Dutch classroom teaches it in: hele
uren, halve uren, kwartieren and the five-minute steps — a hundred and forty-four
faces, and it stops there because "23 minuten over zeven" is a digital display
rather than a clock ([ADR-092](docs/DECISIONS.md)). Two of its ways of
practising show a face and ask the time; the third shows a time and asks which
of four faces says it, which is the half a child who has learned to recognise
twelve pictures has never been asked. And "half acht" is half past _seven_ —
that one rule is what the module is for and what the wrong answers are built
from.

Vlaggen hangs off topography: the same row of werelddelen, and then the
well-known flags, all of them, or the ones that look alike — 196 countries and
the twelve provinces ([ADR-102](docs/DECISIONS.md)). A child finds the flag for
a name, or the name for a flag, and the wrong answers get closer as the round
goes on: first flags from the other side of the world, then from the same
werelddeel, and at the end Tsjaad beside Roemenië. There is no typing — spelling
"Kirgizië" is a spelling test — and a screen reader describes each flag rather
than naming it, because the name is the answer. Which countries count, and why
Taiwan is in and Palestina is not, is written down in
[content/vlaggen/AFBAKENING.md](content/vlaggen/AFBAKENING.md). Each of the six
werelddelen has a **vlaggendiploma**: twenty of its flags, nine in ten right,
and nothing said until the end ([ADR-104](docs/DECISIONS.md)).

Every module offers a **mix**: the Rekenmix shuffles all four operations — in
three difficulties, from the level every set has always carried
([ADR-073](docs/DECISIONS.md)) — the Topomix shuffles all five map sets, and the
Klokmix every face there is. None of them is a set of its own — they hold the
same items under one name, so a sum answered in a mix moves the box it moves
anywhere else ([ADR-062](docs/DECISIONS.md), [ADR-063](docs/DECISIONS.md)).

And rekenen has the exercise a Dutch child already knows: a **tafeldiploma**.
The whole table, ten sums in order, every one right, one mistake and you sit it
again. No stopwatch — the settings page says haste does not help you remember,
and we do not switch that off for the one exercise where it would be felt most
([ADR-064](docs/DECISIONS.md)). Twelve of them hang under the tables with the
gaps showing. And a child who knows which sums they keep getting wrong can ask
for exactly those ([ADR-078](docs/DECISIONS.md)).

Every module has a page of its own at the word a parent would type — leer.nu
/topografie, /rekenen, /klokkijken — and one flow on it: what you want to
practise, then how, then a button. Step 1 offers **subjects**, six at most, and
a subject that holds many sets asks which as a row of chips underneath: one
decision, then a smaller one, instead of thirty-six of equal weight
([ADR-062](docs/DECISIONS.md)). Topography asks where on the map before that,
which is why its subjects are one word ([ADR-083](docs/DECISIONS.md)). The ways of practising are in order of weight
with a line and an icon each, six at most ([ADR-061](docs/DECISIONS.md)). The
chosen combination is spelled out beside the start button, and the button says
Start ([ADR-066](docs/DECISIONS.md)). Where a set is big enough for the question
to mean anything, the child says how long the round is: ten, twenty-five, fifty
or a hundred ([ADR-074](docs/DECISIONS.md)). And one switch sits under the two
steps: **toetsstand**, which stops the round answering back until the end and
gives a mark for it — the only round in the product that gets one, because it is
the only one where nothing helped on the way
([ADR-085](docs/DECISIONS.md)). A set has an address too, so
leer.nu/topografie/provincies is a place a child can be sent.

A round covers the whole set where the set is small enough — twelve of twelve —
and is capped at fifteen questions where it is not, because eighty questions is
twenty minutes with no stopping point. Order comes from a Leitner scheduler, so
what a child keeps missing comes round first. Answers are judged, saved and
scheduled locally; a round can be stopped early and what was answered is kept.

The home screen greets a child by name and then does three things. It holds the
tests that are coming — as many as there are, each with its subject, and nothing
else in that block ([ADR-077](docs/DECISIONS.md)) — and under it, four tiles for
the exercises this child goes back to most, with how many times each was played.
That count comes from the device and nowhere else; there is no server to ask
what is popular, and a figure we invented would be a fabrication on a page whose
whole claim is that it does not track anybody ([ADR-082](docs/DECISIONS.md)).
It logs the rounds just played with the mark each came to — "cijfer 8,4", over
what was answered and not over what was asked ([ADR-053](docs/DECISIONS.md)).
And down the right it keeps what is the child's own — on every screen inside
the frame, not only here: their progress first, then everything answered
correctly so far with the run of correct answers under it, then the exercises
they keep going back to. "Jouw voortgang" is the hero a child wears, the reeks
it stands in, five stars with as many filled as the next chest has, and one line
saying what that chest costs, in the only unit that means anything to them: "nog
6 goede antwoorden" ([ADR-099](docs/DECISIONS.md)). The level stands under it
as one thin bar and one line, so the nearest reward weighs most and the two do
not compete ([ADR-070](docs/DECISIONS.md)).

**What a round is worth is counted in one thing, and counted the same
everywhere: correct answers.** Ten of them are a star, five stars are a chest,
and a chest holds one of the twelve heroes — one the child does not have yet,
chosen by them from three that are laid face up
([ADR-097](docs/DECISIONS.md)). Twelve chests are twelve heroes, six hundred
correct answers, and the same twelve for every child; the choosing changes when
a hero arrives, never whether. Three duplicates carry a hero up a reeks, so the
collection is twelve heroes and sixty plates. Nothing else moves it: not money,
not chance, not a day of the week.

The whole of it is at **leer.nu/voortgang**: twelve heroes — Valerie Vos to
Ben Buizerd, each with a ring round the plate for every reeks climbed, brons,
zilver, goud, platina, ultra ([ADR-080](docs/DECISIONS.md)) — twelve
tafeldiploma's and ten reisstempels, with what every one of them costs written
next to it ([ADR-076](docs/DECISIONS.md), [ADR-098](docs/DECISIONS.md)). A hero not found yet is drawn as a
chest and keeps its name to itself, which is what the three cards are for
([ADR-081](docs/DECISIONS.md)). A chest is opened at the end of the round
that earned it — the one moment of movement in this product that is a reward
rather than a lesson — and it says which hero, which reeks, and which chest
handed it over ([ADR-084](docs/DECISIONS.md)). A chest earned by a round that
was closed too early is still owed, and the collection page opens it instead. Nothing on that page can be bought, won by
chance or reached by waiting, and nothing on it mentions a date. **There is no
random number anywhere in the reward path**: which hero a chest may hold is
arithmetic in `game-core`, the order is fixed and the same for every child, and
the choosing is the child's ([ADR-097](docs/DECISIONS.md)).

The forecast — "69%, weet je hier over drie weken nog van" — is the number the
product argues from and it lives on **Onthouden**, one screen along. On the
front door beside a mark it read as a second opinion about the same thing
([ADR-058](docs/DECISIONS.md)).

## Architecture in one paragraph

A static single-page app with **no backend at all**. Everything a player does
lives in IndexedDB on their device ([ADR-015](docs/DECISIONS.md)). There are no
accounts, so there is no personal data, so there is nothing to secure beyond the
device. Maps are pre-projected SVG paths built offline from CBS geodata and
fetched per region set, never bundled. Fonts are self-hosted. Nothing loads from
a third party.

## Where it runs

GitHub Pages, on **www.leer.nu**, published by the `deploy` job in
`.github/workflows/ci.yml` on every push to `main` that passes. The domain is
set in the repository's Pages settings; `public/CNAME` records it in git as
well, and takes over if the publishing source is ever moved back to a branch.

Because a static host either answers or does not, the only way to know the
product is up is to ask it:

```bash
node tools/beschikbaarheid.mjs            # DNS, certificates, the page, every edge address
node tools/beschikbaarheid.mjs --dns-only # for a machine that can resolve but not reach
```

`.github/workflows/beschikbaarheid.yml` runs it four times an hour and after
every deploy, and keeps one issue labelled `beschikbaarheid` as the record: a
failing run opens it, the first passing run closes it
([ADR-105](docs/DECISIONS.md)). Two DNS records are still owed and the probe
warns until they exist — the four AAAA records on the apex, and the
`_github-pages-challenge-omelei` TXT record that verifies the domain.

## Getting started

Development happens in **GitHub Codespaces** ([ADR-001](docs/DECISIONS.md)): the
npm registry is unreachable from the machine much of this was written on. The
`.devcontainer` installs dependencies and both Playwright browsers on create.

```bash
npm install
npm run dev
```

The full gate, in the order CI runs it:

```bash
npm run check
```

```bash
npm run test:e2e     # Playwright: flows, accessibility (axe), keyboard
npm run lighthouse   # performance >= 85, accessibility >= 95
```

### Content, which needs no npm

The pipeline is dependency-free on purpose ([ADR-018](docs/DECISIONS.md)), so it
runs anywhere and its output can be checked before anyone sees it:

```bash
node tools/content/fetch-source.mjs      # CBS geodata, into content/geo/_source
node tools/content/build-geo.mjs         # provinces, three detail levels
node tools/content/build-cities.mjs      # the twelve capitals as points
node tools/content/build-neighbours.mjs  # who lies next to whom, into content/buren
node tools/content/build-rekenen.mjs     # tables, delen, plus and min, into content/
node tools/content/build-klok.mjs        # the four steps of the clock, into content/klok
```

`build-neighbours` runs after the geometry builds, because it reads what they
write. `build-rekenen` and `build-klok` need nothing but arithmetic.

To look at the result without a build, serve the project root and open
`tools/content/preview.html`:

```bash
python -m http.server 8942
```

## Conventions

- Code, identifiers, commits and documentation in English.
- UI text and content in Dutch, only through i18n keys. Language for children at
  roughly AVI-M6.
- Content lives in versioned files under `content/`, not in components.
- No colour literal outside `src/index.css`; no browser import inside
  `src/game-core`. Both are lint errors, not conventions.

## Documents

|                                         |                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is put together and why                                                           |
| [DATAMODEL.md](docs/DATAMODEL.md)       | Part A: the local store. Part B: the deferred school model                               |
| [DECISIONS.md](docs/DECISIONS.md)       | Every decision that would be expensive to reverse, including the ones that were reversed |
| [DATA_SOURCES.md](docs/DATA_SOURCES.md) | Every geodata source with licence, URL and retrieval date                                |

## Still to come

`docs/CURRICULUM.md` — learning goals mapped to published kerndoelen with
sources and dates. `content/leerdoelen.json` carries our own goals and leaves
`kerndoelRefs` empty on purpose: the kerndoelen were revised, the first sets
entered law in August 2026, and geography spans two learning areas. A reference
invented now would be a claim we cannot support ([ADR-011](docs/DECISIONS.md)).
