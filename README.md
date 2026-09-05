# TopoKampioen

Topography for Dutch primary and lower-secondary education, sold to schools as a
yearly licence. Pupils learn where things are in 2–5 minute rounds; teachers see
per-pupil and per-goal where it stalls, without marking anything.

Working title. The product name lives in `src/config/brand.ts` (phase 0) and is
never hardcoded.

## Status

**Phase 0, before code.** What exists today is the design set required by the
spec before implementation starts:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATAMODEL.md](docs/DATAMODEL.md)
- [docs/DECISIONS.md](docs/DECISIONS.md)

**Phase 0 is blocked on ADR-001.** The npm registry is unreachable from the
machine this was drafted on (`E403` from `registry.npmjs.org`; CDN hosts
reachable, registries not), so the toolchain cannot be installed here. See
[ADR-001](docs/DECISIONS.md#adr-001--build-environment-this-machine-cannot-install-the-toolchain)
for the three options and the recommendation.

## Conventions

- Code, identifiers, commits and documentation in English.
- UI text and content in Dutch, and only through i18n keys — never inline.
  Pupil-facing language at roughly AVI-M6; teacher-facing language plain and
  professional.
- Content lives in versioned files under `content/`, not in components.

## Planned commands

None of these run yet; they are the shape phase 0 will deliver.

```bash
npm run dev               # Vite dev server
npm run build             # production build, fails if the shell exceeds budget
npm run test              # Vitest (game-core)
npm run test:e2e          # Playwright (pupil round, class creation, class-code login, RLS)
npm run validate:content  # content and geometry integrity — runs in CI
```

## Documents still to come

Per phase, per the spec:

- `docs/DATA_SOURCES.md` — every geodata source with licence, URL and retrieval
  date (phase 1)
- `docs/CURRICULUM.md` — learning goals mapped to published kerndoelen, with
  sources and dates (phase 1)
- `docs/SUBVERWERKERS.md` — every subprocessor, its location and its purpose
- `docs/legal/` — processing agreement, privacy statement, cookie statement,
  accessibility statement, security policy (drafts; all require legal review)
