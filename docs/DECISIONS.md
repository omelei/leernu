# Architecture decision records — Leernu

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

The business case for the school product is documented separately, outside this
repository — it holds pricing and competitor analysis, and this repository is
public so that the privacy claim on the home screen can be checked rather than
believed. It is deliberately not implemented either way.

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
2. Scoring and scheduling live in one pure module, `src/game-core`, with no
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

## ADR-021 — Remove Framer Motion and Zustand

**Status:** accepted 2026-09-06. **Supersedes ADR-010.**

### Context

Both were chosen on paper and neither was ever imported.

ADR-010 kept Framer Motion at the owner's request, against a proposal to drop
it. That decision was about how animations should be written. In the event the
only animation this product has — the dot travelling from a wrong answer to the
right one — turned out to be eleven lines of CSS keyframes, so the library sat
in `package.json` with no code behind it.

Zustand was promised by ARCHITECTURE for round state. The round turned out to be
a small state machine owned by a single screen, and a store would have been
ceremony around four `useState` calls.

### Decision

Remove both. Runtime dependencies are now `react`, `react-dom` and `idb`.

### Consequences

No bundle change: neither was imported, so neither was ever shipped. What goes
is maintenance and `npm audit` surface — two libraries nobody has to keep
current, upgrade, or explain to a security review.

Both stay listed in the `no-restricted-imports` rule that keeps `game-core`
pure. If either ever comes back, it still must not come back in there.

This does not reopen the animation question. Should a screen one day need
shared-layout transitions, adding the library back is one command and this
record is the reason it was not there.

---

## ADR-022 — A set may be larger than a round, and larger than the map

**Status:** accepted 2026-09-06.

### Context

The first four sets have between five and twelve items. Everything in the app
quietly assumed that: a round asks the whole set, and the map draws every answer
at once. Both assumptions were reasonable and both are wrong for the eighty
cities.

Measured, on a map 640 px tall:

- 77 of the 80 cities have another city closer than the 48 px touch target.
  Beverwijk and Heemskerk land 6 px apart. A round of fifteen drawn at random
  contains an unhittable pair 99.9% of the time, so sampling does not rescue it.
- Eighty questions is roughly twenty minutes with no stopping point.

Neither is a content problem. The cities are the cities; the population ranking
is reproducible and the set is right. It is the two assumptions that have to go.

### Decision

**A round is capped at fifteen questions.** Sets of twelve or fewer are still
asked in full — "ik ken ze allemaal" stays true where it can be true — and a
larger set is sampled by the Leitner scheduler and met again next round, which
is what spaced repetition is for.

**Nothing answerable is drawn closer to another answer than `MIN_TOUCH_PX`.**
`reachablePoints` in `game-core/map.ts` keeps the target, then takes the rest in
input order and drops any that would crowd one already kept. For the cities that
is around 26 of 80 on a phone and more on a Chromebook, because the rule is in
pixels and therefore scales with the device.

Input order is descending population, so the neighbour that survives is the
better-known one: a child answering near Rotterdam is offered Rotterdam, not
Schiedam. The result is returned in input order, never target-first — a renderer
that draws the answer first hands it to the first child who presses Tab.

### Consequences

For the twelve capitals and six bodies of water nothing changes; they already
clear the threshold, by 1 px and 5 px respectively. That margin is luck, and the
rule now protects them from a future reprojection quietly eating it.

The cost is real and worth naming: a child asked about Heemskerk does not see
Amsterdam on the map that round. We accept an incomplete map over an
unanswerable one. The alternative that would show everything is pan and zoom,
which is a larger change to the central interaction than this set justifies on
its own — when a second dense set arrives, that is the decision to revisit.

---

## ADR-023 — No sleepronde

**Status:** accepted 2026-09-06, by the product owner. **Removes a mode from the
spec's list.**

### Context

The spec lists a sleepronde among the six modes: drag a name onto the right
place on the map. It is the idiom Topomania and Seterra both use, so it is what
a school recognises, and children like dragging things.

Four things weigh against it, and the first is not a preference.

**WCAG 2.2 added 2.5.7 Dragging Movements at level AA.** Every dragging
movement must have a single-pointer alternative. Here that alternative can only
be "tap the name, tap the place" — which, ordering aside, is wijs aan. The
distinctive interaction has to ship alongside a near-duplicate of a mode we
already have, and the duplicate is the one that has to work everywhere.

**Dragging is the least reliable interaction on a phone.** The hand covers the
target on the way to it. With the 26 city points a dense set can show
(ADR-022), a child drags blind.

**It tests something we are not teaching.** The child still has to know where
the place is; the drag adds a motor demand on top. In groep 6 that turns fine
motor control into a confound — we would be measuring aim.

**It is the most expensive of the six.** Pointer capture, drop targets, hit
testing against SVG paths, plus a keyboard route and a screen-reader route that
each have to be correct on their own.

### Decision

No sleepronde. `ModeId` loses the member: the type lists modes that exist, and a
value nothing can produce is a trap for the next person writing an exhaustive
switch. No attempt row has ever carried it, so nothing stored needs migrating.

### Consequences

Five modes instead of six, and the spec's list is now one item shorter than what
we build — recorded here rather than quietly dropped.

The tactile version is not impossible, it is blocked on the same thing ADR-022
named: pan and zoom. With a zoomed map, dragging has room and the drop target is
big enough to be honest. If a second dense set makes zoom worth building, this
decision is worth reopening at the same time.

---

## ADR-020 — No dyslexia font setting

**Status:** accepted 2026-09-06, by the product owner.

### Context

Spec §8 asks for "optie voor een dyslexievriendelijk lettertype", and phase 0
shipped one: a switch that swapped the interface to OpenDyslexic. Seeing it in
the running app, the owner called it surplus and asked for it to go.

### Decision

Removed: the switch, the setting, the OpenDyslexic files, the CSS hook and the
end-to-end test that covered it.

### Consequences

This is a deviation from the specification, recorded as one. It is defensible on
the evidence rather than only on preference: controlled studies have generally
not found OpenDyslexic to improve reading speed or accuracy for dyslexic readers
over a well-set standard face, and Source Sans 3 — a humanist sans with open
apertures and distinct letterforms — is already a good one. A setting that costs
a screen, a file and a test while doing little is worth losing.

What genuinely helps dyslexic readers stays and is not negotiable: generous line
height, short lines, high contrast, no justified text, and the read-aloud button
on every question. If the font question returns, the honest form of it is a text
size control, which helps every reader and can be tested.

---

## ADR-019 — Province boundaries come from CBS, not Bestuurlijke Gebieden

**Status:** accepted 2026-09-05.

### Context

The obvious source for Dutch province outlines is PDOK Bestuurlijke Gebieden.
Point-in-polygon tests on the raw data showed its `provinciegebied` polygons
include the water assigned to each province: the IJsselmeer falls inside
Noord-Holland, the Markermeer inside Flevoland, the Waddenzee inside Fryslân.

That is two problems, and the second is the serious one. The map draws the
IJsselmeer as land; and in "wijs Noord-Holland aan", a child clicking the middle
of the IJsselmeer is told they found the province correctly. The IJsselmeer is
itself something spec §3.1 says they must learn.

It is the same failure as accepting Epe for Ede (ADR-017): the system rewards an
answer that is geographically wrong, at the moment the child is most receptive.

### Decision

Use CBS Gebiedsindelingen (`provincie_gegeneraliseerd`), delivered through PDOK.
Land only, verified by the same point tests. CC-BY-4.0, declared by the service's
own GetCapabilities, attribution "Bron: CBS, Kadaster".

Label placement uses CBS `provincie_labelpoint` rather than a computed centroid,
because a centroid falls in the water for a concave province like Zeeland.

### Consequences

More rings survive — 104 against 42 — because islands are no longer swallowed by
the water around them, so the Wadden islands and the Zeeland delta are real
shapes a child can point at. Output grew to 18/45/110 kB across the three detail
levels, which is geodata loaded per region set and not part of the app shell.

Bestuurlijke Gebieden stays useful for a different question: if there is ever an
exercise about administrative division rather than geography, "which province
manages this stretch of water" is exactly what it answers.

Recorded in full in `docs/DATA_SOURCES.md`, with the test results.

---

## ADR-018 — The content pipeline owns its projection and simplification

**Status:** accepted 2026-09-05. **Amends ADR-004.**

### Context

ADR-004 put `d3-geo` in the pipeline as a build dependency. That works, but the
pipeline then only runs where npm can install — which in this project means a
Codespace, so every iteration costs a round trip through the product owner.

The reason that matters more here than for most code: **a subtly wrong projection
produces a map that looks entirely plausible and is wrong.** It is the failure
nobody catches in review, and a child learns it anyway.

### Decision

Write the projection and simplification in `tools/content/`, with no
dependencies:

- `projection.mjs` — spherical oblique stereographic on the RD centre
  (52.15616055 N, 5.38763889 E), plus aspect-preserving fitting into a 0–1000
  view box. This is RD's _shape_, not RD: no ellipsoid, no false origin, no
  metre scale, which is all a map for children needs.
- `simplify.mjs` — iterative Ramer-Douglas-Peucker plus a minimum-area filter,
  run **after** projection so a tolerance means the same thing everywhere.
  Simplifying in degrees would make the north coarser than the south.
- `preview.html` — renders the built output so the result can be looked at.

Output is SVG path data rather than coordinate arrays: about half the size, the
renderer hands it straight to a `<path>`, and hit testing comes free from the
browser's own `isPointInFill`.

### Consequences

Roughly seventy lines we now own instead of a library thousands of people use.
Bought with it: the pipeline runs anywhere, and the output was verified before
anyone else saw it — positions checked against the four compass extremes, then
rendered and looked at. That check is what found ADR-019.

---

## ADR-017 — Typed answers: never accept another real place

**Status:** accepted 2026-09-05. **Supersedes ADR-006.**

### Context

ADR-006 kept spec §4.1's flat Levenshtein tolerance of one. Building it exposed
that the tolerance behaves exactly backwards from its purpose:

- It **accepts** `Epe` for Ede and `Doorn` for Hoorn — different real places, one
  edit apart. The child is told they were right and learns a false fact at the
  moment they are most receptive.
- It **rejects** `Utrehct` for Utrecht, because plain Levenshtein counts a
  swapped pair of letters as two edits — and transposition is one of the most
  common mistakes a ten-year-old makes at a keyboard.

The product owner has ruled the first of these unacceptable.

The insight that resolves both at once: **a collision guard is what makes it safe
to be more generous about genuine typos.** Without a guard, widening the
tolerance widens the damage. With one, the only answers that can be accepted are
those that cannot be confused with something else we teach.

### Decision

Answer judging returns three outcomes, not two. In order:

1. **Normalise** — case, accents, punctuation, spacing, leading article.
2. **Exact match on the target** (name or alias) → **correct**, exact.
3. **Exact match on any other item in the region set** → **near-miss**. A child
   who writes the name of a different real place has given an answer, not made a
   typo. This is checked before any fuzzy matching, and it is never correct.
4. **Distance to the target > 1** → **wrong**.
5. **Distance ≤ 1, but some other item in the region set is also within 1** →
   **near-miss**, naming the item it collides with.
6. **Distance ≤ 1 and unambiguous** → **correct**, not exact.

Two supporting rules:

- **Distance is Damerau (optimal string alignment)**, so an adjacent swap costs
  one edit and `Utrehct` is accepted. This is only safe because of steps 3 and 5.
- **The comparison set is the whole region set, not the current round.** An
  answer must not be correct or incorrect depending on which questions happened
  to come up; a child cannot see that distinction and would be right to call it
  unfair.

A near-miss is scored as wrong — Leitner sends the item back to box one — but it
is _shown_ differently: "Je schreef Epe. Dat bestaat ook! Maar wij zochten Ede."
That sentence is the entire point of the change. The near-miss is the teachable
moment, and the old behaviour threw it away by calling it correct.

### Consequences

`judgeAnswer` needs the region set, not just the item, so every calling mode has
to pass it. That is a slightly wider signature in exchange for a guarantee that
cannot be expressed any other way.

One residual risk, stated rather than hidden: the guard protects against places
**we teach**. If a child types a real place that is not in any of our content,
nothing knows it is a real place, and it may still be accepted as a typo. The
escape hatch is a per-item list of spellings never to accept, which is a content
change and needs no code. It is not built now, because there is no evidence yet
about which pairs actually occur.

`validate:content` reports every pair within one edit in a set. Under ADR-006
that list was a warning; now it is a list of pairs the guard is actively
protecting, which is worth seeing for a different reason: those items will never
accept a typo, because any typo of one is ambiguous with the other.

---

## ADR-006 — Typed answers: flat Levenshtein ≤ 1, as specified

**Status:** superseded by ADR-017 (2026-09-05). Kept because the reasoning that
led to it, and the evidence that overturned it, both matter.

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
letters as two edits, so "Utrehct" for Utrecht is _rejected_ — and transposition
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

**Status:** superseded by ADR-021 (2026-09-06). Kept because the reasoning that
led to it, and what actually happened afterwards, both matter: it was kept on
request and then never imported once.

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
2026-09-05: SLO delivered definitive concept kerndoelen for _mens en maatschappij_
in November 2025, and the first revised kerndoelen entered law in August 2026.
Geography spans two learning areas — _mens en natuur_ and _mens en maatschappij_ —
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

| ADR     | Decision                                                                                                                       | Why deferred                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ADR-002 | Pupils authenticate through a custom JWT, not Supabase Auth, because the spec forbids pupil e-mail while RLS needs an identity | No sign-in exists                                                        |
| ADR-003 | Rounds are authored and scored on the server, because a client-written score is forgeable                                      | No leaderboard to forge; `game-core` stays pure so this stays affordable |
| ADR-008 | No free consumer tier, because a self-service account for a minor makes us the controller under a different legal regime       | Moot: everyone plays free, and no account exists                         |
| ADR-012 | Retention hangs on class archival, and deletion is announced before it runs                                                    | No stored pupil data                                                     |
| ADR-013 | Payments behind a `PaymentProvider` interface; schools pay on invoice with SEPA                                                | No commercial model                                                      |
