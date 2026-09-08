# Leernu

Practice for Dutch primary and lower-secondary education. Short rounds, a map
that fills the screen, and progress a child can feel. No advertising, no
tracking, no account required.

Two modules today: **topografie** and **rekenen**. Five more are planned and
they stand in the rail beside the two that exist ([ADR-051](docs/DECISIONS.md)),
because a rail that showed only what was finished made the product look like it
stopped there. What none of them does is pretend: a module that is not built
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

Both modules offer a **mix**: the Rekenmix shuffles all four operations, the
Topomix shuffles all five map sets. Neither is a set of its own — they hold the
same items under one name, so a sum answered in a mix moves the box it moves
anywhere else ([ADR-062](docs/DECISIONS.md), [ADR-063](docs/DECISIONS.md)).

And rekenen has the exercise a Dutch child already knows: a **tafeldiploma**.
The whole table, ten sums in order, every one right, one mistake and you sit it
again. No stopwatch — the settings page says haste does not help you remember,
and we do not switch that off for the one exercise where it would be felt most
([ADR-064](docs/DECISIONS.md)). Twelve of them hang on the rekenen page with the
gaps showing.

Every module has a page of its own at the word a parent would type — leer.nu
/topografie, /rekenen, /klokkijken — and one flow on it: what you want to
practise, then how, then a button. Step 1 offers **subjects**, six at most, and
a subject that holds many sets asks which as a row of chips underneath: one
decision, then a smaller one, instead of thirty-six of equal weight
([ADR-062](docs/DECISIONS.md)). The ways of practising are in order of weight
with a line and an icon each, six at most ([ADR-061](docs/DECISIONS.md)). The
chosen combination is spelled out beside the start button, and the button says
Start ([ADR-066](docs/DECISIONS.md)). A set has an address too, so
leer.nu/topografie/provincies is a place a child can be sent.

A round covers the whole set where the set is small enough — twelve of twelve —
and is capped at fifteen questions where it is not, because eighty questions is
twenty minutes with no stopping point. Order comes from a Leitner scheduler, so
what a child keeps missing comes round first. Answers are judged, saved and
scheduled locally; a round can be stopped early and what was answered is kept.

The home screen greets a child by name and then does three things. It asks when
the test is and what it is about, and offers the one thing to carry on with.
It logs the rounds just played with the mark each came to — "cijfer 8,4", over
what was answered and not over what was asked ([ADR-053](docs/DECISIONS.md)).
And down the right it keeps what is the child's own — on every screen inside
the frame, not only here: the journey first, then everything answered correctly
so far, then the exercises they keep going back to. The journey is the level a
child has reached and one line saying what the next one costs, in the only unit
that means anything to them: "nog 6 goede antwoorden"
([ADR-065](docs/DECISIONS.md)). Each level brings one of twelve animals, and
choosing between the ones reached happens on **Jij**
([ADR-067](docs/DECISIONS.md)). Nothing on that ladder can be bought, won by
chance or reached by waiting.

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
```

`build-neighbours` runs after the geometry builds, because it reads what they
write. `build-rekenen` needs nothing but arithmetic.

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
