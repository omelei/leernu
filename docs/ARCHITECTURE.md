# Architecture — TopoKampioen

Status: draft, phase 0. Written before any code, per spec §13.
Last updated: 2026-09-05.

The product name is a working title. Everything user-visible reads it from
`src/config/brand.ts`; no component hardcodes it. White-labelling later is a
config change, not a refactor.

## 1. The one constraint that shapes everything

School networks are slow, school devices are weak, and school IT blocks things.
Every architectural choice below follows from that, and from a second rule that
overrides convenience: **no request leaves our own origin while a pupil is using
the app.** No CDN fonts, no tile server, no analytics, no error reporter that
sees a pupil's screen. This is not only privacy hygiene — it is the answer we
give a school's data protection officer, and that officer is the real gatekeeper
on every deal.

## 2. Shape

```
                        ┌──────────────────────────────┐
   Chromebook / iPad    │  SPA (React 18, TS strict)    │
   Digibord             │  Vite build, self-hosted      │
                        │  fonts, no third-party JS     │
                        └──────────────┬───────────────┘
                                       │ HTTPS, own origin
                        ┌──────────────┴───────────────┐
                        │  Supabase (eu-central-1)      │
                        │  Postgres + RLS               │
                        │  Auth (teachers/admins only)  │
                        │  Edge Functions (trusted)     │
                        │  Realtime (klassenstrijd)     │
                        └───────────────────────────────┘
```

Static assets and geodata ship from the same origin as the app. Database,
backups and logs stay in the EU (Frankfurt). Every subprocessor is listed in
`docs/SUBVERWERKERS.md` before it is switched on, not after.

## 3. Two places where Supabase's default model does not fit this product

Supabase's normal pattern is: the client holds an anon key and talks to Postgres
directly, RLS decides what it may see. That is fine for most apps. Here it
breaks twice, and both breaks have to be designed in phase 0 — retrofitting
either one is a rewrite.

### 3.1 Pupils are not Supabase Auth users

A pupil signs in with a class code, a name picked from a list, and a 4-digit
PIN. There is no e-mail, so there is no `auth.users` row, so there is no JWT,
so there is nothing for RLS to key on.

The design:

1. `POST /auth-student` (Edge Function) receives class code + student id + PIN.
2. The function verifies the PIN against `students.pincode_hash` (argon2id),
   rate-limited per class code and per IP hash.
3. It mints a short-lived JWT signed with the project's JWT secret, carrying
   `role: 'student'`, `student_id`, `class_id`, `organisation_id`.
4. RLS policies read those claims via `auth.jwt() ->> 'student_id'`.

A 4-digit PIN is weak by construction — 10 000 combinations. It is the right
trade-off for eight-year-olds, but it means the rate limiter is a real security
control, not a nicety: lock a pupil slot after 10 failures, lock a class code
after 50, and log both to `audit_log`. A leaked class code plus brute force is
the realistic attack, and it is the one we must make boring.

### 3.2 The client may not write its own score

Spec §4.6 requires server-validated scores. If the client can `insert` into
`attempts` or `sessions`, it can claim anything, and any child who opens the
network tab will eventually find that out — in a product built around a
leaderboard, that is not hypothetical.

So the round is server-authored:

1. `POST /session-start` — the server picks the item set (Leitner mix, §4.2),
   stores it in `sessions.item_set`, and returns the questions without the
   answer key wherever the mode allows it.
2. The client plays and buffers answers locally (also what makes §8's
   "a dropped connection must not ruin a round" work).
3. `POST /session-submit` — the server re-checks each answer against its own
   stored item set, rejects response times below a plausibility floor, computes
   the score, writes `attempts` + `sessions` + `item_states` in one transaction,
   and returns the result screen's data.

RLS on `attempts` and `sessions`: pupils get `select` on their own rows, and no
`insert` or `update` at all. Only the service role writes there.

The cost is honest: one round trip at the start, one at the end, and the game
logic exists twice (client for feel, server for truth). Sharing the scoring
module between both sides keeps that from drifting — it lives in
`packages/game-core`, imported by the SPA and by the Edge Functions.

## 4. Maps without a tile provider

GeoJSON rendered as SVG, no tiles. That is the spec's call and it is the right
one: no per-view cost, no external requests, fully themeable, and it works on a
network that blocks half the internet.

Two refinements to how the spec describes it:

- **Projection happens in the content pipeline, not in the browser.** We ship
  coordinates already projected into a 0–1000 view box per region set. `d3-geo`
  stays a build dependency; it never reaches the bundle. On a 2018 Chromebook
  that is the difference between a map that pops in and one that hitches.
- **The Netherlands uses a stereographic projection**, not a conic one. The spec
  says "RD-achtige conische projectie", but RD (Amersfoort / EPSG:28992) is
  oblique stereographic. We use `geoStereographic` rotated on 5°23′E / 52°09′N.
  At this scale the visual difference from a conic is under a pixel — the reason
  to get it right is that these docs will be read by someone who knows.

Detail levels: every region set is simplified with mapshaper into `overview`,
`region` and `detail`, committed as versioned files under `content/geo/`. The
renderer picks a level from viewport size and zoom. Hit testing uses the
rendered path, with a minimum touch target of 44 px enforced by an invisible
buffer path for small provinces and island groups — Vlieland must be as tappable
as Gelderland.

Mercator is used only where a global view demands it, and where it is used the
app says out loud that it distorts area. That sentence is didactic content, not
a disclaimer: a topography app that quietly teaches children Greenland is the
size of Africa has failed at its own subject.

## 5. Front-end structure

```
src/
  config/brand.ts        product name, colours, feature flags
  game/
    modes/               one file per GameMode plugin (§4.1)
    core/                scoring, Leitner, answer normalisation (shared)
    map/                 SVG renderer, hit testing, projection consumer
  features/
    student/  teacher/  admin/
  i18n/                  nl.ts from day one; keys never inline
  lib/
```

State: Zustand for the live round (it is a state machine, and it must survive a
lost connection). TanStack Query for everything server-owned. The two never hold
the same fact.

Modes implement one interface, registered in a map:

```ts
interface GameMode {
  id: ModeId;
  buildRound(items: Item[], ctx: RoundContext): Question[];
  scoreAnswer(q: Question, a: Answer): AnswerResult;
  Component: React.FC<GameModeProps>;
}
```

A new mode is a new file plus a registry line. `scoreAnswer` is pure and runs on
both client and server — that is what makes §3.2 affordable.

## 6. Accessibility (WCAG 2.2 AA) on a map

The hard part of this product's accessibility is that the primary interface is a
picture. Colour may never be the only carrier of meaning (§8), which on a map
means:

- Every region is reachable by keyboard in a defined order, with a visible focus
  ring drawn outside the shape.
- Correct and incorrect are signalled by icon and text, not only by fill colour.
- Each region carries an accessible name, and in "wijs aan" the question is
  announced through a live region.
- The read-aloud button uses the browser's own SpeechSynthesis — no cloud TTS,
  because a cloud TTS receiving question text is a subprocessor.
- A dyslexia-friendly font and `prefers-reduced-motion` are settings, and the
  reduced-motion path removes movement, not feedback.

## 7. Offline and flaky networks

Answers buffer in IndexedDB during a round and flush on `session-submit`, with
retry. A round survives a tunnel. What does not survive is starting a round
while offline — that needs the server's item set. Accepted for v1; a fully
offline mode would mean shipping the answer key to the client, which reopens
§3.2.

## 8. Testing

- Vitest for `game-core`: Leitner transitions, answer normalisation, scoring.
- Playwright for the three flows in the spec, plus the negative RLS tests.
- pgTAP (or plain SQL assertions in CI) proving that pupil A cannot read pupil
  B — written so it fails loudly if a policy is ever dropped.
- k6 for 30 concurrent pupils in a live klassenstrijd.

CI runs `validate:content` on every push. A broken geometry reference must never
reach a classroom.

## 9. Known open questions

Tracked as ADRs in `DECISIONS.md`, not resolved here:

- The build environment: this machine cannot reach the npm registry (ADR-001).
- Whether phase 2 ships without divisions until there is a player population.
- Which curriculum reference set to map against, now that the new kerndoelen
  entered law in August 2026 and geography sits across two learning areas.
