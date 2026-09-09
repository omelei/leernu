# Architecture — Leernu

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

Round state is plain React state. Zustand was planned for it and removed once
the round turned out to be a small state machine owned by one screen — a store
would have been ceremony around four `useState` calls (ADR-021). TanStack Query
has nothing to query in v1 and is deferred with the backend.

Modes implement one interface, registered in a map:

```ts
interface GameMode {
  id: ModeId;
  buildRound(items: Item[], ctx: RoundContext): Question[];
  scoreAnswer(q: Question, a: Answer): AnswerResult;
  Component: React.FC<GameModeProps>;
}
```

Built: wijs aan, meerkeuze, hoe heet dit, ontdekmodus, tijdrit, bliksemronde,
overleven. The spec
also listed a sleepronde; it was dropped rather than deferred, because WCAG
2.5.7 forces a tap alternative that duplicates wijs aan and dragging measures aim
alongside knowledge (ADR-023).
Deferred with accounts: duel and klassenstrijd — both need a second player who
exists somewhere other than this device.

**The tijdrit changes what is measured, not what is asked.** It is wijs aan
with a stopwatch: the same questions, the same map, the same scheduler, and a
clock that counts up while a question is on screen and stops while the feedback
is read. A wrong answer adds five seconds to the total and costs nothing else. A
best time is kept per set and per round length, on the device, for one child —
there is no server to rank on and there will not be one for this (ADR-090).

**Bliksemronde and overleven change one thing only: when a round ends.** The
map, the judging and the scheduler are identical, so the difference is a value
— `RoundRule` is `vast` (a list of fifteen), `tijd` (sixty seconds) or `levens`
(three) — rather than three code paths. Both draw from the whole set instead of
a round's worth, because a round that ends on a clock cannot also end on a list.

Neither may punish. A lost life costs no coins, a finished clock still counts as
a finished round for the streak, and nothing is ranked against another child
(spec §10). What they add is a reason to answer without working it out each
time, which is the difference between knowing where Zwolle is and being able to
find it.

**Ontdekmodus is not a round.** It has no questions, no scoring, and it writes
nothing to the scheduler. That is the point of it: with 115 items across five
sets, a child's first meeting with each one was previously a question they got
wrong, which is testing rather than teaching. Browsing must also not move the
retention figure on the home screen — the moment looking counts as knowing, the
number stops meaning anything.

It is driven by a list beside the map rather than by the map alone, because the
map cannot reach everything: 77 of the 80 cities have a neighbour closer than a
fingertip (ADR-022). The list works at any density, on any device, and is
keyboard-navigable without being made so. The map still takes taps for what it
can show.

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
- The bliksemronde clock is still the one time _limit_ in the product, and the
  tijdrit's stopwatch is deliberately not one: it ends nothing, takes no question
  away, and the round waits as long as the child needs. That is why it is offered
  without K10's clock setting and the bliksemronde is not (ADR-090).
  WCAG 2.2.1 asks that limits be adjustable, with an exception where the limit
  is essential to the activity — and there it is the activity: a bliksemronde
  without a clock is wijs aan. Nothing a child needs is behind it, because the
  same content is in five untimed modes. Both clocks are text, never a bar or a
  colour alone, and neither is in a live region: announcing every second would
  make a round unusable with a screen reader rather than more accessible.
- `prefers-reduced-motion` is honoured, and that path removes movement, not
  feedback: a wrong answer still shows the line to the right place, it just
  stops travelling along it.
- There is no dyslexia font setting. It was built and then removed (ADR-020):
  the evidence for OpenDyslexic over a well-set standard face is thin, and what
  does help — line height, line length, contrast, and the read-aloud button on
  every question — is in the design itself rather than behind a switch.

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
  §8. It reports rather than fails, so the number stays visible without a red
  build. Framer Motion has since been removed (ADR-021): the animations that
  needed it turned out to be CSS keyframes.

The negative RLS tests from the original draft are deferred with the database
they were protecting.

## 9. What returns when accounts arrive

Kept intentionally reversible, each with a live ADR:

| Then needed                                                 | Deferred ADR |
| ----------------------------------------------------------- | ------------ |
| Pupil sign-in without e-mail (class code + PIN, custom JWT) | ADR-002      |
| Server-authored rounds and validated scores                 | ADR-003      |
| Divisions gated on player population                        | ADR-009      |
| Retention anchored on class archival                        | ADR-012      |
| Payments behind a provider interface                        | ADR-013      |
