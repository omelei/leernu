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

**Status:** accepted — 2026-09-07. Supersedes ADR-015 in part. Not yet built.

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
