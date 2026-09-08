# Leernu

Practice for Dutch primary and lower-secondary education. Short rounds, a map
that fills the screen, and progress a child can feel. No advertising, no
tracking, no account required.

Two modules today: **topografie** and **rekenen**. Five more are planned and
none of them is offered before it exists ([ADR-037](docs/DECISIONS.md)) — a
greyed-out entry is a promise, and this product does not make promises to
children it has not kept yet.

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

Rekenen is the twelve tables, one to twelve, ten sums each. A round is a whole
table, because "de tafel van 7 ken ik" is only sayable about all of it. Typing
the answer comes before choosing between four, which is the opposite of the map
and for a reason ([ADR-049](docs/DECISIONS.md)).

A round covers the whole set where the set is small enough — twelve of twelve —
and is capped at fifteen questions where it is not, because eighty questions is
twenty minutes with no stopping point. Order comes from a Leitner scheduler, so
what a child keeps missing comes round first. Answers are judged, saved and
scheduled locally; a round can be stopped early and what was answered is kept.

The home screen greets a child by name, asks when the test is and what it is
about, and offers the one thing to carry on with. It carries two numbers and
keeps them apart on purpose: the mark from the last round — "Je scoorde vorige
keer een 8,4", over what was answered and not over what was asked — sits on the
card it belongs to, and the forecast of what is still known in three weeks
stands in a column of its own, because that is the only number that argues for
practising today ([ADR-053](docs/DECISIONS.md)).

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
node tools/content/build-tafels.mjs      # the twelve tables, into content/tafels
```

`build-neighbours` runs after the geometry builds, because it reads what they
write. `build-tafels` needs nothing but arithmetic.

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
