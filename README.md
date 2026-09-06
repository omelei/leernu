# Leernu

Topography for Dutch primary and lower-secondary education. Short rounds, a map
that fills the screen, and progress a child can feel. No advertising, no
tracking, no account required.

The product name lives in `src/config/brand.ts` and is never hardcoded, so
renaming or white-labelling stays a one-file change.

## What it does today

A child types a name — kept on the device, never sent anywhere — and then
practises one of two sets in one of two ways:

|                                   | Wijs aan           | Typ de naam                   |
| --------------------------------- | ------------------ | ----------------------------- |
| **Provincies van Nederland**      | click the province | name the highlighted province |
| **Hoofdsteden van de provincies** | click the city     | name the highlighted city     |

A round covers the whole set: twelve of twelve, ordered by a Leitner scheduler
so what a child keeps missing comes round first. Answers are judged, saved and
scheduled locally; a round can be stopped early and what was answered is kept.

The home screen forecasts retention rather than reporting a score — "69%, weet
je hier over drie weken nog van" — because that is the only number that argues
for practising today.

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
npm run lint && npm run typecheck && npm run format:check && npm test && npm run build
```

```bash
npm run test:e2e     # Playwright: flows, accessibility (axe), keyboard
npm run lighthouse   # performance >= 85, accessibility >= 95
```

### Content, which needs no npm

The pipeline is dependency-free on purpose ([ADR-018](docs/DECISIONS.md)), so it
runs anywhere and its output can be checked before anyone sees it:

```bash
node tools/content/fetch-source.mjs   # CBS geodata, into content/geo/_source
node tools/content/build-geo.mjs      # provinces, three detail levels
node tools/content/build-cities.mjs   # the twelve capitals as points
```

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
| [BUSINESSPLAN.md](docs/BUSINESSPLAN.md) | Market, competition, pricing. Planning only — not built                                  |

## Still to come

`docs/CURRICULUM.md` — learning goals mapped to published kerndoelen with
sources and dates. `content/leerdoelen.json` carries our own goals and leaves
`kerndoelRefs` empty on purpose: the kerndoelen were revised, the first sets
entered law in August 2026, and geography spans two learning areas. A reference
invented now would be a claim we cannot support ([ADR-011](docs/DECISIONS.md)).
