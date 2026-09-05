# Architecture — TopoKampioen

Status: draft, phase 0. Last updated 2026-09-05.
Revised after the scope decision of 2026-09-05 (ADR-014): build the app, with no
commercial model and no class or pupil administration. Anyone can play and
learn. Accounts, classes, teachers and licensing come later.

The product name is a working title. Everything user-visible reads it from
`src/config/brand.ts`; no component hardcodes it.

## 1. What this scope decision does to the architecture

Removing accounts removes most of the system. There is no sign-in, so there are
no pupils in a database, so there is no row-level security, no processing
agreement, and no personal data to protect — because there is none to collect.

That points at one answer, and it is a much better answer than the one the
original spec implied:

> **v1 is a static single-page app with no backend at all. All progress lives on
> the device, in IndexedDB. Nothing about a player ever leaves the browser.**

No Supabase, no Edge Functions, no database, no auth. A static bundle and a
folder of geodata on a CDN. The privacy story stops being a set of controls we
have to prove and becomes a fact about the architecture: there is no server to
send anything to.

What we give up is real and worth naming: no progress across devices, no teacher
reporting, no leaderboards, no duels. All three arrive together with accounts,
and none of them can be faked convincingly without one.

## 2. Shape

```
   Chromebook / iPad / laptop / digibord
   ┌──────────────────────────────────────┐
   │  SPA — React 18, TS strict, Vite     │
   │  self-hosted fonts, no third-party   │
   │  ┌────────────────────────────────┐  │
   │  │ IndexedDB: profile, Leitner    │  │
   │  │ state, XP, streak, badges      │  │
   │  └────────────────────────────────┘  │
   └──────────────────┬───────────────────┘
                      │ static assets only
   ┌──────────────────┴───────────────────┐
   │  CDN (Cloudflare Pages, EU)          │
   │  app bundle + content/geo/*.json     │
   └──────────────────────────────────────┘
```

The only network traffic is fetching the app and the geodata for a region set.
No analytics, no CDN fonts, no error reporter, no tile provider. This is the
rule from the original draft, and losing the backend makes it absolute rather
than aspirational.

## 3. Designing now for the accounts that come later

The temptation in a local-first v1 is to shape the local store around what is
convenient today, and then discover that importing it into a real database is a
rewrite. Two rules prevent that:

1. **The local store uses the same row shapes as the future server tables.**
   `item_states`, `attempts`, `sessions` and `streaks` exist in IndexedDB with
   the columns they will have in Postgres (see `DATAMODEL.md` part A). Adding
   accounts later means uploading rows, not transforming them.
2. **Scoring and scheduling live in one pure module**, `src/game-core`, with no
   browser dependencies. Today the client calls it. When leaderboards arrive and
   scores must be server-validated (the original ADR-003, deferred but not
   abandoned), the server imports the same module. That is the single decision
   that keeps anti-cheat affordable later instead of impossible.

   It is a directory rather than a separate npm workspace, and the purity is
   enforced by an ESLint rule that forbids importing `react`, `idb`, the store or
   any browser global from inside it. A workspace would enforce the same thing
   through packaging, at the cost of a build graph that has to be maintained for
   a boundary a lint rule already holds. Promoting it to a package later is a
   folder move.

A local profile is a name the player types and a generated id. It is stored on
the device and never transmitted. When accounts arrive, "claim this progress"
becomes an upload of existing rows.

## 4. Maps without a tile provider

GeoJSON rendered as SVG, no tiles: no per-view cost, no external requests, fully
themeable, works on a network that blocks half the internet.

**Projection happens in the content pipeline, not in the browser** (ADR-004,
accepted). Region sets ship pre-projected into a 0–1000 view box at three
mapshaper-simplified detail levels. `d3-geo` is a build dependency and never
enters the bundle. On a 2018 Chromebook that is the difference between a map
that appears and one that hitches.

Correction to the spec carried into that ADR: the Netherlands uses a
**stereographic** projection, not a conic one. RD (Amersfoort / EPSG:28992) is
oblique stereographic; we use `geoStereographic` rotated on 5°23′E / 52°09′N.

Hit testing uses the rendered path, with a 44 px minimum touch target enforced
by an invisible buffer path for small provinces and island groups — Vlieland
must be as tappable as Gelderland.

Mercator appears only where a global view demands it, and where it does, the app
says out loud that it distorts area. That sentence is didactic content, not a
disclaimer: a topography app that quietly teaches children Greenland is the size
of Africa has failed at its own subject.

## 5. Front-end structure

```
src/
  game-core/              pure: Leitner, answer matching, scoring (no DOM, no React)
  config/brand.ts         product name and feature flags
  design/                 palette checks that read the real stylesheet
  content/                loads content/sets, and the validator that gates CI
  game/
    modes/                one file per GameMode plugin        (phase 1)
    map/                  SVG renderer, hit testing            (phase 1)
  store/                  IndexedDB schema and access
  features/player/        profile, progress, passport, avatar
  i18n/                   nl.ts from day one; keys never inline
  index.css               the design system, and the only file that names a colour
tools/                    bundle-size report; content pipeline follows in phase 1
content/
  geo/                    versioned, pre-projected, three detail levels
  sets/                   items and learning goals
public/fonts/             self-hosted woff2 — nothing is fetched from a CDN
```

Zustand holds the live round, which is a state machine that must survive a
reload mid-round. TanStack Query has nothing to query in v1 and is deferred with
the backend.

Modes implement one interface, registered in a map:

```ts
interface GameMode {
  id: ModeId;
  buildRound(items: Item[], ctx: RoundContext): Question[];
  scoreAnswer(q: Question, a: Answer): AnswerResult;
  Component: React.FC<GameModeProps>;
}
```

In scope for this phase: wijs aan, hoe heet dit, sleepronde, bliksemronde,
overleven, ontdekmodus. Deferred with accounts: duel and klassenstrijd — both
need a second player who exists somewhere other than this device.

## 6. Accessibility (WCAG 2.2 AA) on a map

The hard part here is that the primary interface is a picture, and colour may
never be the only carrier of meaning:

- Every region is reachable by keyboard in a defined order, with a visible focus
  ring drawn outside the shape.
- Correct and incorrect are signalled by icon and text, not only by fill colour.
- Each region carries an accessible name; in "wijs aan" the question is
  announced through a live region.
- Read-aloud uses the browser's own SpeechSynthesis. A cloud TTS would be an
  external request and a subprocessor, and this architecture has neither.
- Dyslexia-friendly font and `prefers-reduced-motion` are settings, and the
  reduced-motion path removes movement, not feedback.

## 7. Offline

With no backend, offline is nearly free: after the first visit the app and the
loaded region sets are cached by a service worker, and progress writes to
IndexedDB. A round survives a tunnel, a reload and a flat network. This is a
genuine advantage of the scope decision, not a consolation — on a school network
shared by thirty children it may be the most noticeable quality of the product.

## 8. Testing

- Vitest on `game-core`: Leitner transitions, answer matching, scoring. This is
  where the learning behaviour is proven, and it needs no browser.
- Playwright for the flows that exist in this scope: play a round, get a result,
  reopen the app and find your progress, play offline.
- `validate:content` in CI on every push. A broken geometry reference must never
  reach a classroom.
- Bundle size is measured and reported in CI against the 300 kB budget from spec
  §8. It reports rather than fails: keeping Framer Motion was a deliberate
  choice (ADR-010, rejected), and the number should be visible so the trade
  stays an informed one.

The negative RLS tests from the original draft are deferred with the database
they were protecting.

## 9. What returns when accounts arrive

Kept intentionally reversible, each with a live ADR:

| Then needed | Deferred ADR |
|---|---|
| Pupil sign-in without e-mail (class code + PIN, custom JWT) | ADR-002 |
| Server-authored rounds and validated scores | ADR-003 |
| Divisions gated on player population | ADR-009 |
| Retention anchored on class archival | ADR-012 |
| Payments behind a provider interface | ADR-013 |
