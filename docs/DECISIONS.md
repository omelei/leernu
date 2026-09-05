# Architecture decision records — TopoKampioen

One record per decision that would be expensive to reverse. A record is never
edited once accepted — it is superseded by a new one. Records still `proposed`
may be resolved in place, which is what happened to most of these on 2026-09-05.

Status values: `proposed`, `accepted`, `rejected`, `deferred`,
`superseded by ADR-nnn`.

**Decisions taken by the product owner on 2026-09-05:** ADR-001 (Codespaces),
ADR-014 (scope: app only, no commercial model, no classes), ADR-016 (no class
streak), ADR-004 accepted, and ADR-006, ADR-009 and ADR-010 rejected in favour
of the original specification.

---

## ADR-001 — Build environment

**Status:** accepted — GitHub Codespaces.

### Context

Measured on the drafting machine: `registry.npmjs.org` returns `E403` to npm and
fails TLS to curl; alternative registries do not respond; `cdn.jsdelivr.net`,
`esm.sh` and `unpkg.com` return 200. Node 24.18.0 and npm 11.16.0 are installed.
`npm install` cannot run there, so the toolchain cannot be built locally.

### Decision

Develop in GitHub Codespaces. The stack stays exactly as specified: lockfile,
`npm audit`, Playwright browsers and CI on GitHub Actions all behave normally.
The local machine is used for review, content authoring and documentation.

### Consequences

Nothing in the stack has to bend around a network restriction. Content work
(geodata, item sets, copy) can still happen locally, since none of it needs the
registry.

---

## ADR-014 — Scope: build the app, with no commercial model and no class administration

**Status:** accepted. **Supersedes the phasing in spec §10 for now.**
**Date:** 2026-09-05.

### Context

The specification describes a school product: licences, classes, teachers,
pupils, reporting, invoicing. The product owner has decided that this phase
builds the app itself — anyone can play and learn — and that the commercial
model and all class and pupil logic come later.

### Decision

In scope now:

- The content pipeline, Dutch geodata, and the item model.
- The map renderer.
- Single-player modes: wijs aan, hoe heet dit, sleepronde, bliksemronde,
  overleven, ontdekmodus.
- The Leitner engine and the result screen.
- XP, coins, levels, badges, travel stamps, avatar.
- The individual day streak, with freezes and holiday pause.
- Accessibility and i18n from the first commit.

Out of scope until accounts exist:

- Sign-in of any kind, classes, teachers, reporting, assignments.
- Duel and klassenstrijd — both need a second player who is not on this device.
- The weekly ladder and divisions — both need a player population.
- Licences, seats, trials, invoicing, quotes, renewal reports.

### Consequences

The largest consequence is architectural and favourable: with no accounts there
is no personal data, so there is no database, no RLS, no processing agreement
and no subprocessor list to defend. See ADR-015.

The risk is that a local-first v1 becomes hard to graft accounts onto. ADR-015
addresses it directly; it is the thing to get right in this phase.

The business case for the school product is documented separately in
`docs/BUSINESSPLAN.md` and is deliberately not implemented.

---

## ADR-015 — Local-first: no backend in v1

**Status:** accepted (follows from ADR-014).

### Context

Without accounts there is nothing to authenticate, nothing to authorise, and no
shared state. A backend would exist only to store what the device can store.

### Decision

v1 is a static SPA with all state in IndexedDB. No Supabase, no Edge Functions,
no database. Hosting is static, in the EU. Nothing about a player leaves the
browser.

Two rules keep later accounts affordable:

1. The local store uses the **same row shapes** as the future server tables, so
   adding accounts means uploading rows rather than transforming them.
2. Scoring and scheduling live in one pure module, `packages/game-core`, with no
   browser dependencies, so the server can import the same code when scores must
   be validated server-side.

### Consequences

No cross-device progress, no reporting, no leaderboards — all arrive with
accounts. Offline support becomes nearly free, which on a school network may be
the most noticeable quality of the product. Privacy stops being a set of
controls to prove and becomes a property of the architecture.

---

## ADR-016 — No class streak

**Status:** accepted. **Supersedes ADR-007.**

### Context

Spec §4.3 proposed a class streak that breaks unless ≥80% of the class practises.
ADR-007 proposed softening it. The product owner has decided to drop it.

### Decision

The class streak does not exist. The individual day streak stays, with automatic
freezes (one per week, maximum two saved) and the holiday pause.

### Consequences

Removes the mechanic that could make a sick child visibly responsible for the
group's loss, and removes it entirely rather than mitigating it. It is also
moot in this phase, since there are no classes. If a group mechanic is wanted
when classes arrive, it starts from a counter that only rises — never a
breakable run.

---

## ADR-004 — Geometry is projected in the content pipeline

**Status:** accepted.

### Context

Spec §2 puts `d3-geo` in the app. Spec §8 sets a 300 kB gzipped budget and 60 fps
on Chromebooks.

### Decision

Project offline. Region sets ship pre-projected into a 0–1000 view box at three
mapshaper-simplified detail levels. `d3-geo` is a build dependency only.

Correction carried by this ADR: the Netherlands uses a **stereographic**
projection, not a conic one. RD (Amersfoort / EPSG:28992) is oblique
stereographic; we use `geoStereographic` rotated on 5°23′E / 52°09′N.

### Consequences

Changing a projection means re-running the pipeline and committing new files —
the right friction, because a projection change is a content event. Zoom is
bounded by the shipped detail levels.

---

## ADR-005 — Leitner over SM-2

**Status:** accepted (as specified).

Boxes 1–5, intervals 1/2/4/8/21 days, wrong answers return to box 1 and reappear
after three other questions in the same session, rounds mix 70% due / 20% new /
10% refresh.

The right call for this content size, and it has a property SM-2 lacks: it can
be explained to a teacher in one sentence. That matters, because the mastery
percentage derived from box level is the number a teacher will eventually act
on. An algorithm nobody can explain makes a report nobody trusts.

---

## ADR-006 — Typed answers: flat Levenshtein ≤ 1, as specified

**Status:** rejected (the proposed alternative was declined; spec §4.1 stands).

### Context

The proposal was to allow a one-edit typo only when no other item in the set was
also within one edit, because Dutch toponyms include real pairs one edit apart:
**Ede / Epe** and **Hoorn / Doorn**.

### Decision

Build it as specified: normalise for case, accents and whitespace, then accept a
Levenshtein distance of 1.

### Consequences

Recorded plainly so it is not a surprise later: a child who answers "Epe" when
the answer is Ede will be told they are correct, and a child who answers "Doorn"
for Hoorn likewise. In a learning product that teaches the wrong fact at the
moment the child is most receptive.

The mitigation is cheap and does not need a decision now: `validate:content` will
report every pair within distance 1 in each region set, so the size of the
problem is visible rather than theoretical. If that list is short, an exception
table is a small change; if it is long, this ADR is worth revisiting.

**Found while building, 2026-09-05.** Plain Levenshtein counts a swapped pair of
letters as two edits, so "Utrehct" for Utrecht is *rejected* — and transposition
is one of the most common mistakes a ten-year-old makes at a keyboard. The
tolerance therefore forgives the error that teaches a wrong fact (Epe for Ede)
and refuses the error that teaches nothing (Utrehct for Utrecht), which is
exactly backwards from what the tolerance was for.

Accepting transpositions needs Damerau-Levenshtein. That is a real option, but it
is a decision rather than a fix: it widens the collision problem above at the
same time. Both behaviours are pinned as tests, so whichever way this goes, the
test names the decision instead of leaving a mystery.

---

## ADR-009 — Divisions as specified

**Status:** rejected as an alternative; **deferred** with accounts.

The proposal to gate divisions on player population was declined. Divisions
require classes and a player base, both out of scope under ADR-014, so nothing
is built either way in this phase.

The concern is preserved for when it becomes live: with a small pilot
population, a division of ~15 comparable players will contain four people, and
cross-school grouping also exposes pupils from different organisations to each
other, which is an access-control question as much as a game-design one.

---

## ADR-010 — Framer Motion stays

**Status:** rejected (the proposed removal was declined; spec §2 stands).

### Context

The proposal was to drop Framer Motion and enforce the 300 kB budget in CI,
because React + Zustand + TanStack Query + Framer Motion + shadcn consumes most
of the budget before a map is drawn.

### Decision

Keep Framer Motion, as specified.

Bundle size is still **measured and reported** in CI against the spec's own
300 kB budget, without failing the build. Measuring a budget the specification
sets is implementing the spec, not deviating from it, and it keeps the trade
visible while the app is small enough to change course cheaply.

### Consequences

TanStack Query is deferred with the backend (ADR-015), which returns part of the
budget for now. The number to watch is the first build that ships a full region
set.

---

## ADR-011 — Curriculum references are data, with a source and a date

**Status:** accepted.

### Context

Spec §3.4 requires curriculum tagging and forbids unverifiable claims. Verified
2026-09-05: SLO delivered definitive concept kerndoelen for *mens en maatschappij*
in November 2025, and the first revised kerndoelen entered law in August 2026.
Geography spans two learning areas — *mens en natuur* and *mens en maatschappij* —
so one kerndoel reference per goal is structurally wrong.

### Decision

`learning_goals.kerndoel_refs` is an array of
`{stelsel, code, versie, bron_url, geraadpleegd_op}`. A new set of kerndoelen is
a data change, never a code change. `docs/CURRICULUM.md` records each source with
its retrieval date and quotes the official wording verbatim.

The app and any future website say "sluit aan bij" and link to the mapping. We
never claim approval, endorsement or certification, because we have none.

### Consequences

The mapping is visible and therefore contestable, which is better than an
unfalsifiable claim. "Voldoet aan de kerndoelen" is not a sentence anyone may
write.

---

## Deferred with accounts and commerce (ADR-014)

Recorded in full in the 2026-09-05 revision history; summarised here because
none of them is built in this phase.

| ADR | Decision | Why deferred |
|---|---|---|
| ADR-002 | Pupils authenticate through a custom JWT, not Supabase Auth, because the spec forbids pupil e-mail while RLS needs an identity | No sign-in exists |
| ADR-003 | Rounds are authored and scored on the server, because a client-written score is forgeable | No leaderboard to forge; `game-core` stays pure so this stays affordable |
| ADR-008 | No free consumer tier, because a self-service account for a minor makes us the controller under a different legal regime | Moot: everyone plays free, and no account exists |
| ADR-012 | Retention hangs on class archival, and deletion is announced before it runs | No stored pupil data |
| ADR-013 | Payments behind a `PaymentProvider` interface; schools pay on invoice with SEPA | No commercial model |
