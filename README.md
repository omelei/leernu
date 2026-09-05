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

## Getting started

Development happens in **GitHub Codespaces** ([ADR-001](docs/DECISIONS.md)): the
npm registry is unreachable from the machine this was drafted on. The
`.devcontainer` installs dependencies and the Playwright browser on create.

```bash
npm install          # first run only; commit the package-lock.json it produces
npm run dev          # http://localhost:5173
```

Then, in this order, because that is the order CI runs them in:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

> **Nothing in this repository has been executed yet.** It was written on a
> machine where `npm install` cannot run, so the first Codespace session is also
> the first time the toolchain sees any of it. Expect to fix dependency versions:
> they were pinned conservatively (Vite 5 / Vitest 2 / Tailwind 3) precisely
> because they could not be verified, and moving to current majors is a sensible
> first task once CI is green.
>
> What *has* been verified: the six self-hosted fonts render in a browser, and
> every colour pair in the palette clears WCAG AA — measured, not estimated, and
> now pinned by `src/design/contrast.test.ts`, which reads the real stylesheet.

## What phase 0 delivers

| | |
|---|---|
| Toolchain | Vite, TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Tailwind, ESLint flat config, Prettier |
| CI | lint, typecheck, format, content validation, unit tests, build, Playwright on Chromebook and iPad viewports |
| Design system | `src/index.css` — the only file allowed to name a colour, enforced by lint. Self-hosted Nunito and OpenDyslexic |
| i18n | Every user-visible string in `src/i18n/nl.ts`; nothing inline |
| `game-core` | Leitner scheduler and answer matching, pure and fully tested. No DOM imports, enforced by lint |
| Local store | The IndexedDB schema from DATAMODEL part A |
| App | Name entry, a start screen, and a working reading-font setting that survives a reload |

The app is deliberately honest about being empty: it says the maps are still
coming rather than showing a mock-up of them.

## Conventions

- Code, identifiers, commits and documentation in English.
- UI text and content in Dutch, only through i18n keys. Language for children at
  roughly AVI-M6.
- Content lives in versioned files under `content/`, not in components.
- No colour literal outside `src/index.css`; no browser import inside
  `src/game-core`. Both are lint errors, not conventions.

## Documents

| | |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is put together, and what the scope decision changed |
| [DATAMODEL.md](docs/DATAMODEL.md) | Part A: the local store. Part B: the deferred school model |
| [DECISIONS.md](docs/DECISIONS.md) | 16 ADRs, including what was rejected and why |
| [BUSINESSPLAN.md](docs/BUSINESSPLAN.md) | Market, competition, pricing. Planning only — not built |

## Still to come

- `docs/DATA_SOURCES.md` — every geodata source with licence, URL and retrieval
  date. PDOK Bestuurlijke Gebieden is CC-BY-4.0 (verified 2026-09-05); Natural
  Earth is public domain.
- `docs/CURRICULUM.md` — learning goals mapped to published kerndoelen, with
  sources and dates.
