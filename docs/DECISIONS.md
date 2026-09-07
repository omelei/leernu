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
ADR-024 through ADR-031. Where the app design and the business plan disagree,
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
