# TopoKampioen

Topography for Dutch primary and lower-secondary education. Short rounds, a map
that fills the screen, and progress a child can feel. No advertising, no
tracking, no account required.

Working title. The product name lives in `src/config/brand.ts` and is never
hardcoded.

## Scope of this phase

Decided 2026-09-05 ([ADR-014](docs/DECISIONS.md)): **build the app itself.** No
commercial model, no classes, no pupil administration. Anyone can play and learn.

That makes v1 a static single-page app with **no backend at all** — all progress
lives in IndexedDB on the device ([ADR-015](docs/DECISIONS.md)). Nothing about a
player leaves the browser.

**In scope:** content pipeline and Dutch geodata · map renderer · the six
single-player modes (wijs aan, hoe heet dit, sleepronde, bliksemronde, overleven,
ontdekmodus) · Leitner engine · result screen · XP, coins, levels, badges, travel
stamps, avatar · individual day streak with freezes and holiday pause ·
accessibility and i18n from the first commit.

**Deferred until accounts exist:** sign-in, classes, teachers, reporting,
assignments, duel, klassenstrijd, weekly ladder, divisions, licences, payments.

## Documents

| | |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is put together, and what the scope decision changed |
| [DATAMODEL.md](docs/DATAMODEL.md) | Part A: the local store. Part B: the deferred school model |
| [DECISIONS.md](docs/DECISIONS.md) | 16 ADRs, including what was rejected and why |
| [BUSINESSPLAN.md](docs/BUSINESSPLAN.md) | Market, competition, pricing. Planning only — not built |

## Conventions

- Code, identifiers, commits and documentation in English.
- UI text and content in Dutch, only through i18n keys — never inline. Language
  for children at roughly AVI-M6.
- Content lives in versioned files under `content/`, not in components.
- Development happens in GitHub Codespaces ([ADR-001](docs/DECISIONS.md)): the
  npm registry is unreachable from the machine this was drafted on.

## Planned commands

None of these run yet; this is the shape phase 0 will deliver.

```bash
npm run dev               # Vite dev server
npm run build             # production build, reports bundle size against the 300 kB budget
npm run test              # Vitest (game-core)
npm run test:e2e          # Playwright (play a round, keep progress, play offline)
npm run validate:content  # content and geometry integrity — runs in CI
```

## Still to come

- `docs/DATA_SOURCES.md` — every geodata source with licence, URL and retrieval
  date. PDOK Bestuurlijke Gebieden is CC-BY-4.0 (verified 2026-09-05); Natural
  Earth is public domain.
- `docs/CURRICULUM.md` — learning goals mapped to published kerndoelen, with
  sources and dates.
