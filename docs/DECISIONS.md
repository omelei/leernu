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

**Decisions taken by the product owner on 2026-09-07**, on business plan v6:
ADR-024 through ADR-031. ADR-032 and ADR-033 follow from building on them,
and ADR-034 through ADR-037 were put to the owner as the questions that
blocked the rest of the work.
Where the app design and the business plan disagree,
the plan wins; where the styleguide and the design disagree, the styleguide
wins.

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

## ADR-024 — Brand language: one slogan, four fixed sentences

**Status:** accepted — business plan v6, 2026-09-07.

### Context

The app design (P3, homepage) carries the slogan "Geleerd blijft geleerd."
Business plan v6 §5.11 replaces it. The design predates the plan, and the source
ranking for this phase is: business plan above styleguide above design.

Two of the four sentences do work the others cannot. The proof line names a
child and a number, which is the only claim on the page a parent can check
against their own child. The conversion line names the thing the parent is
buying their way out of, not the thing we are selling.

### Decision

Four fixed sentences, and they live in `src/config/brand.ts` as data:

- slogan — "Leren om te onthouden."
- heading — "Spelen. Leren. Onthouden."
- proof — "Sofie onthoudt 9 van de 12 provincies."
- conversion — "Nooit meer overhoren."

"Geleerd blijft geleerd" is gone and may not be reintroduced by a component.

The slogan is never set horizontally beside the wordmark. It sits stacked
underneath it, left-aligned. A horizontal lockup turns the slogan into a
descender of the logo and forces it below its own reading size on a 393 px
screen.

### Consequences

A component that needs one of these sentences reads it from `brand`; it may not
compose its own. That is what keeps white-labelling a one-file change, which
`brand.ts` already promises in its own header comment.

---

## ADR-025 — No reading mode, and no flag for one

**Status:** accepted — business plan v6 decision 6, confirmed 2026-09-07.

### Context

The design (K10) shows a reading-mode switch with a live sample beside it, and
styleguide §C specifies the variant in full: letter spacing +4%, word spacing
+16%, line height 1.8×, line length at most 62 characters, headings in the quiet
family, no italics and no capitals.

Business plan v6 drops it. ADR-020 already rejected a dyslexia font setting, so
this is the second accessibility affordance to be declined, and that pattern is
worth being uncomfortable about.

**The counterargument, recorded because a decision without it cannot be
re-judged in two years.** The read-aloud button on every question covers the
child who cannot read the question independently. It does not cover the child
with dyslexia who reads perfectly well and needs nothing but more air between
the letters. For that child, read-aloud is slower than reading and the offer is
beside the point. Declining the reading mode is a real cost to a real group; it
is being declined for scope, not because the need is imagined.

### Decision

Do not build it. Not behind a feature flag either — a switched-off flag is code
nobody runs and nobody tests, and it breaks silently at the first refactor, so
it buys the appearance of readiness at the price of a lie in the codebase.

K10 loses the switch and the sample beside it: two switches, not three.

Styleguide §C keeps the specification as a paper reserve, so that reopening this
is an implementation and not a design round.

What takes its place is not nothing: the base typography must honour the
system's own text-size setting up to 200%, at which point heading-1 wraps to two
lines, the question bar grows with it, and nothing is clipped. That is now the
only typographic accessibility affordance in the product, so it has to actually
work — on all four sizes, tested, not assumed.

### Consequences

If the reading mode is ever reopened, the styleguide already holds the numbers
and the change is a token set plus a switch in the child's profile.

Until then, "we support your system text size" is a claim the app has to survive
being tested on.

---

## ADR-026 — One paid tier, and fourteen free days

**Status:** accepted — business plan v6 §8.1, decision 20.

### Context

The design's pricing page (P2) shows three tiers: Gratis, Basis €49, Compleet
€79. Business plan v6 collapses them.

A middle tier prices the product against itself. The parent who would pay €79
now has a reason to pay €49, and the parent who would pay nothing is not moved
by €49 either — so the tier converts downwards and almost never upwards.

### Decision

One paid tier: €79 per year or €7,95 per month, up to four children. Basis is
dropped. In its place, fourteen days free to try.

The pricing page shows two columns — Gratis and leer.nu — plus the existing
comparison against Squla and Junior Einstein.

### Consequences

The public pages are out of scope for this build (no backend, ADR-015), so this
record governs no code today. It is written now so that the page, when it is
built, is not built from the design file.

---

## ADR-027 — Challenges are free and unlimited; only the friend count is capped

**Status:** accepted — business plan v6 decision 24.

### Context

The design's free tier (K1) shows "1 uitdaging deze week over". A challenge sent
is an invitation to a child who does not have the app yet; metering it meters
our own distribution.

### Decision

No weekly limit on challenges, in either tier. The only limit is the number of
friends: three on the free tier, twenty on the paid one.

### Consequences

The friend layer is out of scope for this build. The constant that would have
carried a weekly quota is never introduced, which is cheaper than removing it
later.

---

## ADR-028 — Seven modules; clock reading is its own, on hue 52°

**Status:** accepted — business plan v6 §5.1 and §5.5, decision 12; hue chosen 2026-09-07.

### Context

The styleguide designs six module accents on one ring — lightness 0.55, chroma
0.125 — and names the second accent "tafels en klok". Business plan v6 splits
those into two modules, each with its own name, entrance, pictogram and accent.
That makes seven, and the seventh needs a hue.

The styleguide's own rule for a new accent: at least 28° from every existing
accent and 20° from the semantic hues (25° red, 78° amber, 150° green). It then
suggests 216°, 262° and 300° as free.

**Those three suggestions are wrong.** Measured in OKLCH, the existing accents
sit at topografie 249.8°, tafels 165.8°, woorden 287.7°, spelling 326.0°,
tijdvakken 108.0°, vlaggen 202.2°, and the semantic hues at fout 24.9°,
aandacht 78.4°, goed 150.1° — the last three exactly as the styleguide itself
notes them, so the measurement agrees with the source. Every hue, chroma and
contrast figure in this record is measured from the hex values, not copied.

Against the 28° rule, 216° is 13.8° from vlaggen, 262° is 12.2° from
topografie, and 300° is 12.3° from woorden. All three fail.

A full scan of the circle at 0.1° resolution leaves two gaps, 24.3° of arc in
total: 44.9°–58.3° (13.4° wide) and 354.0°–4.9° (10.9° wide, bounded by
fout-red).

### Decision

Clock reading takes the wide gap, at hue 52°:

- `--klok` #A9591F — surface; paper on it 4.86:1
- `--klok-text` #823C00 — text; on the tint 6.47:1
- `--klok-tint` #FFE0CD
- `--klok-dark` #E49564 — dark theme; on paper #0F130F 7.84:1

Measured, it sits on the ring at L 0.550 / C 0.125 — the same place as
topografie, woorden and spelling — 55.9° from tijdvakken (the nearest accent),
27.2° from fout-red and 26.3° from aandacht-amber. It clears the styleguide's
own rule on every count, with the least room against amber.

**Amber is tight.** Clock reading may therefore never be the sole distinction
beside an attention message. The styleguide already requires that a module is
always named by pictogram and word as well as by colour; for this accent that
stops being a good habit and becomes a condition of the colour being usable at
all.

### Consequences

**One slot is left.** After clock reading takes 52°, a single 10.9° gap remains,
at 354.0°–4.9°, hemmed in by fout-red. The system runs out at **eight**
modules, not the twelve the styleguide claims — while business plan §5.5 plans a
long tail of biology, road signs and music notation behind the seven.

That tail cannot each have its own accent. Whatever replaces "one module, one
hue" — a shared accent for a family of modules, a second ring at another
lightness, or accents only for the modules that are sold — is a brand decision,
and it has to be taken **before** module eight rather than after. It is recorded
here as an open question. Nothing in this build is designed around an answer to
it.

A second, smaller correction for the styleguide: "one ring, only the hue
differs" is not quite true as built. Measured: tafels C 0.116, tijdvakken
C 0.119, and vlaggen C 0.096 at L 0.565. Vlaggen is visibly less saturated than
the rest because that hue does not fit in sRGB at that chroma. The colours are
right; the sentence about them is not, and vlaggen does read slightly duller
beside the other five.

A third: the dark theme’s neutral, #91A3B5, is noted at 7.66:1 on dark paper
and measures 7.24:1. Still comfortably AA, and far enough off to be a typo
rather than a rounding difference. Light neutral #5C6B7A is noted at 5.29:1 and
measures 5.23:1, which is rounding. Every other ratio in §B — twenty-seven of
twenty-nine pairs — reproduces exactly, so the styleguide’s measurements can be
trusted and these two are worth fixing precisely because the rest are right.

---

## ADR-029 — Module order follows the plan, and the clock does not go last

**Status:** accepted — business plan v6 §5.5.

### Context

The design's module rail runs topo, tafels, woorden, spelling, tijdvak,
vlaggen — the v5 order, from before clock reading was split out.

### Decision

The rail order is: topografie, tafels, klokkijken, woordjes, spelling,
tijdvakken, vlaggen. Six are visible and the seventh sits behind "meer".

Clock reading takes its place third, in the order, rather than being appended.
Appending it would put the newest module where a child stops looking, and the
order is a statement about what the product is for.

### Consequences

The rail renders from an ordered list of modules rather than a hand-written
sequence of components, so an eighth module is a data change.

---

## ADR-030 — One word for retention: "onthouden"

**Status:** accepted — business plan v6 §5.7, decision 4.

### Context

The app today says `home.setMastered` = "{goed}/{totaal} vast". The business
plan names this string specifically as one to repair.

"Vast", "blijft zitten" and "beheersing" are three words for one idea, and two
of them carry school baggage a ten-year-old hears before they hear the meaning.
"Blijft zitten" in particular means being held back a year.

### Decision

One word for retention, everywhere: **onthouden**.

- `home.setMastered` becomes "{goed} van de {totaal} onthoud je".
- The fixed phrasings are "dit onthoud je nu", "nog niet onthouden", and
  "Sofie onthoudt 9 van de 12 provincies".
- "Vast", "blijft zitten" and "beheersing" do not appear in user-facing text.
  "Beheersing" survives only as a percentage in the VO guise, and never in
  anything a parent reads.
- "Score" has exactly one job: the result of one practice test or one duel. It
  is not a word for how much a child knows.

### Consequences

A test fails on a user-facing string containing any of the retired words, so
this is enforced rather than remembered.

---

## ADR-031 — "Vriezer" means one thing: the item status. Streak protection is a "rustdag"

**Status:** accepted — 2026-09-07.

### Context

The word is currently used for two different mechanics.

In the code, a freeze is streak protection: one is earned per week practised, at
most two are saved, and a missed school day spends one instead of resetting the
streak (`src/game-core/streak.ts`, `home.freezes`).

In the design (K9), "in de vriezer" is an item status: something remembered so
well that it will not be asked for months.

One word and one icon for two mechanics is the kind of fault that stays
invisible in review and surfaces the first time a child asks why their freezer
went down on a day they got everything right.

### Decision

**The item status keeps "in de vriezer".** It is the design's own decision and
the stronger metaphor — a thing put away because it is finished — and the
styleguide's icon belongs to it.

**Streak protection becomes "rustdag".** A day off is what it actually is.

The rename goes all the way down, not just to the visible text:

- `StreakState.vriezers` becomes `rustdagen`, `StreakState.vriezerWeek` becomes
  `rustdagWeek`
- `StreakChange.freezesUsed` becomes `rustdagenGebruikt`,
  `StreakChange.freezeEarned` becomes `rustdagVerdiend`
- `MAX_FREEZES` becomes `MAX_RUSTDAGEN`
- `StreakRecord` in the local store, and the future Postgres columns in
  `docs/DATAMODEL.md`, follow
- i18n keys `home.freezes` and `home.freezesMany` become `home.restDay` and
  `home.restDays`; `result.freezeEarned` becomes `result.restDayEarned`

A variable named `vriezers` behind a screen that says "rustdag" is the same
confusion one layer down, where it is harder to find.

The stored record changes shape, so `DB_VERSION` goes to 2 with a migration that
rewrites the streak singleton. Nothing has shipped and the migration will almost
never run, but a field rename that silently reads `undefined` as zero would
erase a child's saved rest days with no error — which is precisely the failure
mode the streak feature exists to avoid.

### Consequences

`docs/DATAMODEL.md` is a living specification and is corrected to match. The
earlier records here are not: ADR-014 and ADR-016 keep the word "freeze",
because an accepted record is superseded rather than edited, and both use the
English name of the mechanic rather than the Dutch word a child reads.

"Vriezer" now appears in exactly one place in the product, and it means one
thing.

---

## ADR-032 — Three hit sizes, and 44 is the one that is a rule

**Status:** accepted — styleguide §D, 2026-09-07.

### Context

`--touch` was a single value of 48px and `brand.minTouchTargetPx` was 48, which
contradicted its own comment ("reachable at 44px on the smallest supported
device") and had no basis in the styleguide.

Styleguide §D has three: 44 as the floor, 56 for PO and for anything touched
with a finger, 72 for the digibord. 48 is none of them. It is the Material
default, which is where it came from.

### Decision

Three tokens: `--touch-min: 44px`, `--touch: 56px`, `--touch-board: 72px`.

**56 wins as the default**, because the app is PO 8-12 and is used with a finger
on a shared school tablet more often than with a mouse. A default of 44 would
make every control legal and none of them comfortable.

`brand.minTouchTargetPx` becomes **44** — the floor, which is what a field named
"min" should hold. The target belongs in CSS, because it changes with the guise
and the screen size; the floor does not change, which is why it is the number
worth stating in code at all.

### Consequences

Buttons and inputs grow from 48 to 56, which is a visible change and the
intended one. `.tk-pill` is still 40 and therefore below the floor; it is left
for the component layer, where it is rebuilt with all its states.

72 stays in the tokens although the digibord is out of scope, so that the size
costs nothing when the school channel opens.

---

## ADR-033 — The type scale is relative; everything else is absolute

**Status:** accepted — 2026-09-07, following ADR-025.

### Context

Styleguide §C writes the type scale in pixels. ADR-025 dropped the reading mode
and left "the base typography follows the system setting up to 200%" as the only
typographic accessibility affordance in the product, with the note that it has
to actually work.

A scale in `px` cannot do that. Every desktop browser exposes a default font
size and it moves `rem`, not `px`. Shipping the scale in pixels would have made
ADR-025's replacement affordance false on the day it was written, and false
invisibly — nothing fails, the text simply never grows.

### Decision

The type scale is declared in `rem` (`--type-*`), with the styleguide's pixel
value in a comment beside each. At the default root size the rendering is
identical, so this is a faithful transcription rather than a reinterpretation.

Everything else stays absolute: spacing, hit targets, corner radii and stroke
widths. 44px is a measure of a fingertip and 1.5px is a hairline between two
provinces; growing either with the reader's text size would make the interface
worse, not more accessible.

`-webkit-text-size-adjust: 100%` stays. It switches off the automatic inflation
phones apply on rotation and does not touch what the reader asked for.

### Consequences

The 200% claim is now testable, and ADR-025 says it must be tested: on all four
sizes, heading-1 wrapping to two lines, the question bar growing with it, and
nothing clipped. That test does not exist yet and is owed with the responsive
shell.

---

## ADR-034 — Levels and XP leave the screen, and nothing takes their place yet

**Status:** accepted — 2026-09-07, on business plan v6 decision 4.

### Context

The plan replaces levels and XP with growth points: this week only, and only
relative to friends. Never an absolute score and never a class position.

The friend layer needs a backend, which ADR-015 rules out, so a number relative
to friends cannot be computed. The build brief's own rule for that case is
explicit: where the design shows a figure the app cannot work out, the element
is not built.

Taken together those two say the level badge on K1 and "Je verdiende {xp}
punten" on K8 come out, and nothing arrives in their place. A weekly growth-point
total without the comparison would be computable, but it would be exactly the
absolute score decision 4 forbids — so the honest options were "nothing" or
"break the rule", not "something smaller".

**The cost, stated rather than glossed over.** This removes every visible reward
from the app for the length of this phase except the travel stamp. A ten-year-old
who liked watching a number climb loses that, and gets it back only when friends
exist. That is a real regression in the thing that brings a child back tomorrow,
accepted because the alternative teaches the child to chase a number the product
has decided is the wrong one to chase.

### Decision

`LevelBadge` and the earned-XP line are removed from the interface.

What remains as feedback is the retention dot — which says what the child now
remembers rather than what they scored — and the travel stamp, which is
computable today because its criterion is four correct in a row and needs
nobody else to exist.

`rewardStore`, `game-core/rewards.ts` and the stored `xp` and `munten` fields
stay exactly as they are. Nothing is deleted. Growth points later are a change
to what is displayed, not a migration.

### Consequences

`levelFor`, `levelProgress` and `xpForLevel` keep their tests and lose their only
caller. That is deliberate: they are correct, they are cheap, and deleting them
would make the friend layer more expensive than leaving them.

`home.level` and `result.earned` leave `nl.ts`.

---

## ADR-035 — "In de vriezer" is box five, and the design's "months" is wrong

**Status:** accepted — 2026-09-07.

### Context

K9 describes an item in the freezer as one remembered so well it will not be
asked for months. The scheduler disagrees: ADR-005's five Leitner boxes run 1, 2,
4, 8 and 21 days, so the longest an item can wait is three weeks.

Three ways out were on the table. A sixth box at sixty days would make the
metaphor literally true, but it changes `game-core` outside step 7b — the one
step permitted to touch it — and it re-opens ADR-005's interval table, which was
chosen to be explainable to a teacher in one sentence. A stricter status inside
box 5 would work, but it would put two different meanings on one criterion,
since four correct in a row is already what earns a travel stamp.

### Decision

**"In de vriezer" is a display status for box 5 and nothing else.** No change to
the schedule, no sixth box, no second criterion.

The design's wording is what is wrong, and it is corrected: an item in the
freezer is not asked **for three weeks**, which is what the app actually does.

### Consequences

The metaphor is weaker than the design intended. Three weeks does not feel like a
freezer, and a child who reads "in de vriezer" may expect longer.

That is the right way round: a promise the scheduler does not keep is worse than
a word that oversells slightly, and the interval is a teaching decision that
should not be moved to rescue a label.

If a sixth box is ever wanted for its own reasons, this record is not in the way
— the status would follow the top box wherever it lands.

---

## ADR-036 — Neighbourhood is content, computed twice over

**Status:** accepted — 2026-09-07, ahead of step 7b.

### Context

Multiple choice is the step between pointing and typing, and its distractors
carry the teaching: an option that borders the right answer is the mistake a
child actually makes, and one from the other side of the country makes the
question easier rather than more instructive. The build brief requires that
neighbourhood come from the geodata rather than a hand-written list, so that a
new set costs nothing to maintain.

No adjacency exists today. `content/geo/_source/*.json` carries polygons and
label points and no relationships at all.

And "borders on" is not one idea. Provinces and waters are areas and share
edges. Cities, capitals and the Wadden islands are points, and no two of them
share an edge — for those the mistake a child makes is about a place that is
_near_, not one that touches.

### Decision

Adjacency is computed in `tools/content` and shipped as data, so `game-core`
stays pure and `distractors.ts` reads a list rather than geometry.

Two rules, chosen by what the item is:

- **Areas** — provinces, waters: a shared boundary, from the polygons.
- **Points** — cities, capitals, islands: the nearest others by distance
  between label points.

Both produce the same shape, an ordered list of item ids per item, so
`distractors.ts` never learns which rule made it.

### Consequences

This is its own commit before step 7b, not part of it. It is more work than the
brief assumes, and burying it inside the multiple-choice step would hide a
content-pipeline change inside a feature change.

The output is regenerated, so it is subject to the same rule as the rest of the
pipeline: it is built, not edited, and a hand correction to it is lost at the
next run.

---

## ADR-037 — The module rail shows the modules that exist

**Status:** accepted — 2026-09-07.

### Context

The rail is navigation on three of the four sizes: 88px on desktop, a bottom bar
on a tablet, and the source of the tab bar's shape on a phone. The design draws
six accents in it. Only topography exists as content.

Drawing six disabled entries would follow the design and show a child where the
product is going. It would also be six promises the app does not keep and six
things to tap that do nothing, on the screen a child sees first.

### Decision

The rail is built from an ordered list of modules and renders the ones that have
content. Today that is one.

The measurements are the design's regardless — 88px rail, the tablet bar at 72
high with 88×56 targets, the phone tab bar — because those are what step 5's four
sizes are laid out against. The rail exists structurally and is simply short.

### Consequences

A rail with one entry looks odd, and that is accurate: the product has one
module. Module two is a row of data and no layout work.

Nothing here decides what the rail does at seven modules — six visible plus
"meer", per ADR-029 — which stays true and untested until there are seven.

---

## ADR-038 — The mark is one component, and the delivered SVGs are not used in the app

**Status:** accepted — 2026-09-07.

### Context

The dot is the logo, the app icon, the highlight on the map, the progress bar,
the retention indicator, the item status and the shape of the "Bijna" answer
state. Fifteen SVGs in `docs/Logo` cover the static uses.

The build brief expected those files to pull Space Grotesk from Google Fonts
with an `@import`, and to be a ship-blocker on that ground. **They do not.**
There is no font reference of any kind in any of the fifteen — checked. The
privacy claim is safe and was never at risk here.

The real flaw is different and smaller. The four wordmark files set the name as
`<text font-family="Space Grotesk, sans-serif">` with nothing attached and
nothing embedded, so they render correctly only on a machine that happens to
have the face installed and fall back to whatever sans-serif is to hand
everywhere else. That is a portability problem, not a privacy one.

### Decision

One component, `Dot`, with its arithmetic in `src/design/dotGeometry.ts` so it
can be pinned in a test. `Wordmark` composes it with live text in the
self-hosted face, which has neither problem: no request to make, and no
dependence on what the reader has installed.

The delivered SVGs are not used in the app. `public/favicon.svg` is the mark
from `leer-nu-favicon-32.svg` with its C2PA metadata stripped, since a favicon
cannot be a React component.

The geometry is pinned against the artefacts rather than against the prose,
because the two disagree twice and the drawings are what the logo actually is:

- §A says the dot is 41% of the **x-height**. Every drawing puts it at 41% of
  the **font size** — 36 at 88, 26 at 64, 41 at 100.
- The styleguide's canvas samples show whole-pixel rings, but only because a
  CSS border cannot be fractional. The delivered files never round: a 41px dot
  carries a 3.417px ring, which is 41/12.

`dotGeometry.test.ts` reproduces seven delivered files to three decimals. The
mark can no longer drift without a test saying so.

### Consequences

Three things for the designer, none of them blocking:

1. **The three coloured merktekens should not exist.** `leer-nu-merkteken-topo`,
   `-vlaggen` and `-woorden` are the mark in a module accent, and the logo
   documentation says in as many words that there are no module variants and no
   coloured marks. They are not used; deleting them is the owner's call.
2. **The app icons skip the 10% negative correction.** The negative wordmark
   (3.758 against 3.417) and the paper merkteken (8.8 against 8) both apply it,
   to four decimals, and the documentation states it for the paper merkteken
   outright. The three icon files use a plain twelfth despite also being paper
   on ink.
3. **§A contradicts itself on colour.** Its misuse panel says "only the dot may
   be coloured, and only within a module", while the paragraph above it says the
   dot never takes a module colour. The rest of the styleguide, the logo
   documentation and business plan v6 all agree on never; the misuse caption is
   the odd one out.

The wordmark SVG set still wants outlining before it goes anywhere external —
for the fallback, not for a request.

The 72px minimum width is documented on the component and not enforced, because
enforcing it means measuring rendered text. At the sizes it is called with today
it is not close.

---

## ADR-039 — The accent rule is a test, and the gallery never ships

**Status:** accepted — 2026-09-07.

### Context

Styleguide §B says a module may colour three things: the highlight on the
image, the progress bar and the module entrance. Not a button, not a message,
not a table, and never the mark.

That rule was already being broken in four places, and every one of them looked
like an improvement when it was written: the selected row in the explore list,
the retention percentage on the home screen, the name of a newly earned stamp,
and the colour of the "Bijna" feedback mark.

The last of those was the serious one. "Bijna" is an answer state, and an
accent standing in for one teaches a child that the module colour means
"nearly" — until they open a different module, where it means something else.

An accent is always the tempting colour, because it is the one that looks like
the brand. A rule that depends on remembering it will be broken again.

### Decision

**The rule is enforced by `src/design/accent.test.ts`.** Every use of an accent
in the source has to be named there with a reason: for CSS by the selector it
paints in, for components by file and snippet. Adding a use is deliberate and
reads in a diff as what it is. The mark is checked separately — `Dot` and
`Wordmark` may not mention an accent at all.

The four misuses are gone. Selection is carried by a 2px ink border, the
retention figure and the stamp name are primary ink, and "Bijna" is drawn in ink
— which is what step 7 gives it anyway: an open area, a single 3px border and a
half-filled dot, with no colour of its own, because amber would be a fifth
meaning and hatching always belongs to wrong.

**The component gallery is development-only**, behind `import.meta.env.DEV` at
`#componenten`. Vite replaces that with a literal so Rollup drops the branch and
everything under it — and `tools/report-bundle-size.mjs` now **fails the build**
if the gallery's marker string appears in the production bundle. "Should be
tree-shaken" is a belief until something looks.

That check fails the build where the size budget only reports. A size overrun is
a trade-off worth seeing; a second interface shipping to children is a mistake.

### Consequences

Three smaller corrections came with it, each replacing a value that had no basis
in §D:

- `tk-button-big` at 64px is gone. 64 is not a control height in §D, and the
  primary button is already 56 in PO under ADR-032.
- Chips and pills go from 40 to 44, the floor. Forty was below it and looked
  deliberate, which is how it survived review.
- The scrim and the bottom sheet are `absolute` rather than `fixed`, so they
  fill whatever is positioned around them. That is what makes them components
  instead of special cases, and it is the only reason the gallery can show them
  without taking over the page.

The gallery holds Dutch text that is not in `nl.ts`. That is deliberate: its
labels are addresses for a test query, not copy, and it is not part of the
product. The language test in step 4 excludes it by name.

Only one of §E's sixteen icons exists — the freezer, which the item status
needed. Area, flag, clock, tables, word, era, streak, ladder, stamp, read-aloud,
right, wrong, next, pupil and family are outstanding. They are not stubbed,
because an icon that is a placeholder is worse than an icon that is missing: the
placeholder ships.

---

## ADR-040 — Travel stamps, and the reward that was for turning up

**Status:** accepted — 2026-09-07, business plan v6 §5.7.

### Context

A badge became a **reisstempel**, and the plan attaches a condition to it: a
stamp is earned when an item goes right four times in a row, and never for
taking part alone.

Four correct in a row is not a new mechanic. It is exactly what carries an item
to box five in the Leitner schedule (ADR-005), which is what `set-onthouden`
already required of every item in a set. The plan's rule and the scheduler
agreed all along; the reward list did not.

**`eerste-ronde` — "Op weg" — was earned by finishing one round.** That is the
rule's exact counter-example: a reward for turning up, given before the child
has remembered anything. It was also almost certainly the first reward every
child ever saw, which makes it the one that taught them what a stamp means.

### Decision

`eerste-ronde` is removed. Not hidden — removed, so that no round awards it.

`set-vast` becomes `set-onthouden`, because it carried the word ADR-030 retired
while describing the exact thing that word was replaced with.

`BadgeId` becomes `StampId`, `BADGES` becomes `STAMPS`, `newBadges` becomes
`newStamps`, and the copy keys move from `badge.*` to `stamp.*`. Each stamp now
carries its criterion as a second string, shown beside the name: a reward you
cannot explain is a riddle, and a child who does not know what earned it cannot
set out to earn another.

XP and coins are still calculated and still stored, and neither is shown
(ADR-034 for levels, and coins were already hidden because there is nothing to
spend them on).

**The stored rows change, so `DB_VERSION` goes to 3.** The retired row is
deleted rather than left to be ignored: a stamp the app will never name again is
not a reward anybody still holds, and leaving it means every later reader of the
store has to know that. The renamed row keeps its earned date.

The object store is still called `badges` and its key is still `badgeId`. That
is the one thing that does not follow the rename, and deliberately: the store
holds what children have already earned, and a schema rename to tidy up a word
would risk real rows for a change no child can see. `rewardStore.ts` says so at
the top, so the mismatch is a decision rather than an oversight.

### Consequences

Nine stamps remain, of which seven need a flawless round or a sustained streak
and two need every item in a set at box five.

**Two of the nine are arguably still about turning up.** `week-op-rij` is seven
days of practice, and the `-foutloos` stamps need a complete round rather than
four correct in a row per item. They are kept because sustained practice is not
"meedoen alleen" — a week of coming back is the behaviour the product exists to
produce — but the plan's wording would support a stricter reading, and that is
worth someone deciding rather than me assuming.

`doel_beheersing` and `beheersing` stay as column names in the deferred Postgres
schema in `docs/DATAMODEL.md`. ADR-030 retires the word from what a parent
reads and allows it as a percentage; a column holding a percentage is that
allowed use.

---

## ADR-041 — The shell: one rail with two postures, and no navigation to nowhere

**Status:** accepted — 2026-09-07.

### Context

§D gives four sizes four navigation models and says why: the model follows the
number of hands and the distance to the screen, not the operating system. Behind
a laptop there is a mouse at eye level and the modules stand in a rail; in one
hand there is one thumb and they lie along the bottom.

Three things had to be decided to build that.

**Width is a poor proxy for hands.** It is also the only one that can be tested
at four sizes without emulating a hand. `(pointer: coarse)` would be truer to
§D's own reasoning, but it is unreliable under device emulation, which would
make the tests less trustworthy than the rule they check.

**A rail and a bottom bar are not two components.** §D says the rail _becomes_ a
bar. Two classes would drift apart the first time one of them was touched.

**The frame has almost nothing to frame.** The rail lists modules and one exists;
the tab bar lists Vandaag, Onthouden, Vrienden and Jij, of which one exists —
the other three are step 6 and the friend layer that ADR-015 rules out.

### Decision

**The rail is one component with two postures**, switching at 1280. Lying down
is the default because that is what the smaller half of the range gets;
standing up is the exception. 1280 rather than 1024 so that a tablet in
landscape — exactly 1024 — gets the bar the design draws for it, and a 1366
Chromebook gets the rail.

**Navigation appears when there is somewhere to go**, at two entries or more.
A rail with one module is a decoration, and a tab bar with one destination is a
label you cannot press taking 56px off the bottom of the smallest screen in the
range. So today the shell is an app bar and the content, and it grows navigation
when step 6 gives it somewhere to point.

Both lists are injectable, so the frame is tested with all seven modules and all
four destinations. A test that could only ever see one entry would be testing the
content rather than the component.

**A round is not wrapped in the shell at all.** Not hidden — not rendered. There
is nothing in the document to tab into, nothing to mis-tap with the map under a
thumb on a 393px screen, and nothing that can be hidden on the way in and
forgotten on the way out. `e2e/shell.spec.ts` asserts it from the outside, at
every size.

### Consequences

The home screen gives up its own header and its own `main`. The shell provides
both, and two `main` landmarks on a page is one more than a screen reader can
make sense of.

Playwright grows from two projects to six: 1366 and 1440, the iPad in both
orientations, an iPhone at 393 and a Pixel at 412. The 1366 promise — a whole
round with no vertical scrolling — is asserted only there, because a phone
scrolls by nature and a round on 852 of height is a different layout rather than
a broken one.

**The shell is worth less than it should be until step 6 exists**, and that is an
ordering problem in the build rather than in the design: the frame was specified
before the three screens it frames. Nothing here is wrong, but the responsive
work will need looking at again once Onthouden and Jij are real, because a bar
with four destinations lays out differently from a bar with none.

---

## ADR-042 — Three open points closed, and the four item statuses

**Status:** accepted — 2026-09-07.

### Context

Three questions were left open when the work that raised them was committed,
and one more appeared as soon as K9 needed a table.

### Decision

**The nine stamps stay as they are** (ADR-040's open point). A week of coming
back is not "meedoen alleen" — it is the behaviour the product exists to
produce — and a flawless complete round is an achievement rather than
attendance. Only "Op weg", for finishing one round, was attendance, and it is
gone. The strict reading of the plan would leave a single stamp reachable after
weeks, which would make the reward system a thing that almost never happens.

**The object store keeps the name `badges`** (ADR-040). The code around it says
stamp and `rewardStore.ts` explains the mismatch at the top. Renaming it means a
migration that touches rows children have already earned, for a word none of
them can see.

**Dark accent tints stay at `--surface`** until the styleguide has real ones.
Neutral rather than invented, and nothing depends on it: the design has not
drawn the dark screens, and ADR-025's scope note says tokens yes, screens no.

**The four item statuses map to the Leitner box**, which K9 needed and no
record had said:

- never reviewed — "nog niet geoefend", an empty dot
- box 1 to 3 — "nog niet onthouden", a part-filled dot
- box 4 — "dit onthoud je nu", a nearly full dot
- box 5 — "in de vriezer", a full dot and the freezer icon

The dot and the label are answering different questions on purpose. The dot says
how much of this you hold, straight from `masteryPercent`, and it is the same
shape as everywhere else in the product. The label says what the scheduler will
do next. Box five is both the fullest dot and the freezer, and that is not a
collision — it is the same fact seen from the two sides: you remember it, so we
will leave it alone for three weeks.

### Consequences

`countMastered` still counts box five, so the home screen's "{goed} van de
{totaal} onthoud je" and K9's freezer are the same set of items. A child who
compares the two will find they agree.

None of the four statuses is green. Green is an answer state, and a status that
borrowed it would tell a child they had just got something right when all it
means is that they knew it last Tuesday.

---

## ADR-043 — Four answer states, and the one that used to be three

**Status:** accepted — 2026-09-07, styleguide §B and step 7.

### Context

The map had three reveal states: the shape being asked about, the right answer,
and the wrong one. The right answer drew the same green outline whether the
child had found it or had just been shown it.

That is the bug this record exists for. A child who points at Overijssel and is
shown Drenthe sees the same picture as a child who pointed at Drenthe and was
right — so the screen congratulates the one who missed.

"Bijna" had the same problem from the other side. It existed as a sentence
(ADR-017) and had no shape at all, so a near miss looked exactly like being
wrong.

### Decision

Four states, each told apart by shape before colour:

- **goed** — solid fill, 2px ink border, paper tick. §B quotes 4.96:1 for the
  tick, which is paper on good, so the tick is paper and the border is what
  stays ink.
- **bijna** — open fill, a single 3px border, and a half-filled dot. No mark of
  its own and no colour of its own: a tick would say right, a cross would say
  wrong, amber would be a fifth meaning to learn, and the hatch belongs to
  wrong.
- **fout** — hatched fill and a cross. The texture stays on the exception and
  never on the right answer.
- **gemist** — open fill, a double border and a full dot. SVG has no double
  stroke, so the path is drawn twice: wide ink under a narrow paper one.

The half-filled dot of "bijna" is the `Dot` component, at the same fill that
means "practised, not yet certain" on K9. Not a similar shape — the same one,
because it is the same idea arriving at a different moment.

The map cannot work out which state applies. A typed answer has no chosen shape,
and "bijna" is a judgement about a word rather than a position, so
`PracticeScreen` passes the verdict and the map reads "gemist" from the absence
of the other three.

### Consequences

`src/design/answerStates.test.ts` reads the stylesheet and refuses to let two
states share a fill and a border weight. That is step 8's colour-blindness check
done as a test on the shapes rather than as an eye test: if two states ever
differ only in colour, a child with deuteranopia is being shown one picture and
told it means two things.

`.tk-shape-target` is gone. Nothing referenced it by name outside the map.

The travel animation from the chosen shape to the right one is unchanged and
still the only place movement teaches anything.

---

## ADR-044 — Every module has an address, and rekenen is a word rather than a module

**Status:** accepted — 2026-09-07.

### Context

The product needed addresses: leer.nu as a front door, and a path per module so
a child can be sent to one. `App.tsx` had said a router would be furniture until
there was more than one module. There still is one, but the reason changed — §A
draws "leer.nu/topografie" as a lockup, and it only reads as a sentence if the
path is real.

The owner also asked for `/rekenen`, which business plan v6 does not have. The
plan has tafels and klokkijken as two modules with two entrances and two
accents (ADR-028, decision 12).

### Decision

**Paths use the whole word**: `/topografie`, not §A's drawn `/topo`. The
abbreviation works in a lockup and would need seven of them, and
"leer.nu/tijdv" reads as nothing. The whole word is also what a parent types.

**A hand-rolled router**, about sixty lines. The map is literal paths with no
parameters, no nesting and no data loading, and the rule against a new runtime
dependency is worth more than what a package would save.

**A round has no address.** It is something you are in the middle of, and a URL
that resumed one halfway would either lie about the progress or throw it away.
Round screens are chosen by state; everything else by the path.

**A module the plan has and the product does not gets a page saying so**, rather
than a redirect. ADR-037 keeps those six out of the rail because a rail entry is
an offer; a URL is a question the child asked, and answering it with a different
screen is how an app teaches you not to trust its addresses.

**Rekenen is a category, and it holds tafels only.** Klokkijken sits beside it,
not under it: telling the time is reading an instrument rather than arithmetic,
which is the distinction the owner drew and the same one business plan v6 made
when it split them. Categories exist at addresses and not in the rail — the rail
lists modules, because a module is what a child practises and nobody practises
"rekenen".

### Consequences

Deep links need `dist/404.html` to be a copy of `index.html`, because Pages
serves static files and there is no file called `topografie`. Without it every
address works when clicked and breaks when typed or shared, which is the worse
half. The status code really is 404 for a page that renders; the honest fix is a
host that can rewrite, and `tools/spa-fallback.mjs` says so in place.

The category shape leaves room for the long tail in §5.5 — biology, road signs,
music notation — to be grouped under words a parent knows without every one of
them needing an accent of its own. That does not solve the eight-module ceiling
in ADR-028, but it is the first thing that has made it look solvable.

---

## ADR-045 — The parent gets an account; the child's practice stays on the device

**Status:** superseded by ADR-046, the same day. Never built.

### Context

The owner asked for user management: signing in, signing out, and a database
instead of everything living in the browser.

That reverses ADR-015, which chose local-first and no backend, and it collides
with three things the product currently says out loud. The start screen says
"Geen account nodig". `e2e/network.spec.ts` proves, over a real round, that the
app never asks anything of anyone. And the README gives that as the reason the
repository is public.

It also collides with two records that were deferred rather than decided.
ADR-008 refused a self-service account for a minor, because it makes us the
controller of a child's data under a different legal regime. ADR-012 tied
retention and deletion to a class that no longer exists.

Three shapes were on the table: the child signs in and everything moves to the
server; nobody signs in and profiles are switched on the device; or the parent
signs in and the child's practice stays where it is.

### Decision

**The parent has an account. The child does not.**

The parent's account carries what an account is actually for here: paying,
managing up to four children, and the one screen per child that V1 describes.
The child's practice — every answer, every Leitner box, every streak — stays in
IndexedDB on the device, exactly as ADR-015 designed it.

This follows the business plan's own sentence about who this product is for: the
parent buys and the child uses. It also keeps the sharpest edge away from us. A
child never authenticates, so we never hold a credential belonging to a
ten-year-old, and the thing ADR-008 refused stays refused.

### Consequences

**ADR-015 is superseded in part, not overturned.** There is a backend now, and
it holds parents. It does not hold what a child answered.

Three claims have to change and one has to stay:

- "Geen account nodig" stays true for the child and becomes false for the
  parent who pays. The copy needs to say which.
- `e2e/network.spec.ts` will have to allow the requests the parent's session
  makes and must keep proving that a round makes none. That is a narrowing of
  the test, and it should be written so the narrowing is obvious.
- The README's reason for being public needs rewriting rather than deleting.
- Nothing about the child's data leaving the device changes, and that is the
  claim worth defending hardest.

**What this does not unlock.** Growth points relative to friends (ADR-034) and
the friend layer still need the child to have an identity the server knows, and
this decision deliberately does not give them one. Whether a child gets a
server-side identity for that is a separate decision, and a harder one, and it
should not arrive as a side effect of adding a login for parents.

Progress still does not follow a child to a second device. That was the main
thing a full account would have bought, and it is the price of this shape.

---

## ADR-046 — A child's progress lives in the parent's account. Supersedes ADR-045 and reverses ADR-015

**Status:** accepted — 2026-09-07. Supersedes ADR-045. Reverses ADR-015. Not yet built.

### Context

ADR-045, written earlier the same day, kept every answer a child gave on the
device. The question that undid it was a simple one from the owner: a family
with several children and one iPad — what then?

Answering it properly meant looking at how Safari treats storage and at what
comparable products do, and both went the other way.

**Safari deletes all script-writable storage after seven days without use.**
LocalStorage, IndexedDB, service workers — all of it, at once, per origin. The
longest Leitner interval in this product is twenty-one days. So an item a child
has genuinely learned is one they will not be asked about for three weeks, and a
family that does not open the site for one of those weeks loses everything. The
children most exposed are the ones the schedule is working best for, on the
device §D calls the classroom one. Home-screen web apps are exempt, and no
product can require a family to install one.

That single fact makes pure local-first untenable for something built on spaced
repetition. It should have been checked before ADR-045 rather than after.

**Squla**, the closest comparison in this market and age group, puts child
accounts inside a parent account. The child signs in by tapping their own tile
and never holds credentials. Their help pages give the reason plainly: each
child needs their own account because the level adapts to the answers that child
gave — which is exactly what Leitner does here.

**Duolingo** takes the other shape: separate accounts with separate logins, and
the family plan is bundled billing rather than a shared learning space. That
works because its family members are mostly adults. A seven-year-old with a
password is the wrong object.

And the business model points the same way. The product sells, for €79 a year
and up to four children, what each child remembers. Progress that can evaporate
is not that, and the parent overview the plan calls the screen that sells the
subscription cannot exist while the data sits on the child's device.

### Decision

**Child profiles live in the parent's account, on the server.** The parent
creates them; the child opens one by tapping a tile and never has credentials of
their own. Squla's shape, for Squla's reasons.

**The device keeps a local copy**, so a round is fast and works without a
connection, and it syncs when there is one. IndexedDB stops being the record and
becomes a cache — which is also what makes the seven-day eviction survivable
rather than fatal.

**ADR-015 is reversed, not softened.** There is a backend and it holds what a
child answered. ADR-045's split — parent on the server, child on the device —
lasted about an hour and is superseded.

**"Geen advertenties. Geen account nodig." is removed** rather than reworded.
The second half stops being true the moment a parent has to sign in, and the
owner's judgement was that the pair added nothing worth keeping. What replaces
it is nothing: the product can demonstrate this rather than assert it on the
first screen.

### Consequences

The multiple-children question answers itself. Four children on one iPad are
four tiles; nobody has to guess who is practising, and nobody pollutes a
sibling's boxes. That was the failure waiting in the current schema, where
`itemStates` is keyed by item alone and two children silently share one set of
Leitner boxes.

Legally this is the safer side rather than the riskier one. The parent creates
the profile and consents, and the child never authenticates, so ADR-008's
refusal — no self-service account for a minor — stands untouched.

`e2e/network.spec.ts` has to narrow rather than go. A round must still prove it
asks nobody anything; sync is a separate moment and should be tested as one. The
README's claim needs rewriting when the backend lands, not before: it is still
true today.

Still not decided, and not to be decided by accident: whether a child gets a
server-side identity that other children can see. Growth points relative to
friends (ADR-034) and the whole friend layer need one. Storing a child's
progress under their parent's account does not give them one, and adding it
should be its own decision with its own record.

---

## ADR-047 — Two corrections the neighbour build forced

**Status:** accepted — 2026-09-08. Supersedes the classification in ADR-036;
the rest of ADR-036 stands.

### Context

ADR-036 was written ahead of the build and split the sets two ways: provinces
and waters were areas that share edges, everything else was points. Building it
turned up two things the record had wrong.

The waters are not areas. ADR-019 already decided they are points, because no
licensed polygon source exists for them — `build-waters.mjs` ships six
coordinates, verified to fall outside all twelve provinces. So provinces are
the only areas we have, and the area rule has exactly one set.

And a list of borders alone is not enough to ask a question with. Zeeland and
Limburg border two provinces each, and multiple choice needs three wrong
answers. Two of the twelve provinces would have been unaskable.

### Decision

The waters are built with the distance rule, like the other point sets.

For areas the list is borders first, then the nearest of the rest. The order
carries the difference: everything that shares a boundary comes before anything
that merely lies close, so a caller taking the first three gets borders
wherever there are three.

### Consequences

The second ring is a weaker distractor than a border, and for Zeeland and
Limburg that is what a question will use. It is still a plausible mistake and
never the other end of the country, which is the property the whole exercise is
for.

`neighbours.test.ts` pins a handful of facts about the Netherlands — Groningen
touches two provinces, Zeeland does not touch Limburg, Gelderland touches six.
The structural checks around them would all pass on a list built from the wrong
geometry; these are the ones that would not.

---

## ADR-048 — "Ik weet het niet" is honest, and cheaper than a guess

**Status:** accepted — 2026-09-08. The cost in a survival round is the part
worth arguing with; see Consequences.

### Context

The button is drawn on K3 at every size in the app design, below the question,
secondary in weight. It had not been built, because what it costs is not drawn
and the answer is not obvious.

Three things could happen when a child presses it, and they are not the same
decision:

- What the scheduler learns.
- What the round counts.
- What it costs in a round with lives or a clock.

### Decision

**The scheduler is told the truth: not known.** The item goes back to box one,
exactly as a wrong answer does. A child who does not know a province does not
know it, whether or not they guessed first.

**The round counts it among the answered, and not among the correct.** "9 of 12"
must mean what it says.

**It costs no life.** This is the part that is not symmetric with a wrong
answer, and it is deliberate. A guess on twelve provinces is right one time in
twelve; a button that costs exactly what a wrong guess costs is a button no
child ever presses, and the control becomes decoration. Making it cheaper is
what buys the honesty — and honesty is precisely what the scheduler needs to
put the item in front of them again.

In a bliksemronde it still costs the seconds it took, which is the pressure
that round already applies and enough of it.

The attempt is recorded as `weet-niet` rather than `onbekend`. "I did not know"
and "you typed something that is not a place" are different things to have
done, and a row that cannot tell them apart cannot be read later.

### Consequences

A child could press it through a survival round and never lose a life. The
round ends when the questions do rather than when the lives do, they score
nothing, and the scheduler gets twelve honest signals. That is a worse round
and a better lesson, and it is not a way to win anything: nothing here is
ranked (spec §10) and a lost life costs no coins (ADR-021).

The alternative — costing a life — is defensible and would make the survival
round stricter. It is the one thing here worth overruling, and overruling it is
one boolean at the call site.

---

## ADR-049 — The tables, and the screen the design does not draw

**Status:** accepted — 2026-09-08.

### Context

Rekenen was asked for as the second module, which also brings the rail to life
(ADR-037). The v2 app design draws the tables as a module: a rail entry with
its own accent, a card on the front door carrying "8 van de 10 onthoud je", a
level, and one hard content line — "Tafels en klok · Van 1 tot 12, hele en
halve uren".

It does not draw the round. There is no tafel question card, no answer field,
no result screen for it anywhere in the four sizes.

Build brief §0.2 is explicit: do not guess a design that has not been drawn.

### Decision

**The entrance is built as drawn.** Twelve tables, one to twelve, ten sums each
— which is where a table ends in Dutch primary school; eleven and twelve as
multipliers are a different exercise. One set per table, because "de tafel van
7 ken ik" is the sentence this module exists to make sayable and it is only
sayable about a whole table.

**The round is not invented; it is K3 and K4 with the map removed.** The same
round bar, the same ten dots, the same feedback in the place the question was,
the same "Ik weet het niet" under ADR-048's rule. The sum takes the stage the
map takes, because it is the same thing — what the child is being asked about.
Nothing on that screen is a new idea; every part of it is a part that was
drawn, used for the one subject it was not drawn for.

**The content is generated, not written.** The geography sets are hand-written
because a name, its aliases and its weetje are judgements someone must defend.
7 × 8 = 56 is not a judgement, and a hand-written file of a hundred and twenty
of them is a hundred and twenty chances at a typo no reviewer would catch by
reading. `sums.content.test.ts` multiplies every entry back out, which is a
stronger guarantee than a careful read and is available exactly here.

**Typing comes before multiple choice, the opposite of the map.** On a map,
choosing between four names is genuinely easier than producing one. A number is
not: four plausible products can be narrowed by a child who cannot do the sum,
so multiple choice measures less here. It is the way back in when typing is
going badly, not the way in.

**The round wiring is duplicated, deliberately.** `useRound` is six hundred
lines of map — geometry, an answer layer, a name index, near misses, touch
targets — and a round of sums shares none of it. `useSumRound` shares the two
things that matter, the Leitner schedule and what gets written down, by
importing them; `composeRound` became generic over anything with an id, which
is the only part of the schedule that had to change.

### Consequences

Extracting a common round now would mean guessing which parts are general from
a sample of two, and the guess would be made in the map's shape because the map
got there first. The third module is when that guess becomes an observation.
Until then there are two round hooks and a reader has to know it.

The rail appears, which answers the question that was parked. It shows two
modules; the other five stay out of it under ADR-037.

Near misses have no counterpart here and should not be given one. ADR-017
exists because "Friesland" for Fryslân is a different kind of wrong from
"Zwolle". 54 for 56 is not a different kind of wrong — it is wrong — and
dressing it as "bijna" would teach a child that close enough is a grade.

---

## ADR-050 — Supabase, and what that costs the promise

**Status:** accepted — 2026-09-08. Chosen by the product owner over an own API
and over deferring the backend again. Supersedes nothing; it is the
implementation ADR-046 left open.

### Context

ADR-046 decided that a child's progress belongs in their parent's account: a
family with one iPad and three children currently shares one set of Leitner
boxes, because `itemStates` is keyed by item alone. It did not decide how.

Three ways were put to the product owner. Supabase — Postgres, auth and
row-level security without writing a service. An own minimal API on our own
hosting — full control over where a child's rows sit, and every one of auth,
sessions, migrations and backups written by us. Or local child profiles only,
which solves the one iPad and leaves Safari deleting everything after seven
days of no interaction.

### Decision

Supabase.

**What it is allowed to hold.** Parent account: an e-mail and an auth row.
Child: a first name, a level, and rows of progress. Nothing else — ADR-008's
refusal stands, a child never authenticates and never has an e-mail, and the
two fields that would turn a name into a findable child, school and place of
residence, are not in the schema and are not to be added to it.

**The region is the EU.** A project holding the first names and study records
of Dutch primary school children is not going to sit in another jurisdiction
because the default region was quicker.

**Local first stays local first.** The device remains the source of truth
during a round: every answer is written to IndexedDB and scheduled there, and
sync is a separate moment. A round that waited on a network is a round a child
loses on a school wi-fi, and the whole product is built the other way round.

**The client is loaded only where it is used.** The parent screens import it;
the round does not. It must not enter the shell budget of 300 kB for a child
who never signs in.

### Consequences

**The promise changes and the README has to say so.** "No network traffic
beyond the map files in `public/`" stops being true the moment a parent signs
in. What survives, and what the promise should have said all along, is the part
that matters: no advertising, no tracking, no third-party script on a page a
child looks at, and no network request during a round. Restating it as the
narrower true claim is better than keeping a wider one that has quietly become
false — that is exactly the failure this product is positioned against.

**Supabase is a processor and needs a processing agreement**, and the privacy
statement has to name it. Neither is code and neither is optional.

**The schema change lands before the network does.** `itemStates` keyed by item
alone is the actual bug; keying it per child fixes the one-iPad family whether
or not anyone ever signs in, and it is the shape the upload needs. That is a
local IndexedDB migration and it goes first, on its own.

**What cannot be verified here.** The project, its URL and its keys can only be
created by the product owner, and CI has none of them. Everything written
against Supabase is unverified until it runs against a real project, and it
should be said that way rather than reported as done.

---

## ADR-051 — The rail is the map of the product, not an index of what is finished

**Status:** accepted — 2026-09-08. Reverses half of ADR-037; the other half —
that a set or a way of practising is not offered before it exists — stands.

### Context

ADR-037 kept unbuilt modules out of the rail, on the reasoning that a
greyed-out entry is a promise the app has not kept, on the screen a child sees
first. At one module that was right, and it stayed right at two.

At five it is wrong, and for a reason the earlier decision could not see: a
rail with two entries does not read as a short list, it reads as the whole
product. A child looking at leer.nu could not tell that clocks, flags and
language are what this is for; they saw a topography app with a tables section
bolted on. The design's own K1 draws seven entries against two built modules.

### Decision

The rail carries the five entrances the product is planned around: topo,
rekenen, taal, klok, vlaggen. Not every module — spelling and tijdvakken sit
under taal and are not their own doors — and not only the built ones.

An entry that is not built still goes somewhere: its address answers with
"binnenkort" rather than with a round. That is the part of ADR-037 that has to
survive, because the failure it named is real — a door that opens onto nothing
is worse than a door that says it is not open yet.

`built` therefore keeps deciding what a module's address does and stops
deciding whether it appears.

### Consequences

Three of the five doors currently lead to a page that says the module does not
exist. That is a plan a child can read, and it is checkable: the "verder
oefenen" list on K1 says "bestaat nog niet" against those three in as many
words, so nobody has to click to find out.

The risk ADR-037 named has not gone away — it has been traded. If those three
are still saying "binnenkort" in a year, the rail will have become a list of
promises after all, and this decision should be revisited rather than defended.

---

## ADR-052 — K2's start button waits for its bar

**Status:** accepted — 2026-09-08. Defers a drawn element, with a date to
revisit rather than a shrug.

### Context

The app design gives K2's start button a bar fixed to the bottom of a phone
screen, and gives a reason worth honouring: "de enige plek waar hij binnen
duimbereik blijft zonder te scrollen". Five sets and four ways is more than one
screenful, and a start button under all of it is one a child has to hunt for.

Three attempts produced three different bugs, each found by the same suite:

1. Pulled out to the screen edges with negative side margins, it made the page
   forty-eight pixels wider than a 393 phone. The page scrolled sideways and the
   button's own edges sat off the glass.
2. Kept inside the margins, the bar sat on top of its own button and swallowed
   every press — on Android, and on a child's thumb.
3. Made to pass taps through, the press landed on the list behind it instead:
   the button's box and the point being pressed had come apart.

### Decision

On a phone the start button is full width at the end of the list, and nothing
floats. The bar waits.

### Consequences

A child scrolls to it. That is worse than the design and better than a control
that cannot be pressed, and this is K2 rather than the front door — the
argument for thumb reach is strongest where a child returns daily, and K2 is
visited once per round.

What went wrong is worth writing down, because the next attempt should not
start from scratch. A control floating over a scrolling list has to be right
about three things at once — stacking, hit testing, and where the box is once
the browser has scrolled it — and fixing them one at a time moved the failure
rather than removing it. Whoever picks this up should build it as a sibling of
the scroll container rather than a child of it, and check it at 393 first.

---

## ADR-053 — K1 carries a mark, and it is not the retention figure

**Status:** accepted — 2026-09-08. Partially reverses the wording of ADR-030's
consequence that the front door reports no score.

### Context

Until now K1 said "12 van de 20 onthoud je" beside the set it offers to carry
on with, and the number this product argues from — what a child will still know
in three weeks — sat under it. Two figures about remembering, one line apart,
and neither of them told a child how the last round actually went.

The product owner asked for the mark instead: "Je scoorde vorige keer een 8,4".
A mark is the number a Dutch ten-year-old reads without being taught how, and
it is the number they will be given for the test they are practising for. It is
also exactly the number this repository has been careful not to put on the
front door, because a scoreboard teaches a child to practise for today's answer
rather than for what they keep.

### Decision

Both, in different places, and never on the same line.

- The **mark** is on the card, beside a bar that draws the same round. It is
  about what has already happened and it is honest about which round: the last
  finished session that overlaps the set being offered.
- The **forecast** moves into the right-hand column of K1, in a card of its
  own, with the sentence that says what it is: what you keep, not what you had
  right.

The mark is `1 + 9 × goed/beantwoord`, to one decimal, over what was
**answered** and not over what was asked. A round can be stopped early and what
was answered is kept (ADR-052); marking eleven questions a child never saw as
wrong would make stopping a punishment, and stopping is allowed here.

`sessions` gains `beantwoord`. It is an added optional field rather than a
schema version, because rows written before it are still readable and fall back
to the length of `itemSet`.

### Consequences

The risk is the one ADR-030 named: a child who practises for the mark rather
than for the forecast. Two things hold it back and neither is decoration. The
mark never appears without the round it came from, so "een 10,0" over one
answered question reads as what it is. And the forecast keeps the larger
figure, the larger dot and the sentence explaining itself, on a card of its own.

Worth watching: if the mark turns out to be the number children talk about and
the forecast the one nobody reads, this was the wrong trade and the card is
where to undo it.

---

## ADR-054 — A test has a subject, and the subject decides what "Ga verder" means

**Status:** accepted — 2026-09-08.

### Context

K1's test date was a date and nothing else. A date on its own plans nothing: a
child practising for Tuesday still had to find the right subject themselves,
and the front door would happily offer them last night's tables because those
were touched most recently. "Verder" was answering "where was I" when the child
was asking "what is the test about".

### Decision

The test block asks for a subject as well as a date, and the subject outranks
the history when the front door decides what to carry on with. Both live in
`settings`: they are facts about the device a family shares, not about a child.

Only built modules are offered. A test set for klokkijken would be a promise of
practice material that does not exist, which is ADR-037's rule.

### Consequences

A child with a topography test on Friday opens the app and is offered
topography, whatever they did last. A child who sets no subject is where they
were before, which is the honest default rather than a guess.

When a third module ships it appears in the list without a code change, because
the list is `BUILT_MODULES`. When one is retired, a subject saved for it reads
back as no subject rather than as a module nobody can practise.

---

## ADR-055 — The destinations stand in the app bar from a tablet up

**Status:** accepted — 2026-09-08.

### Context

The four destinations — Vandaag, Onthouden, Vrienden, Jij — were drawn as a tab
bar on a phone and as nothing at all anywhere else, and that is what was built:
`md:hidden`. So on an iPad and on a Chromebook there was no way to reach
"Onthouden" except by typing its address. The design's tablet artboards do not
draw a destinations bar either, which is a gap in the design rather than a
decision in it.

### Decision

One list, two postures, exactly one of them displayed at any width. On a phone
it is the tab bar along the bottom, where a thumb is. From 768 up it is a row in
the app bar, where the pointer is and where the bottom of the screen is a long
way from anything.

The streak moves with it: it now appears only where the rail stands up (1280),
because from a tablet up the app bar is carrying navigation and navigation
costs the width first.

### Consequences

Both bars are in the document at every size, which is a duplicate landmark on
paper. It is not one in practice — the hidden posture is `display: none`, so it
is out of the accessibility tree — but a unit test rendering without a
stylesheet sees both, and `Shell.test.tsx` says so rather than working around
it.

At 200% text the row of destinations is wider than a tablet's app bar. It
scrolls inside the bar rather than pushing the page sideways, because a page
that scrolls horizontally at 393 is the first thing that goes wrong at the small
end and the one thing `e2e/shell.spec.ts` measures at every size.

---

## ADR-056 — The logo is the way home, and the merkteken heads the rail

**Status:** accepted — 2026-09-08.

### Context

The wordmark in the app bar was a picture that did nothing. Every other site a
ten-year-old uses puts a logo top left and takes them home when they press it,
so the one place on the screen they already know how to use was inert. K1 also
draws the merkteken at the head of the rail, which the built rail did not have.

### Decision

The wordmark in the app bar is a button that goes to Vandaag. Its accessible
name is the brand and the destination — "leer.nu, naar Vandaag" — because a
mark alone does not say where you land, and "Naar Vandaag" alone takes the
product's name away from anyone who cannot see it.

The merkteken heads the rail, but only where the rail stands up. Lying along the
bottom of a tablet it would be a logo in the last place anyone looks, and the
app bar carries the wordmark two centimetres away.

It is drawn rather than fetched: `Brandmark` is `Dot` at the wordmark's fill,
which is exactly what `docs/Logo/leer-nu-merkteken-inkt.svg` contains. One
shape, no request, and nothing that can drift.

### Consequences

The mark is now in two places on a wide screen and named in one, so a screen
reader still hears "leer.nu" once.

Finding the merkteken and the progress bar to be the same drawing had a second
effect worth recording: `.tk-progress-fill` was a `<span>` with a width and a
height and no `display`, so it had never rendered at all. It appeared only in
the development gallery, which is why nobody saw it. K1 puts a progress bar on
the front door, so it had to work, and it now does.

---

## ADR-057 — The forecast is re-aimed at the test day

**Status:** superseded by ADR-058 — 2026-09-08. Built on ADR-054, which gave the
test a subject. The record stays as written: it shipped, it was looked at, and
what it was wrong about is worth more than the fact that it was.

### Context

ADR-054 gave K1 a test date and a subject, and then did nothing with them but
print them. A date the child already knew, on a card, is a sticker.

Meanwhile the number this product argues from — what you will still know in
three weeks — is aimed at a horizon nobody asked about. A child practising for
Friday does not care about three weeks. They care about Friday.

### Decision

Ask the retention model the same question about the day that has been set, and
ask it twice: as things stand, and having practised every day between now and
then. The gap between the two answers is the argument for opening the app
tomorrow, said in the terms the child is already thinking in.

The optimistic figure is a simulation over `leitner.ts` and `retention.ts` —
walk forward a day, answer what a round would put in front of you, get it right,
ask the model what it thinks on the test day. Every part of it is a function
that already runs a real round, which is what makes it a forecast rather than a
marketing number.

Three things bound it:

- **At most a round's worth a day**, oldest due first. Eighty items do not go
  past a child in one evening, and a plan that assumed they would would be a
  promise nobody could keep.
- **Every answer is right**, which nobody's are. That makes it a ceiling, so
  the copy says "ongeveer" and never states it as a target.
- **Nothing after the test day counts.** With the date today or past, the two
  figures are one figure, and the line is not drawn at all.

The screen also says nothing when practising would gain less than two points.
Below that the gap is rounding, and "practise and it goes up" would be selling.

### Consequences

There is now a number on K1 that a child can hold us to, on a day they will
remember. That is the point and it is also the risk: it is a ceiling that
assumes a perfect week, and a child who practises every day and still scores
under it has been told something that did not happen.

Two things keep that honest and neither may be dropped without revisiting this.
The word "ongeveer", and the fact that the figure is retention rather than a
mark — what you are likely to still know, not what you are going to be given.
If the two ever get conflated in the copy, this decision is the one to reopen.

---

## ADR-058 — The front door keeps the record; K9 keeps the forecast

**Status:** accepted — 2026-09-08. **Supersedes ADR-057**, which is a week old
and shipped for about an hour.

### Context

ADR-057 put a projection on K1: what you will know on the test day as things
stand, and what you would know having practised until it. It was true, it was
bounded, it was tested — and read on the screen it was one sentence too many.
K1 already carried a mark, a progress bar per module and a retention percentage;
the projection made four numbers about the same child on one page, two of them
percentages that meant different things.

The product owner cut it, and the same review cut the retention card beside it.

### Decision

K1 reports what has happened. K9 forecasts what will.

Off the front door: the projection, and "Wat onthoud je". Onto it: the rounds
just played with the mark each came to, everything ever answered correctly as
one figure, the exercises a child keeps returning to, and a sticker they choose.

The test block is now about the test alone — when it is, what it is for, and the
way in. No mark, no bar, no projection. A block that reports on the child is not
a reason to start.

### Consequences

The number this product argues from is one click away instead of on the door.
That is a real cost and it is the thing to watch: if children stop meeting the
retention figure at all, "leren om te onthouden" becomes a claim in the README
rather than something the interface says. **Onthouden** is a tab in the app bar
and in the tab bar on a phone, so it is not buried; whether that is enough is a
question for the next time someone watches a child use this.

`outlook.ts` is deleted rather than left switched off. A module nobody renders
is a module nobody maintains, and this decision records what it did and why it
went, which is what the file would otherwise have been kept for.

What survives from ADR-057 is the reasoning about honesty in a forecast: over
what was answered rather than asked, "ongeveer" and never a target, and nothing
claimed about a day that has been. Those apply to the mark on K1 too, and they
are the reason it is a mark over an answered round rather than over a set.

---

## ADR-059 — Six animals nobody has to earn

**Status:** accepted — 2026-09-08. Takes the reisstempels off K1 without
retiring them.

### Context

The corner of the front door held the reisstempels: a shelf of what had been
earned, which for most of the first week is a shelf of what has not. ADR-040 is
right that every one of them must be earned by practising — that is what makes
them worth anything — but "Nog geen stempels" is a poor thing to be shown every
morning by your own front door.

Everything else on that screen is earned or measured too. There was nothing on
it a child decided.

### Decision

A sticker. Six animals, drawn on §E's frame with §E's primitives, and the child
picks one. It shows in the card and beside their name in the app bar, so the
choice is visible somewhere other than where it was made.

**None of them is locked, and none ever will be.** The moment one has to be
earned this stops being a choice and becomes a scoreboard with animals on it,
which is the thing the stamps already do properly.

It lives in `avatarConfig` on the profile, which has been on the record since
version 1 and empty ever since. It belongs to the child rather than the device:
two children on one iPad are two animals, and that is most of the point.

The stamps themselves are untouched. They are still earned, still stored, still
named on the result screen at the end of the round that earns one. What they are
not any more is the view from a child's own door.

### Consequences

There is now one thing in this product that measures nothing, and that is
deliberate rather than an oversight — a child who cannot change anything about
an app they are told to use can at least decide what it looks like when they
open it.

The obvious next step is to make the animals unlockable, and it is the one thing
this decision exists to refuse. If someone wants a reward that is chosen rather
than given, the honest version is more animals for everyone, not the same six
behind a wall.

---

## ADR-060 — Three module marks redrawn, and the rule that forced a frame

**Status:** accepted — 2026-09-08.

### Context

Three pictograms did not read as their module. Topography was a bevelled outline
with an inner boundary that was a scratch at 24px; the tables were a
three-by-three array of dots, which is the picture a teacher draws once in group
4 and never again; language was two ruled lines, which was also very nearly the
freezer and very nearly an era — three icons of horizontal lines in one set.

### Decision

Topography is a diamond, which is what K1 draws in the rail and one of §E's four
primitives used whole. Language is a speech balloon, because a language module
is where a child meets a word before they meet a spelling of it.

The tables are a times sign, **on a key**. The sign is right and it is what a
child learning the tables is learning. The frame is not decoration: `WrongIcon`
is two crossed lines corner to corner, and §E's rule is that an icon may not
mean two things — a bare cross in the rail is the drawing a child sees when they
get an answer wrong. Inside a key it is an operator on a calculator, which is a
different silhouette at any size.

`src/design/icons.test.ts` now asserts that no two icons in the set share a
path, so the next collision fails a build instead of shipping.

### Consequences

The comment at the top of `Icon.tsx` used to say the tables could not be a
multiplication sign for exactly this reason. That reasoning was right about the
collision and wrong about the conclusion: the answer was to change the
silhouette, not to draw a different idea.

---

## ADR-061 — One module page, six ways with a face each, and a set that has an address

**Status:** accepted — 2026-09-08.

### Context

The category pages — leer.nu/topografie, leer.nu/rekenen, leer.nu/klokkijken —
were the part of the product the design calls K2 and the part that had grown by
accretion. Four things were wrong with them at once.

**There were two of them.** `ChooseRoundScreen` and `ChooseTableScreen` were the
same screen twice: the same two numbered steps, the same cards, the same start
button, maintained apart. What actually differs between topography and the
tables is the list of sets and the list of ways, which is data.

**Two ways of practising skipped the sentence.** The lightning round and the
survival round were chips that started a round the moment they were pressed. So
the two heaviest rounds in the product were the only two a child never read a
description of first — K2's whole argument is that the last thing you read
before a round is what the round is, and the chips were exempt from it.

**A way of practising had no face.** Six cards of text, told apart by reading
them. The design draws an icon on each and the styleguide's §E fixes the rule
for drawing one.

**leer.nu/rekenen was a redirect wearing a hat.** ADR-044 made rekenen a
category holding tafels, which is right — telling the time is not arithmetic.
What it produced was a page with one card on it, labelled "Rekenen", leading to
a module also labelled "Rekenen". A child paid a click to be told what they had
just typed.

### Decision

**One `ModuleScreen` for every module.** Sets and ways are data
(`features/module/onderdelen.ts`, `features/module/forms.ts`); the page is the
same for all of them. Twelve tables lay out as a grid and five named sets as a
list, which is the only thing that branches.

**Every way of practising is in step 2, with its own icon, and never more than
six.** The clock and the lives are the fifth and sixth, so everything that
starts a round goes through the same start button. The argument they were kept
out for — that adding sixty seconds to something you already know is not a way
of learning it — is still made, by the order and by the line under each name,
which is where an argument belongs. Six is a drawing rule: past six the grid
stops being one glance, and a module with a seventh way has a question to answer
about which six to offer rather than a row to grow.

**Six new icons**, built from §E's primitives on §E's frame. §E's own list of
sixteen is closed and stays closed; what it also fixes is the reason it can be —
a construction rule "zodat de set uitbreidbaar blijft zonder illustrator". When
§E was written a way of practising was a word on a card.

**A set has an address**: leer.nu/topografie/provincies, leer.nu/rekenen/tafel-7.
A parent or a teacher can send a child to one exercise rather than to a chooser.
An unknown second segment opens the module rather than an error, for the reason
ADR-044 gave one level up.

**A category holding one built module _is_ that module.** leer.nu/rekenen opens
the tables; leer.nu/tafels keeps working, because it has been written down. The
category page survives for the day arithmetic is more than the tables.

**The start button says how long it takes** — "Ongeveer 4 minuten", from the
design. The per-question figures are round on purpose; a number to the minute
would claim a precision this does not have. Nothing is claimed where nothing can
be: a round that ends on three lives is exactly as long as the child is good.

**"Wat nog niet zit"** names the set the scheduler has most work waiting in, and
selects it. It does not start a round — choosing how is still the child's — and
it is absent when the busiest set is the one already open. On twelve tables the
one that needs doing is as likely to be row nine as row one.

**The child's own column is on every page inside the shell**, unchanged: how the
whole of it is going, where they keep going back to, and the animal they picked.
It moved out of `HomeScreen` to be shared and nothing about what it draws
changed. A module page is not a different application.

**The app bar carries the rest of the address** — "leer.nu" + "/topografie",
§A's lockup, which K2 puts there. It is the one place in the product that says a
page has an address someone could write down. Not on a phone, where the bar is a
wordmark and a name across 393.

### Consequences

`round/modes.ts`, `round/challengeLabel.ts`, `ChooseRoundScreen` and
`ChooseTableScreen` are gone, and `modes.test.ts` with them —
`features/module/forms.test.ts` asserts the order, and its last case is the
reverse of that file's: the challenge modes are in the list now.

Five copy keys were retired with the screens they belonged to, including
`sums.title`. The tables page is headed "Wat wil je oefenen?" like every other
module, and its start button counts vragen rather than sommen, which is what the
round screen already counted.

`.tk-eyebrow` is the fourth selector allowed to paint with a module accent. It
is the same pair as `.tk-tile-head` — the module's pictogram and the module's
name — at the head of the module's own page, and on a phone it is the only thing
that says which module you are in, because §D drops the rail at that width.

Not done, and worth naming: the design's orientation panel beside the flow — the
map of the chosen set with its progress bar under it. It is drawn in K2 and it
costs a geo fetch on a screen where nothing has been practised yet. It is a
decision for the day the map files are cheaper, not an oversight.

---

## ADR-062 — Rekenen is four kinds of sum, a subject is not a set, and a mix is not a file

**Status:** accepted — 2026-09-08.

### Context

Rekenen was the twelve tables and nothing else, and step 1 of its page was
twelve cards. That was already the most crowded chooser in the product — twelve
rows of one thing on a phone, with step 2 below the fold on the page whose whole
argument is that the two steps are one flow.

It could not survive division, addition and subtraction arriving beside it.
Twelve tables, twelve sets of division facts and three ranges each of plus and
minus is thirty-six sets. Thirty-six cards of equal weight is not a chooser; it
is a directory.

Two other things were wrong at the same time. A child who wanted to practise
everything at once had no way to ask for it — the product could only offer one
table, ever. And a sum in this codebase was `{ table, by }`, which is the shape
of a multiplication and would have had to lie about the other three operations.

### Decision

**Step 1 offers subjects, and a subject may hold many sets.** Rekenen has five:
Tafels, Deelsommen, Plussommen, Minsommen and the Rekenmix. The sets under a
subject are a row of chips that appears once the subject is chosen — "welke
tafel?", "tot welk getal?" — so a child makes one decision and then a smaller
one. Six subjects is the ceiling for a section, which is the ceiling ADR-061
already set for step 2 and for the same reason: past six a grid stops being one
glance.

Chips rather than a menu. A select hides eleven of twelve tables behind a
control a child has to open, and on a touch screen it opens over the thing they
were looking at.

**A sum carries two numbers and the sign between them.** `{ op, links, rechts,
antwoord }`, with `op` one of keer, delen, plus and min. The ids did not change:
`tafel-7x8` is what a child's Leitner box is filed under, and renaming a field
is not worth throwing away every box in the product.

**A mix is the union of other sets, not a file of its own.** "Alle tafels door
elkaar" and the Rekenmix hold the same items with the same ids, composed at run
time. A mix written out as its own content file would have given those sums
second ids, and a child would then have had to learn every table twice over to
fill both sets of boxes. The consequence is that mixes are left out of every
total: a subject's progress is counted over its sets, never over its mix, or
rekenen would claim a thousand sums and report four hundred remembered out of
ten.

**Which sums, for plus and minus, is a judgement and is written down as one.**
A table is every sum in it, because that is what a table is. "Alle plussommen
tot 100" are nine thousand, so `tools/content/build-rekenen.mjs` carries curated
lists with the rule that chose each one above it. That is the half of the
content a teacher could disagree with, and it should be readable rather than
buried in a loop. The arithmetic stays generated and every one of the five
hundred is worked back out by `sums.content.test.ts`.

### Consequences

`build-tafels.mjs` became `build-rekenen.mjs` and writes `content/sommen/` as
well as `content/tafels/`. Five hundred and ten sums, all bundled, a few
kilobytes.

A timed or survival round draws from everything of the same kind rather than
from everything: a minute of tables stays a minute of tables, and a child who
asked for the table of seven is not handed "845 − 140" halfway through
(`sumPool`).

---

## ADR-063 — The Topomix, and a round that says what it was about

**Status:** accepted — 2026-09-08.

### Context

The map had the same gap the tables did: five sets, and no way to ask for all
of them. A child preparing for a test on Tuesday practises provinces, then
capitals, then islands, and never once meets them shuffled — which is exactly
what the test does.

The obstacle was that a topography round has one answer layer. Provinces are
answered on themselves; capitals are answered on a layer of points over them;
the islands are shapes. `useRound` loaded one layer, for the round.

### Decision

**The layer belongs to the question, not to the round.** Every layer the round
can reach is loaded before the first question — five files, none over nine
kilobytes — and each question is answered on the layer of the set it came from.
The sentence follows it too: `noemer` moved onto the round state, so "wijs het
water aan" appears over a sea and "wijs het gebied aan" over a province, in the
same round.

**A round records which set it was about.** `SessionRecord.setId`. The history
used to work this out by matching the questions against the sets, which worked
while every round was one set and breaks the moment one is not: a mix contains
every set's items, so the first set that shares an item always matched, and
every mix would have been logged as a table of one. Rows written before this
still fall back to matching, which is right for them and cannot recognise a mix
— a limitation that applies to exactly one release.

**Two things the mix does not get.** There is no exploring a mix: exploring is
one set's own layer and it is where a child meets a set for the first time,
which a mix of everything is not. And the result screen draws no map after a
mix — one map lights up one layer, so it would show a child four of their eight
misses and quietly drop the rest. The list beside it names all of them.

---

## ADR-064 — The tafeldiploma, without the stopwatch

**Status:** accepted — 2026-09-08.

### Context

The tafeltoets is the one thing about the tables a Dutch child has an opinion
about before they ever meet this app. It is what the teacher hands out, and "ik
heb de tafel van 7" is a sentence they have heard and want to be able to say.
The product had nothing like it: a round of a table was a round of a table, and
a flawless one earned a stamp shared with all twelve.

### Decision

A **tafeldiploma** is a fifth way of practising, offered on a table and on
nothing else. The whole table, ten sums, asked in order, every one right. One
mistake ends the attempt; the result screen names the sum and the child can sit
it again straight away. It is the only thing in this product that can be failed,
and that is what makes it a test rather than a longer round.

**No clock**, and that is a deliberate departure from the tafeltoets a teacher
gives. K10 says on the product's own settings page that haste does not help you
remember, and the timer is off by default. Switching that off for the one
exercise where a child would feel it most would make the sentence a decoration.

**In order, not in the scheduler's order.** Everywhere else Leitner decides,
because practice should start with what a child keeps missing. A test should
not: a table is something a child recites straight through, and a shuffled one
would be asking something they were never taught.

**Twelve of them, on a wall, with the gaps showing.** On the rekenen page and
nowhere else. This is the one place in the product where something not yet
earned is drawn on purpose — ADR-059 ruled out a shelf of unearned rewards, and
rightly, because those were things a child could not aim at. These are twelve
named tables in the order they are taught, and every gap is something a child
can decide to go and do this afternoon: pressing one chooses that table, with
step 2 directly above it.

### Consequences

Stored beside the stamps, in the same object store, under `diploma-tafel-7`. No
schema change and no migration. It is deliberately not in `STAMPS`: that list is
ten named things with a criterion each, and twelve near-identical entries in a
list whose own comment argues against exactly that would be a poor way to keep
it honest.

---

## ADR-065 — The level ladder is shown, and it is counted in correct answers

**Status:** accepted — 2026-09-08.

### Context

The product has awarded XP for every correct answer since the first release: ten
each, five more for each answer given while five in a row were already right. It
computed a level from a tuned curve. It stored the total on the profile.

It showed a child none of it. `levelFor` and `levelProgress` had tests and no
callers. The one number the app kept about how much work a child had done was
invisible, while the two numbers it did show were both reports on how they were
performing.

### Decision

The journey is a card at the top of the child's own column: the level, a bar,
the animal reached, and one line that is the whole point of it —

> Nog 6 goede antwoorden tot niveau 5.

**Counted in correct answers, not in points.** "Nog 340 XP" is a currency
nobody counts in; six correct answers is a thing a child can decide to do this
afternoon. It is exact rather than rounded down — a combo can only make it
arrive sooner, never later.

**Nothing on it mentions time.** Not how many days, not how long, not how often.
Nothing here moves by waiting, and a card that mentioned time would be inviting
a child back for the coming back rather than for the work.

---

## ADR-066 — The start button is a button, and it is at the end of the line

**Status:** accepted — 2026-09-08.

### Context

ADR-061 put the chosen combination on the start button in words: "Provincies
aanwijzen · 15 vragen". That is the right sentence and it was the wrong place
for it. The button sat at the left-hand end of a row, in the same weight as the
two secondary buttons above it, carrying a line of prose. Everything a child
needed to read was on it, and nothing about it said _press me_.

### Decision

The sentence stayed and moved beside the button; the button became a button.
One word — Start — an arrow, taller and wider than any other control on the
page, at the right-hand end of the row where a line of reading finishes. What a
screen reader hears is still the whole thing, because the sentence is the
button's accessible name.

The same shape on the front door: the alternative first, the way on last. A
child who has learned where the button is on one page should find it in the same
place on the other.

On a phone it stacks and goes full width, which is where ADR-052 left it.

---

## ADR-067 — Twelve animals on a ladder, and the journey goes above the figures

**Status:** accepted — 2026-09-08. Reverses ADR-059.

### Context

ADR-059 gave every child all six animals from the first day, on the argument
that a sticker is a choice and not a scoreboard, and that a shelf of things you
have not got yet is a poor thing to be shown every morning. That argument was
right about what was there and wrong about what was missing. The product counted
XP for every correct answer, worked out a level from it, and showed a child
neither (ADR-065). So the one thing on the front door that was theirs unlocked
nothing, and the one thing that was earned was invisible.

The owner asked for what a ten-year-old already understands from every game they
play: something to work towards that you can see coming.

### Decision

**Twelve animals: three from the first minute, then one per level.** Six more
drawn on §E's frame, the last a dragon — the last rung should look like the last
rung. The card in the column shows the animal the child chose, the bar, and the
next one to arrive as a faded silhouette with the count of correct answers to
it.

Three at level one rather than one, and that is ADR-059's real point surviving
the reversal: a child who cannot change anything about an app they are told to
use can at least decide what it looks like. A ladder starting with a single
animal takes that away for the fifteen correct answers it costs to reach the
second. Three is a choice; one is a default.

Three conditions this is not allowed to break, and they are the reason the
reversal is affordable:

- **Nothing is behind money or chance.** There are no boxes to open and nothing
  to buy. Spec §4.5 says so and the audience is why.
- **Nothing is behind waiting.** Only correct answers move it. No daily login,
  no streak requirement, no timer.
- **A child always has one.** The first arrives at level one, so the ladder can
  never leave anybody with nothing to be.

**The journey goes above the two figures.** What is at the top of a child's own
column should say where they are going, not report on where they have been.

**The picking moved to Jij**, where the rest of what a child owns already lives.
The ones not reached yet are shown there rather than hidden — greyed, with the
level on them. That is the difference between a collection and a mystery: a
child can see there are twelve, see which is next, and know what it costs.

### Consequences

The right-hand column is now the same on every screen inside the shell,
including Onthouden and Jij, which did not carry it before.

---

## ADR-068 — The path leaves the app bar

**Status:** accepted — 2026-09-08.

### Context

§A draws "leer.nu/topografie" as a lockup and ADR-061 put it in the app bar,
beside the wordmark, on every page that had an address. It was there to say that
a page has an address — something a parent can write on a note or a teacher can
put on a board.

### Decision

It is gone. The addresses are real and untouched: a module has one, a set has
one, the mixes have one, and `routes.test.ts` is where that is checked.

What the app bar was doing was reading the current address back to a child who
had arrived by pressing something, in a spelling nobody says out loud, in the
strip of the screen where width is worth the most. The rail says which module
you are in and so does the heading. A page does not need to say it a third time.

---

## ADR-069 — The map file a round asks for is the file that has to exist

**Status:** accepted — 2026-09-08.

### Context

Practising the Waddeneilanden answered with "de kaart kon niet geladen worden".
It had done so since the islands shipped, on production, and nothing in this
repository noticed.

The cause is two spellings of one filename. `build-islands.mjs` wrote
`public/geo/nl/waddeneilanden.json`. `SETS['nl-waddeneilanden']` asks
`loadGeoSet('waddeneilanden', 'detail')`, and `geoUrl` composes
`waddeneilanden.detail.json` — the scheme every other shape file follows. The
app fetched a file that was not there and got a 404.

Both halves were tested. `content.test.ts` read the geometry and checked that
every island resolves to a shape, that every touch target is big enough, that
the projection matches the provinces — all of it opening the file **by the name
the builder uses**. The e2e suite starts real rounds and would have caught it in
a second, and it starts rounds of the provinces, the capitals, the waters and
the cities. Four sets out of five.

So the failure sat exactly in the gap: every test passed, and the one thing
neither side checked was that the two names were the same name. It surfaced only
because the Topomix (ADR-063) loads every layer at once, and a round that used
to be four sets became five.

### Decision

The builder writes `waddeneilanden.detail.json`, which is what the rest of the
geometry is called and what the app has always asked for.

And a test that compares the two sides rather than each of them: for every set
in `SETS`, resolve the URL the round will fetch and assert the file is on disk.
It is four lines and it is the only check in the content gate written from the
app's point of view rather than from the content's.

### Consequences

The lesson is not "add a test for the islands". It is that a name composed on
one side and written on the other needs one assertion that crosses the gap,
however well each side is covered on its own. Every future set is checked by
this the moment it is added to `SETS`, which is the only place a set can be
added.

---

## ADR-070 — The ladder counts correct answers, not XP

**Status:** accepted — 2026-09-09. Amends ADR-065.

### Context

ADR-065 surfaced a level the product had been computing since the first release
and never showing, and put one line on it that made it worth showing: "nog 6
goede antwoorden tot niveau 5". That line was a conversion. Levels ran on XP —
ten a correct answer, five more inside a combo — so the card divided by ten and
rounded up, and a child in a combo reached the level one answer sooner than the
card had said.

It was also the wrong unit to promise in. XP is a currency for the avatar shop
that does not exist yet; a level is a promise about work.

### Decision

The ladder runs on **correct answers over everything, ever** — the number
`loadAccuracy()` has always returned and the front door has always shown. The
line beside the bar is now a subtraction rather than a conversion, and what the
card says and what the level counts are the same thing.

The curve is **25, 50, 100, 200, and 200 from there**. Doubling three times and
then settling: the first level is a few days, the fourth a few weeks, and none
of them is ever out of reach. Pure doubling would have put level ten at nearly
thirteen thousand answers — three years at ten a day — and a rung nobody can
reach is not a rung.

XP and coins are untouched and still earned on every round. Merging them into
this would have meant a child who spends coins losing their level.

---

## ADR-071 — Twelve animals, five times over, in five materials

**Status:** accepted — 2026-09-09. Extends ADR-067.

### Context

ADR-067 made the twelve animals a ladder, one per level. Twelve is about ten
months of practice and then the ladder stops, which is a long time to a
ten-year-old and no time at all to a product that means to be used for years.

The owner asked for what every game they play does next: the same collection
again, in a better material.

### Decision

**Five reeksen of twelve.** A level hands out one animal; when twelve are held
the next twelve start in a new material. Ink, then bronze, silver, gold,
diamond. Sixty in all: the last arrives at level 58, which is 10,975 correct
answers.

Materials rather than "colours". A ladder of ink, bronze, silver, gold and
diamond is one a child already knows, and each rung is told apart by **name** as
well as by hue — the rule §A applies to everything else in this product, and a
reward is not the place to make an exception.

Four colour tokens, and they sit outside both existing scales: a material is not
a module accent (§B allows those on exactly three things) and not a semantic.
Each is one value for both themes, because a material that changed hue between
light and dark would stop being a material, and each clears 3:1 on both grounds
— they carry a drawing, and three is §A's floor for one. `contrast.test.ts`
measures all four in both themes.

The first reeks is the theme's own ink, so the row every child has from the
first minute costs nothing to read and needs no fifth colour.

### Consequences

The arithmetic lives in `game-core/collection.ts`, pure and tested. It used to
be a `level` field on each entry in `stickerSet.ts`; that was a second copy of
the same rule, which is how two of them come to disagree. The list of animals
now knows only the order they arrive in.

---

## ADR-072 — A second streak, for answers rather than days

**Status:** accepted — 2026-09-09.

### Context

The day streak is designed not to punish (spec §4.3, ADR-031): holidays cannot
break it, a missed day spends a rest day rather than resetting. That is right
for what it measures — turning up — and it means the product has no number that
answers "how well am I doing right now".

### Decision

A run of **correct answers in a row**, with its best alongside it, under the
figure it belongs beside in the child's own column.

It is the only number in this product that a single wrong answer takes away, and
that is exactly why it is second: a child meets the slow, forgiving one first.
Losing it costs nothing else — no coins, no level, no stamp, no rest day. "Ik
weet het niet" ends it like any other wrong answer, because the run is about
knowing.

It runs across rounds and across modules. "Twaalf goed op rij" is a thing a
child says about themselves, not about one round of one table.

Counted in `saveAnswer`, which every answer in the product already passes
through — counting it in the two round hooks would be two places to forget the
third module. Stored on the streak row: both are one number per child about how
the practising is going, and a second object store for two integers would be a
schema version nobody needed.

---

## ADR-073 — The Rekenmix has three difficulties, from the level the content already carried

**Status:** accepted — 2026-09-09.

### Context

The Rekenmix (ADR-062) shuffles all five hundred and ten sums. That is right for
a child who knows their tables and wrong for one who has just met the table of
two: "845 − 140" in the middle of a mix is not a challenge, it is a wall.

### Decision

Three difficulties and an everything, and the difficulty is not a new idea. Every
set has carried a `niveau` since the tables shipped, and it decided the order the
sets were offered in and nothing else. It decides this too now.

It divides evenly, which is worth noticing rather than relying on: level one is
the tables with a rule you can say out loud (1, 2, 5, 10), their divisions and
plus and minus to twenty — a hundred and seventy sums. Level two is the tables
with a doubling to lean on and the range to a hundred. Level three is the four
tables that get learned last and the range to a thousand.

A child who picks "makkelijk" gets sums they can do. A child who picks "pittig"
asked for it.

---

## ADR-074 — A round is as long as the child says

**Status:** accepted — 2026-09-09.

### Context

A round has been ten questions since the tables shipped, and fifteen on the map.
That was the right number when a set _was_ ten. The Rekenmix holds five hundred
and ten sums and the Topomix a hundred and fifteen, and ten of five hundred is a
child who never finishes anything.

### Decision

**Ten, twenty-five, fifty or a hundred**, chosen beside the line that says how
long the round will take — which is the thing it changes. Ten stays the default,
so nothing moves for a child who does not choose.

Only the lengths that fit are offered, and the row is absent when fewer than two
do. Fifty questions of a table of ten is a button that lies: the round would ask
ten and the estimate beside it would have said six minutes.

Offered only where a round has a number of questions at all. A lightning round
ends on the clock, a survival round on three lives, and a tafeldiploma is the
whole table or it is not a diploma.

Not a numbered step. Steps one and two are what to practise and how; the length
is a property of the round those two have already chosen, and a third heading
would have made the flow look longer than it is.

---

## ADR-075 — The diploma wall belongs to the tables, not to the page

**Status:** accepted — 2026-09-09. Amends ADR-064.

ADR-064 put the twelve diplomas at the foot of leer.nu/rekenen. With four kinds
of sum on that page (ADR-062), the foot of the page is under the plus sums as
often as under the tables, and a wall about tables has nothing to say to a child
who is practising subtraction.

It moves under the **Tafels** subject, and appears only when that subject is
open. Everything else about it stands: the gaps are the point, and pressing one
chooses that table and the diploma at once.

---

## ADR-076 — The collection has a page

**Status:** accepted — 2026-09-09.

### Context

The card in the child's own column shows the level, the animal they wear and the
one arriving next. It cannot show sixty animals, twelve diplomas and ten stamps,
and a child who wants to know _what else is there_ had nowhere to look. The
stamps were the worst of it: ten of them, awarded silently at the end of a round,
and no screen in the product that listed them.

### Decision

**leer.nu/ontdekkingsreis**, reached from that card and by its own address.

Everything collectable is on it, in the order of how long it takes: the sixty
animals in five rows, the twelve tafeldiploma's, the ten reisstempels with their
criteria. Everything not yet earned is shown rather than hidden, and every one of
them says what it costs — the same argument the diploma wall makes, at the scale
of the whole product.

It never says _when_. No dates, no "come back tomorrow", no counter that moves by
waiting. Everything on the page is bought with correct answers and nothing else,
which is the promise ADR-067 makes and the one thing this page could quietly
break.

**Not a fifth tab.** The tab bar has four destinations the product is organised
around; this is the long view of one card, and a tab would have made it look
like a section.

### Consequences

The animal picker moved here from "Jij", which is where it went when it left the
front door (ADR-067). Picking is choosing from a collection, and the collection
is here. Only the ink row can be worn: those drawings are the avatar in the app
bar, and a material there would need a second drawing in every place the first
one is used.

---

## ADR-077 — More than one test, and a block that holds only tests

**Status:** accepted — 2026-09-09. Amends ADR-054.

### Context

Two things were wrong with the one block on the front door that has a border.

**It held one test.** A child has topography on Tuesday and the tables the Friday
after, and a block with room for one date made them choose which of the two to
plan for.

**It held the way into a round as well.** "Ga verder met rekenen" sat under the
date, inside the same border, so one block answered two questions: when is the
test, and what shall I do now.

### Decision

A **list** of tests, soonest first, each with its subject and a way to take it
off. A form under it adds one — a form rather than fields that save as you touch
them, because adding is a thing with an end and a half-typed date would otherwise
become a row.

The soonest test decides what the front door offers to carry on with, which is
what makes the list a plan rather than a calendar.

And **nothing else in the block**. The way on moved out from under it, into its
own block in the same place on the page. The second question is still answered,
and it is answered on its own.

Tests that have been are dropped rather than shown: a test in the past is not
part of a plan. The one test a device already had is carried over on read.

---

## ADR-078 — "Oefen je fouten"

**Status:** accepted — 2026-09-09.

### Context

The Leitner scheduler has put what a child keeps missing at the front of every
round since the first release, and `foutCount` has been written on every wrong
answer and read by nothing. What the product could not do is be _asked_. A child
who knows perfectly well which sums they keep getting wrong had no way to say so.

### Decision

A subject on leer.nu/rekenen, last in the list and present only when there is
something in it: the sums this child has got wrong at least once, most-missed
first.

It is the only subject in the product that is different for every child, and the
only one whose contents are read at the moment the round starts rather than when
the page loaded — a child who has just put one right should not be asked it again
because a card was stale.

Five is the floor. Below that it is not a subject, it is a list, and a card
offering three sums is finished in twenty seconds. It also spares a child their
very first mistake being turned into a heading about them.

---

## ADR-079 — One block on "Jij" for the adult in the room

**Status:** accepted — 2026-09-09.

"Jij" is the one screen in this product a parent opens, and it told them their
child's name and two switches.

It now opens with **the week**: how many rounds, on how many days, how many
questions, what it came to, what was practised most, and when the next test is.

Deliberately not a report on the child. No forecast, no percentage of what they
remember, no comparison — those belong to the child, on Onthouden. A parent
reading a projection about their ten-year-old on a settings page is the start of
a conversation nobody wanted. What this says is what happened.

Seven days, because a week is the unit a parent thinks in and the unit a school
test is set in.

---

## ADR-080 — The collection's five materials are brons, zilver, goud, platina, ultra

**Status:** accepted — 2026-09-09. Amends ADR-071.

Five materials, and two of them were doing no work. "Inkt" was the product's own
colour rather than a rung — a child could not say whether it came before bronze
or after gold — and "diamant" is precious without being a step anybody counts
from. The row a child saw first was called **zwart**, which reads as "no colour
yet".

Bronze, silver, gold, platinum, ultra is the ladder every ten-year-old already
knows from the games they play outside this product. It needs no legend, the
order is not something the interface has to teach, and "ultra" is a word that
says "this is the end of it" without a sentence explaining so.

What does not change: sixty animals, twelve to a reeks, one per level, nothing
behind money, chance or waiting. Only the names and two of the five hexes.

The first row is bronze rather than ink, so the animals a child can wear as
their avatar are drawn in bronze. Every material still clears 3:1 against paper
in both themes and each is a distinct value — `contrast.test.ts` asserts both.

---

## ADR-081 — What has not been earned is a parcel, not a faded animal

**Status:** accepted — 2026-09-09. Reverses half of ADR-076.

ADR-076 put the whole collection on one page and showed everything not yet
earned as a faded drawing with its price under it, on the argument that "a gap a
child can aim at is worth more than a surprise".

Half of that is right and stays: **the price is always visible.** "Niveau 34" on
a cell is the thing a child can plan around, and nothing in this product is ever
earned by chance or by waiting.

The other half was wrong. A child could read the entire collection off the
screen on their first afternoon — all sixty animals, in order, by name — and
then spend forty levels arriving at things they had already seen. The card in
the right-hand column made it worse by naming the next one: "Hierna: vos in
zwart" is a week's notice of a surprise.

So an animal that has not been earned is drawn as a **parcel** and its name is
not given. The cell keeps its place in the row, keeps its level, and keeps its
accessible name — "Nog onbekend dier in platina, vanaf niveau 34" — which says
exactly what a child needs to aim at it and nothing more.

A parcel and not a padlock. A lock says "you may not"; a parcel says "not opened
yet", and those are two different sentences to say to a child.

---

## ADR-082 — The front door offers what is played most, not what we would pick

**Status:** accepted — 2026-09-09.

Between the test block and the log stood one card: the set the product had
decided to offer next, with its size, its number of rounds, a "Ga verder" button
and an "Andere manieren" button beside it. It answered a question the child had
not asked yet, in a card that reported before it offered.

It is replaced by **four tiles: the exercises this child has played most, with
how often.** "12 keer gespeeld" is a fact about them that no mark and no bar
tells them, and every tile is one press back into the round it names.

The count is this device's own and nothing else. There is no backend and nothing
leaves the machine (ADR-015), so "most popular with everyone" is not a number
this product has, and inventing one — "3.412 keer gespeeld" — would be putting a
fabricated figure in front of a child on a page whose whole claim is that it
does not track them.

A profile with no rounds behind it gets four to start with, at nought rather
than at a guess, under the heading that says so.

The greeting above it changed with the same argument. "Vandaag oefen je 10
vragen" named a ceiling the product does not have; nothing stops after ten. What
it says now is what is true of every session: practise as long as you like, and
what you had before comes back on purpose.

---

## ADR-083 — Topography asks where before it asks what, in one word each

**Status:** accepted — 2026-09-09. Extends ADR-062.

Step 1 on /topografie was five cards named after their sets: "Provincies van
Nederland", "Hoofdsteden van de provincies", "Steden van Nederland", "Zeeën en
meren", "De Waddeneilanden". Three of the five ended in the same two words, and
every one of them was a phrase where a button wanted a word.

The page now asks the coarsest question first — **Wereld, Europa, Nederland** —
and the subjects under it are one word each: **Provincies, Steden, Wateren,
Eilanden, Mix.** The region says where, so the cards do not have to.

The two city sets become one subject with two chips under it, which is the shape
ADR-062 already gives the twelve tables: the twelve capitals and the eighty
cities are the same question at two sizes, and a child who wants "steden" should
not have to know which of two cards means which. Both keep their own address.

**Wereld and Europa are shown and cannot be pressed.** There are no maps behind
them and there is no pretending otherwise — the same promise the rail makes
about klokkijken and vlaggen (ADR-051). A child who can see that the countries
of Europe are coming is reading a plan; a chooser that hid them would make the
product look like it is only about the Netherlands.

The step numbers moved out of the copy and into the page, because topography now
has three steps and rekenen still has two: a "1 ·" written into "Kies een
onderwerp" would be the wrong number on one of the two pages. The headings also
lost their caption — step 2 read "Hoe wil je oefenen? van makkelijk naar
moeilijk", which is eight words where four are the question — and both step
headings moved from the 11px mono label to the display face at h3. They are the
two questions the page is; they were set at the size a caption gets.

---

## ADR-084 — The parcel is opened where the work was done

**Status:** accepted — 2026-09-09. Completes ADR-081.

ADR-081 stopped the collection from saying what is inside a cell before it is
earned, and bought a surprise. What it did not do is give the surprise a moment
to happen in: an animal still arrived silently, on a page a child has to go and
open, and now they could not even read its name in advance to know it was
coming.

So it is handed over at the end of the round that earned it, on the result
screen, as an unwrapping — the same parcel from the collection, going away, and
the animal underneath it.

Three things it says. **What it is**, drawn at heading size in its material.
**Which reeks**, because that is what makes one animal rarer than another.
And **which level handed it over**, because a reward nobody can explain is a
riddle — the rule the reisstempels have followed since ADR-040.

What it does not say is "goed gedaan". The product reports what happened; what
to feel about it is the child's.

**It is absent almost every time**, which is the whole of why it is allowed to
move. Twenty-five correct answers buy the second animal and two hundred buy the
fifth, so this card appears a handful of times a month; a block that appeared
after every round would be furniture inside a week, and a moving one would be
furniture that twitches.

The animation is the second in the product, after the dot that travels from a
wrong answer to the right one. That one teaches — the distance is the lesson.
This one does not, and that is the exception being made: a thing that is handed
over should arrive like a thing being handed over. It runs only under
`prefers-reduced-motion: no-preference`, and the static state is the animal
plainly, so asking for less motion costs nothing but the flourish.

---

## ADR-085 — Toetsstand is a switch on a round, not a seventh way of practising

**Status:** accepted — 2026-09-09.

Every round in this product answers back. A shape turns green, a wrong pick
travels to the right one, a sum shows what it was, and the child is told before
they move on. That is the teaching and it is right almost everywhere.

It is not what a test does. A child who has only ever practised with the answer
arriving half a second later has practised something the test will not ask of
them: recalling twelve things in a row with nothing coming back in between.

**Toetsstand** turns the answering off. The round asks, takes what it is given,
and goes straight to the next question — before the frame is painted, so there
is not even a flash of the state that would have shown. At the end it lists what
was missed, as every result screen does, and it gives **a mark**.

**The mark is only here.** Every round is scored and every round is logged with a
cijfer on the front door; no round screen has ever handed one over, because a
mark for a round where the app corrected you after every question is a number
about the app. A toetsstand is the one round where nothing helped, so it is the
one round whose mark says something about the child — and it is the number they
can hold next to the one they get at school, which is the whole reason for
practising this way.

**A switch and not a card.** Step 2 holds six ways at most (ADR-061), and
topography already offers six. A seventh card would have pushed one off the page
to say something that contradicts none of them: "the answers come at the end"
can be done to pointing, to choosing and to typing alike. So it sits where
"hoeveel vragen?" sits — a property of the round the two steps above have
already chosen (ADR-074) — and the sentence beside the start button carries it,
because a child who turned the answers off and read a button that did not say so
would find out by playing.

Not offered where there is nothing to withhold: **ontdekken** asks no questions,
and a **tafeldiploma** already ends at the first mistake.

And one press that sets the whole thing up. Where the plan says this module has
a test, the line that says so carries "Oefen zoals de toets": it selects the mix
— because a test does not come one set at a time — and switches the toetsstand
on. It chooses rather than starts, exactly like the line about today's list
(ADR-061 again): how is still the child's to say.

---

## ADR-086 — Europe and the world, and what counts as a country

**Status:** accepted — 2026-09-09. Completes ADR-083.

ADR-083 put a region row on /topografie with Wereld and Europa on it, marked
"binnenkort" and not pressable. They exist now: forty-six countries of Europe
and a hundred and sixty-seven of the world, from Natural Earth, built by
`tools/content/build-countries.mjs`.

Four things had to be decided and every one of them is written down in the code
that acts on it.

**A background belongs to a set, not to a round.** Every round drew the
provinces and put its answer layer on top; that was one region's arrangement
written into the round. `SETS` now carries the region and the background file
per set, which is also the only thing that has to be true for a fourth region
to be a row in a table rather than a branch in a hook.

**A mix is one map.** The Topomix was "every set there is". It is the Dutch five
now, because a round that changed its own background halfway through is not a
round, it is two.

**Two projections.** RD's stereographic is right for the Netherlands and stays
right for a continent re-centred on 52° N, 15° E. It is useless for a globe, so
the world map is Miller cylindrical — a compromise, and the compromise every
schoolroom wall map makes. Mercator is what a child knows from a phone and the
one we may not use: it draws Greenland the size of Africa, on a product that
exists to teach how big things are. Both are closed-form and written out in
`projection.mjs`, for the reason that file has always given: a projection that
is subtly wrong makes a map that looks plausible and teaches something false.

Europe is clipped to a window in degrees before it is projected. Russia reaches
the Bering Strait; in a stereographic centred on Poland that is a hundred and
sixty degrees from the centre, and the map would have been of the northern
hemisphere or of nothing. Clipping is what a printed atlas does when it stops at
the Urals, made explicit.

**What counts as a country is the source's own answer, twice over.** Natural
Earth's admin-0 layer holds sovereign states, dependencies, crown dependencies
and disputed territories in one file, and choosing between them is where a map
for children quietly becomes a political statement. A feature is a country here
when it is its own sovereign (`ADMIN` equals `SOVEREIGNT`) **and** it has an ISO
3166 code. The first keeps the Netherlands, France and Kosovo and drops Jersey,
the Faroes and Puerto Rico; the second drops Northern Cyprus and Somaliland,
which govern themselves and which the standards body has not listed. A product
for ten-year-olds does not settle that question. Cyprus is the one named
exception in the other direction: Natural Earth files it under Asia and every
Dutch atlas prints it on the Europe page.

The Dutch names come from the data (`NAME_NL`), never from us. Two of them are
corrected because the country renamed itself and the source has not caught up —
Eswatini in 2018, Belarus when Buitenlandse Zaken moved — and both keep the old
name as an alias, so a child writing what their older brother learned is not
told they are wrong.

**One subject per region, and that is not a placeholder.** A continent has one
thing on it a child is asked to find and it is the countries. Rivers and
mountains would be a second subject and a second licensed source; neither
exists, and a card for one that does not would be the product promising
something.

**A help ring shrinks before it gives up.** A shape too small to hit gets a
circle it can be hit with, and on the Wadden islands that is exactly right: five
specks, far apart, one ring each reaching nothing else. On a map of the world on
a phone almost every country is too small by the same measure, and full-size
rings pack together — a child aiming at Togo landing inside Ghana's, which is a
wrong answer the map handed them.

So each ring is pulled in to half the distance to its nearest neighbour, and
what shrinking ruins is dropped. The Vatican and San Marino end up with a ring
each at two thirds size rather than one overlapping pair; a country three pixels
wide on a phone ends up with none, and its own coastline is the target again.
That last case is hard to hit, which is true of a paper map too and is the
honest failure of the two.

---

## ADR-087 — Six werelddelen, and pointing stops leading where pointing cannot work

**Status:** accepted — 2026-09-09. Completes ADR-086.

Three things were looked at before anything was built: what other geography apps
do, what a Dutch school test actually asks, and — once the first two suggested an
answer — whether the numbers agreed.

**What other apps do.** Seterra, World Geography Games and Lizard Point all
organise themselves per continent and keep the world map as the thing you work
towards; Lizard Point additionally puts fixed magnifying glasses on the world map
that open an enlarged region. The Seterra app offers free pinch-zoom, which is
also where its reviews complain: picking the smallest countries on a phone stays
hard. Some apps draw a dot where a country is too small, and players object that
it teaches you to recognise the dot rather than the shape.

**What a Dutch test asks.** A blank map with numbers, and the child writes the
names underneath. Pointing is how topography _begins_ in this product; it is not
how a world topography test works.

**What the numbers said.** For every map, count the countries that end up with
neither a usable help ring (ADR-086) nor enough of their own area for a
fingertip:

| regio         | landen | laptop | tablet | telefoon |
| ------------- | ------ | ------ | ------ | -------- |
| Zuid-Amerika  | 12     | 0      | 0      | 1        |
| Oceanië       | 9      | 1      | 1      | 1        |
| Noord-Amerika | 23     | 12     | 13     | 20       |
| Europa        | 46     | 4      | 7      | 21       |
| Azië          | 47     | 5      | 9      | 29       |
| Afrika        | 52     | 5      | 9      | 19       |
| Wereld        | 167    | 90     | 106    | 160      |

That table changed the plan. **Werelddelen fix the laptop and the tablet** —
Europe goes from unusable to four hard countries out of forty-six — and they do
not fix the phone, where a map gets about two hundred pixels of height and
nothing short of zooming would.

So both halves are built.

**Six werelddelen** join Europa and the wereld in the region row: Afrika, Azië,
Noord-Amerika, Zuid-Amerika, Oceanië. Five more rows in the build's table, which
is what ADR-086 said a region would cost, and it was true.

**Pointing stops leading where pointing cannot work.** Past fifteen answerable
shapes a map is not pointable on a phone; past a hundred it is not pointable
anywhere, which is the world map and only the world map. There, "aanwijzen" moves
to the end of step 2 and **meerkeuze leads**: the map lights a country up and the
child answers in words, which needs no precision and is the direction the school
test asks in.

Moved, never removed. On a digibord a class points at the world map together, and
a rule about phones has no business taking that away.

Point sets are exempt: a city is already drawn as a marker sized for a finger, so
eighty cities are eighty targets. This rule is about hitting a coastline.

**And a ring says which one.** Choosing and typing ask a child to _find_ the
country before they name it, and three pixels of coastline is as hard to find as
to hit. In those two modes the asked-about shape gets a ring in the accent — not
a target, since nothing is pressable there, and the one mark on the map that is
about the question.

**A view box follows its countries, never its window.** It followed the window
for one release, on the argument that a frame stopping at the last Russian vertex
would leave the cut visible as a gap. Wrong twice: a clipped edge is the extreme
point, so it lands on the frame either way — and a rectangle in degrees is,
through any of these projections, a curved region whose bounding box is larger
than what it holds. Asia and North America were drawn at about six tenths of the
size they could have been, which is six tenths of a touch target on exactly the
maps where that is the problem.

**What is not built.** Free pinch-zoom, which is what most apps reach for and
what their users complain about most on a phone; here it would also mean a
keyboard equivalent and a tab order over a map whose every country is a button.
And insets for the Caribbean, which is the one place a werelddeel map does not
fix (twelve of Noord-Amerika's twenty-three are hard even on a laptop). Both stay
open.

---

## ADR-089 — A tile is a mark and a name, and the answer already given is coloured

**Status:** accepted — 2026-09-09. Reshapes step 1 and step 2 of ADR-061 and
ADR-062, and adds the fourth thing §B lets an accent paint.

A module page is a chain of questions: where on the map, which subject, which
one of those, how, and whether the answers wait until the end. Only the first
of them was drawn as a row of tiles. The rest were cards — a name, a second
line under it, twenty-four pixels of padding all round — and step 1 and step 2
together took about six hundred pixels of a tablet's height. A child could see
the question and not the answer to it without scrolling.

**All of them are tiles now.** An icon and a name of a word or two, sized to
what it says, wrapping when the row runs out. The same two steps are about a
hundred and thirty pixels, and the whole flow including the start button fits
on a laptop screen.

**The sublines are gone.** "Nog niet geoefend", "alles van de kaart door
elkaar", "rondkijken, geen vragen". They were tried once under the row instead
of on the tile, about the chosen one only, and that was still five paragraphs
back on a page whose whole change was to take them off. What the six ways of
practising are for still reaches a screen reader, in each tile's label, which
is what ADR-061 actually needs — it asks that a child can tell the six apart,
not that a sentence is printed six times.

**Every tile has its own mark.** Eight regions shared one ruled globe and every
subject shared the progress dot, so a row of eight tiles had one drawing
between them. The werelddelen are deliberately not silhouettes: §E's rule is
that a real map shape comes from the topography source, because a continent at
24px is a continent drawn wrong. They share one globe with a dot at one of six
compass points, which is true, small, and the same question the row is asking.
Nederland is a pin, because it is the one entry on that row that is a country.

**The answer already given wears the module's colour.** This is the fourth
thing §B lets an accent paint, after the highlight, the progress bar and the
module entrance, and it is the first time one has been added since. The
argument is that this page is nothing but questions, and the answer to each is
the only thing on it worth finding again after looking away — in ink it was one
slightly darker rule among twenty. The rule also doubles in weight, because §A
does not let a hue carry a state on its own, and a child who cannot separate
the tint from the paper still sees which tile is chosen.

**Four names changed.** Eilanden became **Waddeneilanden** and Mix became
**Topo-mix**, both of which say which thing they are rather than leaving the
row above to say it. Toetsstand became **Oefentoets**, which is the word a
Dutch child hears at school for the thing it is. And "Typ de naam" and "Typ het
antwoord" both became **Zelf typen** while "Kies uit vier" became
**Meerkeuze** — three words do not fit in a tile, and the two modules now name
the same act the same way. Every address is untouched: /topografie/mix still
opens the Topo-mix, because a rename that breaks a link a parent wrote down
costs somebody a page that will not open.

**What this costs.** How far along each subject is has left the page — it was a
figure on every tile and it is now only in the tile's label and in the
right-hand column, which is where a child reads progress rather than chooses.
And the six werelddeel marks are a family rather than six recognisable things:
the dot says roughly where, and nothing more. Both were accepted deliberately;
neither is a bug to be found later.

---

## ADR-092 — Klokkijken is a module, and it asks in two directions

**Status:** accepted — 2026-09-09.

### Context

The third module of business plan v6 §5.5, and the one the rail has been
promising since ADR-051. It had an accent, a pictogram, a rail entry and an
address that answered "binnenkort"; what it did not have was a page or anything
behind one.

Two things about the clock are not true of either module already built.

**There are two notations for one fact.** "Half acht" and "7:30" are the same
reading, and a child who can say one and not write the other has learned half of
it. A province has a name; a sum has an answer; a time has a sentence and a
number, and they are not interchangeable in a Dutch classroom — the sentence is
what a teacher asks for and the number is what a digital clock shows.

**The hard part is Dutch.** Half past seven is "half _acht_". Every step from
twenty past onwards names the hour that is coming rather than the one that has
been, and that single rule is what a Dutch child gets wrong and what a
schoolbook drills. Any content model that stored the words would have had to
store that rule twelve times over.

### Decision

**The module is four steps and a mix**, at leer.nu/klokkijken: hele uren, halve
uren, kwartieren, vijf minuten. One subject per step and one set under each, so
the page has the shape topografie's Nederland row has rather than the shape
rekenen has — no region row, no chips, two numbered steps.

**The content stops at five minutes.** A hundred and forty-four faces rather
than seven hundred and twenty. Going to the minute would add five hundred and
seventy-six positions no schoolbook shows and no child has words for; the app
design's line for this module is "hele en halve uren", and this is that plus the
two steps a classroom teaches after it. That is a judgement, it is written out
in `tools/content/build-klok.mjs` with the reason, and a teacher who disagrees
is having a conversation rather than reading a bug.

**The face is twelve hours; what a child may type is twenty-four.** A clock does
not know whether it is morning, so a child who reads half past seven as 19:30
has not made a mistake, and `judgeKlok` accepts it. It also accepts `7.30`,
`730` and `7u30`, on the same argument `judgeSum` makes about a stray full stop:
failing a child for a separator measures the keyboard.

**The words are not content, and they are not in `game-core` either.**
`klokVorm` returns which of the eight Dutch shapes a time is said in and which
hour it names; `features/klok/klokTaal.ts` puts the words on through `t()`. The
pure layer stays language-neutral — it is the one a server has to be able to
import (ADR-015) — and the Dutch stays in `i18n` with every other string. It is
the same split `rekenNaam` already makes for "Tafel van 7".

**Five ways of practising, and one of them runs the other way.** Meerkeuze
first, which is the map's order and not the tables': the four times offered are
the four mistakes children actually make reading a clock — an hour out, over for
voor, the hands swapped, five minutes out — so choosing between them is the
exercise rather than a way round it. **"Klok zoeken" is second**, and it shows a
time and asks which of four faces says it. That is not multiple choice with the
question and the answer swapped: it is the half of clock reading that catches a
child who has learned to recognise twelve pictures, and it is a mode of its own
because what the child is looking at differs. Typing is third, for the reason
the map gives — writing it unaided is what a test asks. Then the clock and the
lives, as everywhere.

No exploring: twelve faces is not somewhere a child can wander. No diploma: no
Dutch school hands one out for the clock the way it does for a table, and
inventing one would be inventing a certificate.

**Read-aloud does not read the answer.** On rekenen the button speaks the
question, because the question is "7 × 8". Here the question is a picture, so
the button speaks the instruction — and speaks the time only in the one mode
where the time _is_ the question. K9's read-aloud is for a child who cannot read
the words, not for a child who cannot read the clock.

**The subject marks are the module's own mark, saying four particular times.**
Three of the four tiles are a clock face with the hand where that step puts it,
so a child who cannot yet read "kwartieren" can see which tile has the hand on
the three. §E allows the shared circle for the reason it allows the diamond
inside `StampIcon`: what may not be shared is the silhouette.

**/klok works as well as /klokkijken.** The rail says "Klok", so that is what a
parent types. One row in a table, one way — `pathFor` still writes the module's
own slug — which is the same relationship /rekenen and /tafels have a level up.

### The round wiring, and why it is still three copies

`useSumRound` says in as many words that the third module is when the guess
about what is shared becomes an observation. It is, and the observation is this:
what all three share is everything from `composeRound` down to
`applyRoundRewards` — the schedule, the session record, the three ways a round
ends, the combo, the streak and the rewards — and all of that is already
imported rather than copied. What none of them share is the question: a map
needs geometry and an answer layer, a sum needs a keypad, a clock needs a face
and asks in two directions.

What is genuinely duplicated is the hundred lines of bookkeeping between those
two, three times over. Extracting it is a change to three working round hooks at
once, with its own test run and its own way of going wrong, and it is not made
safer by riding along with the module that finally made the case for it. So it
is written down here as owed rather than done.

### Consequences

Klokkijken is `built`, which turns on more than its own page: it appears in
"verder oefenen" with a progress bar, a test may be set for it, its sets show up
in favourites and in "meest geoefend", and its rail entry opens a chooser rather
than "binnenkort". Three tests that used klokkijken as their example of a module
that does not exist yet now use woordjes — which is the plan doing exactly what
ADR-051 says a rail full of unbuilt doors is for.

The module earns no animals of its own. `rewards.ts` names sets by id for the
map and the tables, and the two mode-based rewards — a lightning round and a
survival round — apply here as they do anywhere. A clock-specific collection is
a content decision and not part of building the module.

---

## ADR-093 — Below 1200 the modules are a menu, and the destinations lie along the bottom

**Status:** accepted — 2026-09-10. Reshapes the frame of ADR-029 and ADR-051;
what the rail lists is unchanged.

### Context

The redesign handoff of September 2026 draws the frame in three postures: a
desk at 1440, a tablet at 834 and a phone at 390. The frame as built had four
and drew them differently. A tablet got the rail lying along the bottom of the
screen and the destinations as a row in the app bar; a phone got the
destinations along the bottom and no way to a module at all except the tiles on
the front door.

### Decision

**One width, 1200, replacing Tailwind's 1280.** From there up the app bar
carries the wordmark and the destinations, and the modules stand in a rail of 96
on the left. Below it the app bar is the mark, the streak and the child. No size
the app is tested at sits between the two numbers — the Chromebook (1366) and
the laptop (1440) keep the rail, the iPads (1080, 810) and the phones do not —
so the handoff's value moves no device and is the one the design is drawn to.
It is a Tailwind screen of our own, `desk`, and `useDesk` for the one place a
component needs to know.

**Below 1200 the modules are one control under the app bar** (`VakMenu`). It
says which module you are in — or "Kies een vak" where you are in none — and it
opens into the same five the rail lists, in the flow of the page rather than
over it. A disclosure holding a navigation, not an ARIA menu: these are places
to go, and `role="menu"` would take a screen reader's reading keys away. It
opens with focus on the module you are in, moves with the arrow keys, Home and
End, and closes on a choice, on Escape, on a press outside it and on tabbing out
— with focus back on the button after the first two.

**Below 1200 the destinations are a tab bar with a mark over each word.**
Vandaag is a sun, drawn for the purpose; Onthouden takes the freezer and Jij the
pupil, which already meant those things. Where you are is a rule across the top,
a surface and a heavier word, in ink. The handoff draws it in topography's blue,
and that is not followed: a destination is not a module, and §B does not let an
accent say which one you are on.

**The streak is a pill at every size**, and the rail loses the mark at its head:
the handoff draws neither the rule that hid the streak on a phone nor a logo
above the rail, and the mark alone in the bar below 1200 is what pays for the
streak's width.

### Consequences

Exactly one of each pair is displayed at any width, and the menu's list is not
in the document until it is opened — so the rail and a closed menu never both
answer to "Modules". The rail tests in `sums.spec.ts` and `klok.spec.ts` run at
the two desk sizes only now, and `shell.spec.ts` walks the menu at the four
below.

---

## ADR-094 — The front door is three rows that scroll, and the child's column is four blocks

**Status:** accepted — 2026-09-10. Redraws K1 (ADR-077, ADR-082) and the
column every page carries (ADR-067); nothing is added to what either holds, and
nothing is taken away.

### Context

The same handoff redraws the front door as three rows that scroll sideways —
most practised, recently practised, carry on — and the child's column as four
cards of one shape, with the test block moved out of the middle of the page and
into the column. Its brief is a styling and layout revision: the same blocks,
the same order, the same behaviour.

### Decision

**Three rows, one line each at every size.** "Meest geoefend" and "Recent
geoefend" hold five cards of the same shape, most played and newest first;
"Verder oefenen" holds every module in the rail, furthest along first, with the
ones that do not exist yet after all of them. Five rather than four and three:
`POPULAR_SHOWN` is five, and the starting list for a new profile gains the
clock's whole hours to match. The scrollbar is hidden and scrolling is not — a
finger or trackpad, two round buttons from a tablet up that switch off at the
ends, and the arrow keys on the row, which is a stop in the tab order. A step is
a jump rather than a glide when the reader asks for less motion. The buttons are
44 where the handoff draws 40: 44 is the floor (ADR-032).

**The column is four blocks with a band across the top**: Jouw toetsen, Jouw
voortgang, Goed beantwoord, Jouw favorieten, in that order from 1200. Below it
the blocks go into the flow of the page, progress first — side by side with the
tests on a tablet, above the rows — and the other two after the rows. The order
is decided in React (`useDesk`) rather than with CSS `order`, so a keyboard and
a screen reader meet the blocks in the order the eye does.

**Below 1200 the test block is only its dates.** That is what the handoff draws.
It leaves "adding a test" to a screen that is out of scope; removing the form
from a tablet and a phone until that screen exists was not an option, so the
dates are a button that opens the block into what a laptop shows, and "Klaar"
closes it.

**Four things the handoff leaves out are kept**, because a layout revision is
not the place to take behaviour away: Goed beantwoord and the favourites on a
tablet (at the foot of the page, where the handoff says they will "get a place
elsewhere" that does not exist yet), what is still wrapped up on the progress
card (ADR-081), and the run of correct answers under the percentage (ADR-072).

**The accuracy ring is ink, not gold.** A material is a reward (ADR-071) and how
the work is going is not one. The progress bar does take the material of the
reeks being filled, on that material's soft tone, because that bar is the
reward's own.

**New tokens**, each because the handoff draws a value the palette did not
have: `--{module}-soft` for all seven and `--accent-soft`, the lightest step of
a module, for a chosen tile and the start bar; a deep and a soft tone for each
of the five materials and `--reeks-licht`, for the plate a hero stands on;
`--shadow-menu` and `--shadow-held`, the two shadows the handoff allows;
`--radius-plaat` (10) and `--radius-klein` (8). Four more places an accent may
paint are listed in `accent.test.ts`, each with its reason: the plate, the
module you are in in the menu, a test's subject, and the track under a module's
bar on the front door. A card on the front door no longer lights its border in
the module colour on hover; the plate on it already says which module it is.

### Consequences

The sentence under the greeting is the handoff's — choose a subject, do a round,
earn your next hero. The one it replaces, about questions coming back on
purpose, is gone from K1; it was the only place the product said so out loud,
and the Onthouden page is where that argument lives now.

---

## ADR-095 — A module page is chips, tiles and squares, and the start bar stays in reach

**Status:** accepted — 2026-09-10. Part 3 of the September redesign. Keeps
ADR-089's accent on the answer already given and reverses its argument about
height; supersedes ADR-052.

### Context

The handoff redraws the module pages — `/topo`, `/rekenen`, `/klok` — as a badge
that names the module, the question, and numbered steps on a hairline: chips
for a filter, tiles with a plate and a title for a subject or a way of
practising (two columns from 1200), a keypad of squares for the tables, and a
start bar that lists what was chosen. On a phone that bar is stuck to the foot
of the screen, which ADR-052 put off after three attempts produced three bugs.

### Decision

**A word is a chip, a subject is a tile, a number is a square.** Where on the
map, which kind of sum (rekenen's first step), which range, level or cities, and
how many questions are chips. The subjects of topography and klokkijken and
every way of practising are tiles; the oefentoets is the last tile and is still
a switch, not a seventh way (ADR-085). The tables and the divisions are a
keypad with the mix first. The chosen one of each wears the module's colour and
changes something besides the hue — a heavier rule, a darker rule, or a tick.

**The tiles are big again.** ADR-089 made them small to fit two steps on a
tablet screen. The handoff draws them a hand's width across, and that is a tile
a seven-year-old hits first time; a page that scrolls is the price, and the
start bar is what makes the price small.

**The start bar lists the answers.** One chip per question the page asked — the
map, the subject, which one, the way, how long, and "oefentoets" when it is on
— and the Start button at the end of the line. What a screen reader hears from
the button is still the whole sentence (ADR-066).

**On a phone it is built, the way ADR-052 said the next attempt should be.**
Sticky rather than fixed, so its box is where it is drawn and a press lands on
the thing it looks like it lands on. The last thing in the page — after the
child's own column, as a sibling of the content rather than a child of it — so
it is in reach the whole way down and never lies over its own button. Side
margins exactly the page's padding and no more. `e2e/shell.spec.ts` checks all
three at the two phone sizes.

**Six things the handoff draws are not done, each for a reason:**

- the heading keeps the child's name on a phone; asked of nobody it is a form;
- all twelve tables on a phone, where the handoff shows seven — a table a child
  cannot reach there is a table taken away;
- one table at a time; "meerdere mag ook" is a round made of several sets, which
  is new behaviour and waits for its own decision;
- no "Analoog / Digitaal" step for the clock, and "Vijf minuten" rather than
  "Minuten": the handoff's clock is a proposal written before the module was
  built, and this page shows the module that exists;
- the step titles stay "Kies een onderwerp" and "Welke tafel?" where the handoff
  writes "Welke som?" and "Kies je tafels" — they are also each step's landmark
  name, and the words a screen reader and every test find the step by;
- the Start button keeps the triangle that means "begin" rather than an arrow,
  which in this set means "the next question".

**Dropped:** the small progress dot on each table. It was decorative, and how a
table is going is in its label and in the child's own column.

**New token:** `--radius-balk` (14) for the start bar and the squares.

### Consequences

`accent.test.ts` names the new places an accent paints — the chosen chip, tile
and square, the tick, the start bar, the badge and the step number — and loses
the old tile classes. The component gallery shows the chip and the tile.

---

## ADR-096 — Heroes come in chests, and which one is chance

**Status:** accepted — 2026-09-10, on the owner's decision. Part 4 of the
September redesign. **Revises ADR-067's first condition and spec §4.5 in one
place**: which hero is in a chest is chance. Extends ADR-071; keeps ADR-081 and
ADR-084 in a new shape.

> **The draw is reversed by [ADR-097](#adr-097--a-chest-always-gives-a-hero-you-do-not-have-and-the-child-picks-from-three)
> (2026-09-11), after it was worked out what it costs in answers.** Everything
> else here stands: the fifty-answer chest, the twelve heroes, the five reeksen,
> the migration off the ladder, and the rules being written out on the page.

### Context

The handoff replaces the ladder of sixty animals with heroes: ten correct
answers are a star, five stars open a chest that holds a hero, and three
duplicates move a hero up a reeks, bronze to ultra. A duplicate only exists if
the chest draws, so the chest is a chance mechanism — for children of seven to
twelve, in a product whose spec and ADR-067 said there would be none.

That was put to the owner with a deterministic alternative (the next hero in a
fixed order) and the owner chose the draw, knowingly. This records it.

### Decision

**Chance in one place and nowhere else.** Whether there is a chest, and what it
costs, is arithmetic on correct answers — fifty for a chest, in `helden.ts`,
pure and tested. Which of the twelve comes out is a draw from the platform's
cryptographic source in `heldenStore.ts`, every hero equally likely, and
nothing about it can be steered, bought, or hurried by waiting.

**The rules are on the page.** The collection page says in four sentences how
it works, including "alle twaalf zijn even kansrijk". A chance a child cannot
read about is a chance they have no reason to trust.

**Twelve heroes, the twelve drawings there are.** The handoff's "24" would need
twelve more illustrations; the heroes are the animals, on a plate in their
reeks. A duplicate of a hero already at ultra does nothing and says so.

**The level stays.** Same curve, same "nog 6 goede antwoorden" on the progress
card; the stars count in the same answers beside it. The handoff keeps the
stars off the front door, and so does this: they are on the screen after a round
and on the collection page.

**Nobody loses anything.** A child's first read writes their heroes from the
ladder they climbed: every animal they held becomes that hero, in the highest
reeks they held it in. The chests those answers already paid for count as
opened — they were paid out as animals — so the first chest arrives at the next
fifty, not as a pile. A new child comes through the same path with nought
answers, and starts with the three the ladder always started with.

**Stored per child in `settings`**, as JSON under `helden:<kindId>` — the shape
the tests already take (ADR-077) — rather than as a new object store. No schema
version, and a row that will not parse re-runs the migration instead of taking
the front door down.

**The worn hero shows its reeks** on the progress card, in the app bar and on
the collection page, where any hero a child has can be worn — not only the first
row, as the ladder allowed.

### Consequences

`NieuweDieren` is gone and `Beloning` replaces it on all three result screens.
`collection.ts` hands nothing out any more; it stays because it is what the
migration reads. The comments in `rewards.ts` and `rewardStore.ts` that said
"no chance" now say where the chance is.

---

## ADR-097 — A chest always gives a hero you do not have, and the child picks from three

**Status:** accepted — 2026-09-11. **Reverses the draw in ADR-096** and with it
restores spec §4.5 and ADR-067's first condition. Keeps everything else ADR-096
decided: the fifty-answer chest, the twelve heroes, the five reeksen, the
migration off the ladder.

### Context

ADR-096 made which hero a chest holds a draw, knowingly and against spec §4.5.
What was not on the table when that was decided is what the draw costs in
answers, and it is not small.

Twelve heroes, uniform, fifty correct answers a chest: completing the set takes
**37.2 chests in expectation — 1,862 correct answers** — with a standard
deviation of 13.7 chests. The median is 35 chests and the ninetieth percentile
is 55, so two children working equally hard end up four months apart. About
**twenty-five of those thirty-seven chests hold a hero the child already has.**
The last three heroes alone cost 22 chests, which is 59% of the whole set.

Past the set it is worse. Four reeks steps at three duplicates each is thirteen
copies of one hero, so **one named hero at ultra costs 156 chests — 7,800
correct answers, thirty-nine weeks at four sessions of fifty a week.** A child
of eight does not have a thirty-nine week horizon. "I want Vlam in ultra" is the
goal the design invites and the goal it cannot pay.

The worst case is not rare either. Holding eleven of twelve, the chance that ten
consecutive chests are all duplicates is **42%**: five hundred correct answers
and ten openings that hand over nothing. `vol` — a duplicate of a hero already
at ultra — hands over less than nothing, and it gets more frequent the harder a
child has worked.

Three accepted decisions also said the opposite of what the code did. ADR-076:
"bought with correct answers and nothing else". ADR-080: "nothing behind money,
chance or waiting". ADR-081: "nothing in this product is ever earned by chance
or by waiting". ADR-096 revised ADR-067 and spec §4.5 and named none of the
three, so the repository contradicted itself in four places while verifiability
is the whole of what it claims.

### Decision

**A chest lays out three heroes face up, and the child turns one over.**

- While any of the twelve is missing, the three are heroes this child does not
  have, taken in a fixed order that is the same for every child and lives in
  `game-core` as `KIST_VOLGORDE`. **Every chest gives a hero you did not have.**
  Twelve chests, twelve heroes, **six hundred correct answers**, identical for
  every child.
- Once the twelve are held, the three are heroes not yet at ultra, and the child
  picks which one takes the duplicate. That is the only strategic decision in
  the product: spread, or push one hero to ultra.
- **`vol` becomes unreachable.** A hero at ultra is never offered. `KistSoort`
  keeps the case so a row written by an older version still reads, and so there
  is still something to say if one ever turns up.
- **The choice changes when, never whether.** Taking a favourite first shifts
  the rest forward; over twelve chests the child gets all twelve either way.
- **Each card says what pressing it would do**, before it is pressed. Three
  cards that do not say what they are is not a choice, it is three buttons.
  `watKistDoet` answers that without applying anything.

**No randomness anywhere in the product.** `heldenStore.trek()` is deleted and
with it the only call to `crypto.getRandomValues` in the reward path. `openKist`
takes a chosen place rather than a number in [0,1) and stays pure; a place that
was not offered falls back to the first one that was, because this runs behind a
button and a stale press should hand over the obvious thing rather than throw.

**A chest is a debt, not an event.** `kistenTeGoed` is a subtraction of chests
opened from chests paid for, so a chest earned by a round that was closed before
the result screen was read is still owed. It is offered on the result screen and
on the collection page, and both render the same component and read the same row.

### Consequences

At fifty correct answers a chest:

|                            | ADR-096                   | this           |
| -------------------------- | ------------------------- | -------------- |
| all twelve heroes          | 1,862 answers (p90 2,750) | **600, exact** |
| one chosen hero at ultra   | 7,800                     | **1,200**      |
| every hero at ultra        | 11,700                    | **7,800**      |
| chests holding nothing new | ~25 of 37                 | **0**          |

`README.md`, ADR-076, ADR-080 and ADR-081 become true again rather than needing
amendment. Spec §4.5 is no longer revised by anything, and ADR-067's first
condition — "nothing is behind money or chance" — stands as written.

What is given up: the jackpot. A rare pull is a real thrill and it is gone. The
trade is a small chance of a large spike against a large chance of nothing, and
for an audience of eight that is the right way round. Scarcity now means "I
worked for this" rather than "I was lucky", which is honest and less exciting.

`RoundOutcome.kisten` becomes `RoundOutcome.kistenTeGoed`, a count rather than a
list of what came out: nothing comes out until the child picks, and that happens
on the screen the number is handed to rather than before it is drawn.
`applyRoundRewards` no longer opens anything.

`reis.regel2` and `reis.regel3` are rewritten. The page can now say that a chest
always gives a hero you do not have, which is a better sentence than "alle twaalf
zijn even kansrijk" in every way that matters — and `reis.regel4` can say there
is no luck in it at all.

---

## ADR-098 — Twelve heroes, none of which belongs to a module, and the animals are replaced

**Status:** accepted — 2026-09-11, **in the form the design chose rather than
the one first proposed**. Completes ADR-096, which named twelve heroes and
shipped twelve animals. Retires the drawings ADR-059 and ADR-067 introduced.

### What was built

The design canvas "Jouw voortgang" (`docs/Jouw voortgang.dc.html`) answered the
question below differently from the proposal that follows it, and the design is
what shipped. The twelve are **animals with a name and an outfit**, not abstract
shapes:

| Place | Hero         | Was      |
| ----- | ------------ | -------- |
| 0     | Valerie Vos  | cat      |
| 1     | Daan Das     | owl      |
| 2     | Olaf Otter   | fox      |
| 3     | Harm Havik   | bear     |
| 4     | Willem Wolf  | hare     |
| 5     | Esmee Egel   | fish     |
| 6     | Bart Bever   | hedgehog |
| 7     | Udo Uil      | frog     |
| 8     | Minou Marter | squirrel |
| 9     | Fem Flamingo | penguin  |
| 10    | Richard Ree  | elephant |
| 11    | Ben Buizerd  | dragon   |

- **One construction kit, twelve characters.** Every hero is the same bust —
  body, ears, head, snout, two eyes, glasses and one accessory — and they differ
  in ears and in what they wear. They read as one cast, and a thirteenth could
  join without a new style.
- **A first name on the animal's letter.** Easy to read aloud in groep 4, and a
  name makes a character of a species.
- **The reeks is a layer, and a count.** The fur stays ink; the outfit and the
  inside of the ears take the material; the plate takes the material's soft
  tone. Round the plate is one closed ring per reeks climbed — none for bronze,
  four for ultra — so which of two heroes stands higher is readable without the
  names of the materials (ADR-080). Gold, platinum and ultra have a still sheen.
  The four ring slots are always reserved, so a plate is the same size in every
  reeks and a card does not jump when its hero climbs.
- **Illustrations, served as images.** Sixty WebPs in `public/helden/`, twelve
  heroes by five reeksen, 320 square (two pixels to one at 160). They are not on
  §E's frame and `icons.test.ts` no longer holds them to it. Below 64 pixels the
  rings are thinner than two and cannot be counted, so `Heldplaat` draws the
  plate alone and its tone carries the reeks.
- **A hero not found is a chest**, not a silhouette: the surface with a band
  across it both ways, "Nog niet gevonden" and "Kist: vijf sterren". The name
  stays secret (ADR-081), and the three cards a chest lays out are where it is
  first seen.
- **Places are kept, ids are not.** `Held.plek` is unchanged, so `uitLadder` and
  every stored row stand as they are. The profile's `sticker` becomes a first
  name (`valerie`), which cannot be mistaken for an id an older version wrote
  (`vos` was the animal in place 2); `stickerById` resolves an old id to the
  hero in its place.
- **The proposal's rhymes are not kept.** Place 0 is Valerie Vos because the
  design draws a new child with the fox, the badger and the otter, wearing the
  fox. So a child who wore the owl now wears Daan Das, not Udo Uil. The reeks
  and the duplicates of that place carry over; the picture does not.

The rest of this record is the proposal as it was written, kept because its
constraints — no hero belongs to a module, the animals are replaced rather than
kept alongside, there is no last hero — are the ones the design kept.

### Context

ADR-096 replaced the ladder of sixty animals with heroes and then used the
twelve animal drawings as the heroes, on the argument that "the handoff's 24
would need twelve more illustrations". So the product calls a hedgehog a hero.
There is no name, no power and no drawing for any of the twelve.

Two constraints shape what they can be. **The frame:** §E is a 24 grid, one
stroke weight, circles and straight lines, no colour of its own. The animals
work at that size because ears tell them apart; a hero in a cape and a mask is a
smudge. **The modules:** topografie, rekenen and klokkijken share one collection
(ADR-062, ADR-063) and four more modules stand in the rail. A hero that belongs
to arithmetic breaks that, and breaks it again for every module not yet built.

### Decision

**Twelve heroes, each one unmistakable shape rather than a costume**, and each
power a way of being rather than a school subject.

| #   | Name  | Power                                                            | Silhouette                                                   |
| --- | ----- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Reus  | lifts what nobody can lift                                       | shoulders wider than the frame, small head at the top edge   |
| 2   | Pluis | small and light enough to pass anywhere and land from any height | a small soft circle with two dots, alone in empty space      |
| 3   | Flits | there and back before you looked up                              | a zigzag body with a small round head                        |
| 4   | Schim | goes where the light does not                                    | an outline of head and shoulders, empty inside, ragged below |
| 5   | Steen | nothing gets past him                                            | a wide rounded block, two dots high, flat on the ground      |
| 6   | Golf  | goes round anything and cannot be held                           | a wave crest with an eye in the hollow                       |
| 7   | Vonk  | makes light where there is none                                  | a round head with eight short rays                           |
| 8   | IJs   | holds everything still for a moment so you can look              | a six-pointed crystal with an eye at its centre              |
| 9   | Klim  | grows a ladder or a bridge where there is none                   | a spiral with a small head at its tip                        |
| 10  | Bout  | repairs anything, himself included                               | a rounded block head, one large eye, a nut on top            |
| 11  | Echo  | says back what was said long ago                                 | a head between two open arcs                                 |
| 12  | Vlam  | burns through what is in the way                                 | a jaw, one horn, one eye — the dragon already drawn          |

**Six pairs of opposites**: large/small, fast/silent, hard/soft, light/cold,
grows/builds, remembers/burns. A child seeing Reus beside Pluis reads the system
without a legend, which is the rule ADR-080 applies to the reeksen.

**All twelve are ordinary Dutch words**, eleven of one syllable, every one at or
below AVI-M6, and each means what the drawing does — so the name and the picture
teach each other.

**Nine of the twelve are not male-human**: five female, two unspecified, four
non-human, two of those male-coded. Only Reus is a man. That falls out of the
frame rather than being imposed on it: at 24 pixels a shape reads better than a
person.

**Twelve roles, no two alike**: tank, bruiser, speedster, stealth, evader,
illuminator, controller, builder, repairer, memory, damage, and mobility by
being small.

**The animals are replaced, not kept alongside.** Two collections would be two
ladders in the same narrow column, which is what ADR-058 took off the front door
and what ADR-071's own consequences warn about. The mapping keeps the slot, so
`uitLadder` is unchanged, and it rhymes where a rhyme exists: cat→Schim,
owl→Echo, fox→Flits, bear→Steen, hare→Pluis, fish→Golf, hedgehog→Bout,
frog→Klim, squirrel→Vonk, penguin→IJs, elephant→Reus, dragon→Vlam. Six rhyme
strongly and the dragon stays the dragon.

**There is no last hero any more.** ADR-067 made the dragon twelfth because "the
last rung should look like the last rung". Under ADR-097 all twelve arrive within
twelve chests, so that job is gone. The ladder is the reeksen now, and its last
rung is ultra.

### Consequences

`Stickers.tsx` is gone; `stickerSet.ts` keeps its shape — a list of twelve in
their places, and nothing about earning them — with the animal each hero is
drawn as and the id its place had before. Twelve keys in `nl.ts`.
`KIST_VOLGORDE` is about offering rather than drawing and is unaffected.

A child who wore an animal loses that drawing. The slot, the reeks and the
duplicates survive the change; the picture does not. The proposal had the
product say so once on first open; that line is not built.

The sixty images arrived as PNGs of about four megabytes and are served as lossy
WebP at quality 88: about half a megabyte for all sixty, from four kilobytes
for a bronze plate to thirteen for an ultra one, whose sheen costs the most, and
indistinguishable at the sizes they are drawn — the sheen
on gold, platinum and ultra is where the loss would show first, and at three
times enlarged it is a slightly softer ring edge. Quality 80 saved another
hundred kilobytes and visibly blurred the rings. The PNGs are the source and
stay outside the repository in `docs/helden/`; the conversion is Pillow's
`save('WEBP', quality=88, method=6)`. Only the images on screen are fetched,
and lazily.

---

## ADR-099 — The star is visible where the work is done, and the column counts to the chest

**Status:** accepted — 2026-09-11. Amends ADR-096 and ADR-070. Does not remove
the level; re-aims what the column counts towards.

> **Amended the same day by the design canvas "Jouw voortgang".** The level's
> bar and sentence stay, as one thin bar and one line **under** the chest, and
> the bar measures the level again rather than the chest. The chest gets the
> five stars and the large sentence — "Nog 24 goede antwoorden tot je volgende
> kist.", or before the first star "Nog 10 goede antwoorden tot je eerste ster."
> — so the two are ranked by weight rather than one removed. "5 van de 12
> helden" leaves the block for the top of the heroes on /voortgang: it counts
> what a child has and says nothing about the next round. Below 1200 the stars
> stand in the row beside "Niveau 3". /voortgang opens on the same order: the
> hero worn at full size, the stars, the chest sentence, the level, and "Verder
> oefenen met …" back to the subject last practised. The bullets below record
> the decision as it was first taken.

### Context

Since ADR-096 a level hands nothing out. `collection.ts` says so in its own
header: "Since ADR-096 this ladder hands nothing out." The right-hand column,
which stands on every screen inside the shell, still counted down to it: "Nog 6
goede antwoorden tot niveau 7." That sentence is ADR-070's whole reason for
existing — "a level is a promise about work" — and the promise had stopped being
paid.

Meanwhile the event that does hand something over, the chest at every fifty
correct answers, was on no persistent surface at all. ADR-096 kept the stars off
the front door on purpose: "they are on the screen after a round and on the
collection page."

So the one progress object a child saw all day counted towards nothing, and the
one that counted was invisible between rounds. That is the shape of the problem
the September redesign set out to solve, rebuilt inside the solution.

Two ladders in the same unit on the same card is also the pattern this product
keeps rejecting: ADR-058 took the forecast off the front door because beside a
mark it read as "a second opinion about the same thing", and ADR-071's
consequences call a second copy of one rule "how two of them come to disagree".

### Decision

**One new element in the column, and one thing gives way.**

- **In:** the five-star row, as many filled as the next chest has. It is the
  component the result screen already had, moved to `components/Sterren.tsx`
  because three features now import it — no new drawing and no new colour.
- **Out:** the level progress bar and "Nog {n} goede antwoorden tot niveau
  {n+1}". The bar measures `kistProgress` now, and the sentence is
  `reis.totKist`, which already existed and already read "Nog {aantal} goede
  antwoorden tot je volgende kist."
- **Unchanged:** the hero plate, the reeks name, "x van de 12", the way to the
  collection. The level number stays beside the reeks name as a lifetime figure
  and counts towards nothing, because that is what it now is.

**A star is counted during the round.** `SterTeller` stands in the round bar of
all three round screens, in every mode including the endless ones, and shows how
many of the current star's ten are in. It reads the total once when the round
opens and adds the round's own correct answers to it; reading it again mid-round
would count them twice, because they are written as they are given.

**It counts; it does not move.** Counting is what the rest of that bar does, and
a third animation in a product that has two on purpose would need an argument
this does not have (ADR-084).

**On the result screen nothing changes.** The row was already there.

### Consequences

A child now sees something move on every correct answer, on every screen,
between rewards. That is the gap the old ladder left: from level five onwards a
rung cost two hundred correct answers, which at four sessions of fifty a week is
one animal a week with six days of nothing in between.

ADR-070's level survives as a measure and stops being a promise. Whether it
should survive at all is a separate question and deserves its own ADR; settling
it inside a change about stars would be settling it by accident.

One thing this leaves broken, and it should be recorded rather than quietly
carried: **ADR-084 allows the unwrap animation because it is rare** — "this card
appears a handful of times a month". At fifty correct answers a chest it appears
roughly every round or two. Either the animation gets quieter or ADR-084's
justification is rewritten. Both cannot stand.

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
