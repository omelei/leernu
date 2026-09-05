# Architecture decision records — TopoKampioen

One record per decision that would be expensive to reverse. Format: context,
decision, consequences, status. A record is never edited after it is accepted —
it is superseded by a new one.

Status values: `proposed` (waiting for the product owner), `accepted`,
`superseded by ADR-nnn`.

---

## ADR-001 — Build environment: this machine cannot install the toolchain

**Status:** proposed — needs a decision before phase 0 can start.
**Date:** 2026-09-05.

### Context

The chosen stack (Vite, Tailwind, shadcn/ui, Vitest, Playwright, the Supabase
CLI) is installed from the npm registry. Measured on this machine today:

| Host | Result |
|---|---|
| `registry.npmjs.org` (npm client) | `E403 Forbidden` |
| `registry.npmjs.org` (curl) | TLS failure, no response |
| `registry.npmmirror.com`, `registry.yarnpkg.com` | no response |
| `cdn.jsdelivr.net`, `esm.sh`, `unpkg.com` | HTTP 200 |

Node 24.18.0 and npm 11.16.0 are present. The network permits a small set of
CDN hosts and blocks package registries. Playwright additionally downloads
browser binaries from its own host, which is almost certainly blocked too.

This is not a preference. `npm install` cannot run here, so phase 0 as written
in spec §10 — repo, CI, linting, test stack — cannot be completed on this
machine.

### Decision

Proposed, for the owner to choose between:

- **A. Build elsewhere (recommended).** GitHub Codespaces, or any machine on a
  network without the registry block. CI on GitHub Actions installs
  dependencies normally, so the pipeline is unaffected either way. This keeps
  the stack in spec §2 exactly as specified.
- **B. Get the registry unblocked** on this network. Cleanest long-term, but it
  is an IT request with an unknown lead time, and it blocks phase 0 until then.
- **C. Vendor dependencies from jsDelivr** into the repo and build without npm.
  Technically possible — a sibling project in this account does exactly that —
  but it means no lockfile, no `npm audit`, no Playwright, and a hand-maintained
  dependency tree for a product that will be sold to schools and eventually
  needs a penetration test. Not recommended for anything commercial.

Documentation and content work (this phase: the three docs, the content schema,
the validator design, geodata sourcing) proceed regardless — none of it needs
the registry.

### Consequences

Under A, the repo is developed remotely and this machine is used for review and
content authoring only. Under C, spec §11's definition of done ("CI green",
"unit and e2e tests") cannot be met, so C would also require amending §11.

---

## ADR-002 — Pupils authenticate through a custom JWT, not Supabase Auth

**Status:** accepted (follows directly from the spec's own constraints).

### Context

Spec §1 forbids pupil e-mail addresses; §6 requires RLS on every table. Supabase
RLS keys on `auth.uid()`, which requires an `auth.users` row, which requires an
identifier the spec forbids.

### Decision

An Edge Function verifies class code + pupil + 4-digit PIN (argon2id) and mints
a short-lived JWT with `student_id`, `class_id` and `organisation_id` claims.
RLS policies read those claims. Pupils never receive the service role key.

### Consequences

We own token issuance, expiry and revocation, including the rate limiting that a
4-digit PIN makes load-bearing: 10 failures locks a pupil slot, 50 locks a class
code, both logged. This must be built in phase 0 — every later table inherits
these policies, and retrofitting the claim shape means rewriting all of them.

---

## ADR-003 — Rounds are authored and scored on the server

**Status:** accepted.

### Context

Spec §4.6 requires server-validated scores. Supabase's default pattern has the
client writing directly to Postgres, which would make the leaderboard trivially
forgeable by any child who finds the network tab.

### Decision

`session-start` composes the question set server-side and stores it with its
answer key in `sessions.item_set`. The client plays against a copy without the
key where the mode allows. `session-submit` re-scores every answer server-side,
rejects implausible response times, and writes `attempts`, `sessions` and
`item_states` in one transaction. Pupils have no insert or update on those
tables.

### Consequences

Scoring logic exists in two places and must not drift, so it lives in one shared
pure module (`packages/game-core`) imported by both the SPA and the Edge
Functions. A round costs two round trips. Starting a round requires
connectivity; finishing one does not.

---

## ADR-004 — Geometry is projected in the content pipeline, not in the browser

**Status:** accepted.

### Context

Spec §2 puts `d3-geo` in the app for projection. Spec §8 sets a 300 kB gzipped
bundle budget and a 60 fps interaction target on Chromebooks.

### Decision

Project offline. Region sets ship as pre-projected coordinates in a 0–1000 view
box, at three mapshaper-simplified detail levels. `d3-geo` is a build dependency
and never enters the bundle.

Correction to the spec while we are here: the Netherlands uses a **stereographic**
projection, not a conic one. RD (Amersfoort / EPSG:28992) is oblique
stereographic; we use `geoStereographic` rotated on 5°23′E / 52°09′N.

### Consequences

Changing a projection means re-running the pipeline and committing new files,
which is the right friction — a projection change is a content event. Zoom is
limited to what the shipped detail levels support.

---

## ADR-005 — Leitner over SM-2

**Status:** accepted (as specified).

### Context

Spec §4.2 chooses a 5-box Leitner system over SM-2.

### Decision

Adopt it as written: boxes 1–5, intervals 1/2/4/8/21 days, wrong answers return
to box 1 and reappear after three other questions in the same session, rounds
mix 70% due / 20% new / 10% refresh.

### Consequences

The right call for this content size, and it has a property SM-2 lacks: a
teacher can be told how it works in one sentence. That matters, because the
mastery percentage derived from box level is the number the teacher will act on.
If the algorithm is a black box, the report is a black box.

---

## ADR-006 — Typed answers: normalise first, tolerate one typo only when unambiguous

**Status:** proposed.

### Context

Spec §4.1 accepts a typed answer within Levenshtein distance ≤ 1. Dutch
toponyms include real pairs one edit apart: **Ede / Epe**, **Hoorn / Doorn**.
A flat tolerance of 1 marks a genuinely wrong answer correct — and does it in a
learning product, where the child is then taught the wrong fact.

### Decision

1. Normalise: lowercase, strip diacritics, collapse whitespace and hyphens,
   drop a leading article. Compare against `naam` and every alias. An exact
   match after normalisation is correct — this alone handles most of what the
   tolerance was for.
2. Only then apply distance ≤ 1, and **only if no other item in the current
   region set is also within distance 1** of the typed answer. If two candidates
   compete, treat it as wrong and show both: "Je typte *Epe*. Bedoelde je Ede?"

Rule 2 is where the didactics live. The near-miss is the teachable moment, and a
silent "correct" throws it away.

### Consequences

The ambiguity check needs a precomputed near-miss map per region set — cheap,
built once in the content pipeline. `validate:content` reports every pair within
distance 1 so we can see what the map contains.

---

## ADR-007 — The class streak counts up and never names anyone

**Status:** proposed.

### Context

Spec §4.3 wants streaks that do not punish, and adds a class streak that breaks
unless ≥80% of the class practised. The individual protections (freezes, holiday
pause) are good. The class streak reintroduces exactly the pressure they remove,
and makes it social: a sick child can break the group's streak, in front of the
group.

### Decision

Keep the class streak, change what it measures and what it shows.

- No dashboard, screen or export ever shows who did or did not practise as part
  of a streak view. The teacher can see participation in the reports; the class
  cannot.
- Absent pupils are excluded from the denominator when the teacher marks them
  absent, so illness does not count against the class.
- The class metric counts up (days achieved this month) rather than presenting a
  fragile run that resets to zero. A counter that only rises produces the same
  motivation without the loss aversion.

### Consequences

Slightly weaker hook than a breakable streak. That is the intended trade, and it
is the version a teacher will defend to a parent.

---

## ADR-008 — No free consumer tier in v1

**Status:** proposed.

### Context

Spec §7 proposes free individual pupil/parent access as a marketing channel.
Spec §6 and §12 forbid collecting pupil personal data beyond first name and
initial, and forbid unnecessary data "even for later".

Outside a school, there is no school to be the controller and no processing
agreement to sit under. A self-service account needs an identifier, which for a
minor means a parent's e-mail and a consent flow, which makes us the controller,
under a different legal basis, needing our own privacy notice and an age check.

### Decision

Defer. The free tier, if built, comes after phase 6, as a **parent** account
with a parent's e-mail, on separate infrastructure boundaries from the school
product, with its own privacy notice.

For the marketing need it was meant to serve, use a demo account with seeded
fictional data and no registration at all — no personal data, better conversion,
available in phase 1.

### Consequences

Loses one growth channel in year 1. Keeps the school proposition legally simple,
which is the proposition that pays.

---

## ADR-009 — Divisions are gated on player population

**Status:** proposed.

### Context

Spec §4.4 puts pupils in divisions of ~15 comparable players across classes.
With three pilot schools, a division may hold four players, and cross-school
grouping also exposes pupils to pupils from other organisations (see the RLS
note in `DATAMODEL.md` §8).

### Decision

Build the grouping as a function of the available population: below a threshold
(proposed: 40 active pupils at a level), divisions fall back to class or school
scope, and the UI says which scope is in play. Ship divisions in phase 2 behind
a flag, off by default until the population supports them.

### Consequences

The weekly ladder (which is per class, and which is the more important mechanic)
carries phase 2 on its own. Divisions switch on when they are real.

---

## ADR-010 — Drop Framer Motion; keep the bundle budget honest

**Status:** proposed.

### Context

Spec §8 sets ≤300 kB gzipped initial bundle. React + Zustand + TanStack Query +
Framer Motion + shadcn primitives realistically consumes most of that before a
map is drawn, and `d3-geo` was budgeted in too (removed by ADR-004).

### Decision

Use CSS transitions and the Web Animations API for the micro-animations the spec
describes — answer feedback, streak flame, score count-up. None of them need a
layout-animation engine. Split the budget explicitly: ≤200 kB app shell, geodata
lazy-loaded per region set and measured separately, and a CI check that fails
the build when the shell exceeds its budget.

### Consequences

Shared layout transitions become hand-written if we ever want them. In exchange
the budget stays a real constraint rather than one quietly abandoned in week
three, which is what happens to budgets nobody enforces in CI.

---

## ADR-011 — Curriculum references are data, with a source and a date

**Status:** accepted.

### Context

Spec §3.4 requires curriculum tagging and forbids unverifiable claims. Verified
on 2026-09-05: SLO delivered definitive concept kerndoelen for *mens en
maatschappij* in November 2025, and the first revised kerndoelen entered law in
August 2026. Geography spans two learning areas — *mens en natuur* and *mens en
maatschappij* — so a single kerndoel reference per goal is structurally wrong.

### Decision

`learning_goals.kerndoel_refs` is a JSON array of
`{stelsel, code, versie, bron_url, geraadpleegd_op}`. A new set of kerndoelen is
a data migration, never a code change. `docs/CURRICULUM.md` records each source
with its retrieval date and quotes the official wording verbatim.

The app and the website say "sluit aan bij" and link to the mapping. We never
claim approval, endorsement or certification, because we have none.

### Consequences

Teachers can see the mapping and disagree with it, which is better than an
unfalsifiable claim. Sales must be briefed that "voldoet aan de kerndoelen" is
not a sentence we are allowed to say.

---

## ADR-012 — Retention hangs on class archival, and deletion is announced

**Status:** proposed.

### Context

Spec §6 deletes pupil data 12 months after licence end or class archival. Those
two can disagree: a class archived in July under a licence running to December.
Anchoring on the licence keeps data alive that nobody expects to exist.

### Decision

Delete on whichever comes first. The job runs monthly, produces a report of what
it is about to delete, mails it to the school administrator, and only then acts.
Both the report and the deletion are written to `audit_log`.

### Consequences

One month of extra retention on the announced batch. Worth it: silent deletion
of a year of pupil work, even when contractually correct, is how a renewal
conversation turns into a complaint.

---

## ADR-013 — Payments behind a provider interface

**Status:** accepted (as specified).

### Context

Spec §2 chooses Mollie and asks for a `PaymentProvider` interface.

### Decision

Adopt as written. Schools pay on invoice with SEPA transfer as the primary path;
iDEAL is an option, not the default. No card is requested for the trial.

### Consequences

The interface is thin because invoicing is mostly ours, not the provider's:
quote PDF, invoice, dunning and the seat count all live in our domain. Mollie
handles the payment event and little else, which is what makes it replaceable.
