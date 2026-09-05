# Data model — Leernu

Status: draft, phase 0. Last updated 2026-09-05.

Revised after ADR-014 and ADR-015. The document has two parts:

- **Part A — what v1 actually stores**, in IndexedDB on the device. This is what
  gets built now.
- **Part B — the deferred school model**, kept in full because it is the target
  shape that part A must be able to grow into without a rewrite.

The rule that binds them: **part A uses the same row shapes as part B.** Adding
accounts later is an upload of existing rows, not a transformation. Where a
column exists in B but has no meaning yet in A, it is simply absent — never
renamed or restructured.

---

# Part A — the local store (v1)

Everything lives in IndexedDB. Nothing is transmitted. There is no server, so
there is no personal data outside the browser and nothing to secure beyond the
device itself.

```ts
// object store: profile  (exactly one record)
{
  id: string;               // generated locally, becomes student_id on upload
  naam: string;             // what the player typed; never leaves the device
  avatarConfig: object;
  niveau: 1 | 2 | 3;
  xp: number;
  munten: number;
  aangemaaktOp: string;     // ISO
}

// object store: itemStates    keyed by itemId — same shape as part B §4
{ itemId, box, laatsteReview, volgendeReview, goedCount, foutCount }

// object store: sessions      same shape as part B §4, minus organisationId
{ id, mode, itemSet, score, gestart, geeindigd }

// object store: attempts      append-only, autoIncrement key
//   indexed by sessionId (what happened in one round) and itemId (one item over time)
{ id, sessionId, itemId, mode, correct, responseMs, gekozenAntwoord, tijdstip }

// object store: streak        exactly one record, key 'me'
{ id, huidigeStreak, langsteStreak, laatsteActieveDag, vriezers }

// object store: badges        { badgeId, behaaldOp }
// object store: stamps        { regioSet, behaaldOp }
// object store: settings      { key, value } — device preferences, not player data
```

Field names are camelCase here and snake_case in Postgres. That single renaming is
the only translation between part A and part B, and it belongs in one mapping
function written on the day accounts arrive — not spread through the code now, in
anticipation of a shape nobody has needed yet.

Three notes on what is deliberately different from part B:

- **`sessions.item_set` still holds the answer key**, even though nothing
  validates it in v1. It is kept because the moment leaderboards arrive, the
  server needs exactly this column to re-score against (ADR-003), and a store
  that never had it would have to be redesigned.
- **No `organisation_id` anywhere.** In part B that column exists on every table
  to keep RLS policies simple; here there is no tenant and no RLS.
- **`attempts` grows without bound.** A child practising daily for a year
  produces a few thousand rows, which IndexedDB handles without complaint. If it
  ever matters, the fix is to summarise rows older than a school year into
  `item_states` — but not before it is a measured problem.

The content tables (`items`, `learning_goals`) are not stored in IndexedDB at
all. They ship as static JSON with the app and are read directly.

---

# Part B — the deferred school model

Everything below is the target state for when accounts, classes and licensing
return (ADR-014). None of it is built now. Migrations will live in
`supabase/migrations/`, numbered and never edited after they have run anywhere.

Two rules run through it:

1. **Every table carries `organisation_id`**, even where it is derivable through
   a join. RLS policies get simpler, faster and — the part that matters — much
   harder to get subtly wrong. A join-based policy that is one `LEFT JOIN` away
   from leaking is not a policy anyone can review.
2. **Pupil rows hold as little as the product can function on.** Spec §6 is not
   a checklist to satisfy at the end; every column below had to argue for its
   existence. There is no free-text column anywhere a pupil can type.

## 1. Organisations and licences

```sql
create type org_type as enum ('school', 'bestuur');

create table organisations (
  id                uuid primary key default gen_random_uuid(),
  parent_id         uuid references organisations(id),   -- bestuur → school
  type              org_type not null,
  naam              text not null,
  brin              text,                                -- school only, 6 chars
  adres             jsonb,
  factuurgegevens   jsonb,                               -- billing contact, PO ref
  vakantieregio     text,                                -- noord | midden | zuid
  created_at        timestamptz not null default now()
);
```

The `parent_id` self-reference is the whole reason the bestuur layer is cheap
later (spec §7). The UI can stay school-only for a year; the model does not have
to change when the first bestuur deal lands. A school under a bestuur inherits
its subscription by walking one level up — never more, and that is enforced by a
check, not by convention.

`vakantieregio` sits on the organisation rather than the class because Dutch
school holidays are regional. A class may override it (see `classes`).

```sql
create type subscription_status as enum
  ('trial', 'quoted', 'active', 'renewal_window', 'expired', 'cancelled');

create table subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisations(id),
  status            subscription_status not null default 'trial',
  seats             integer not null check (seats >= 0),
  prijs_per_seat    numeric(6,2) not null,
  valuta            text not null default 'EUR',
  start_datum       date not null,
  eind_datum        date not null,
  verlengt_op       date,
  betaalmethode     text,                    -- invoice | ideal | sepa
  trial_klassen_max integer default 2,
  data_bewaren_tot  date,                    -- set on expiry, see §7
  created_at        timestamptz not null default now()
);
```

The status is an explicit enum rather than a pair of dates, because the spec's
lifecycle (§7) has states that dates cannot express: `quoted` is not `trial`, and
`renewal_window` is not `active` even though both are usable. State transitions
happen in one Edge Function so the audit trail has a single author.

`seats` is the number bought. Seats used is `count(students)` across the
organisation's non-archived classes — derived, never stored, because a stored
counter and a real count will disagree on a Tuesday and the sales conversation
will be about our bug instead of their renewal.

## 2. People

```sql
create type user_role as enum ('teacher', 'admin');

create table users (
  id                uuid primary key references auth.users(id),
  organisation_id   uuid not null references organisations(id),
  rol               user_role not null,
  email             citext not null unique,
  naam              text not null,
  twofa_enabled     boolean not null default false,
  laatste_login     timestamptz,
  created_at        timestamptz not null default now()
);
```

Teachers and admins are real Supabase Auth users; `wachtwoord_hash` and
`2fa_secret` from the spec live in `auth.users` and are deliberately not
duplicated here. 2FA is required for `admin` and optional for `teacher`,
enforced in the Edge Function that grants admin scope.

```sql
create table classes (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisations(id),
  naam              text not null,
  leerjaar          text not null,               -- groep6 | groep7 | groep8 | vo1
  klascode          text not null unique,        -- 6 chars, no 0/O/1/I/l
  ranglijst_actief  boolean not null default true,
  vakantieperiodes  jsonb,                       -- overrides organisation region
  gearchiveerd_op   timestamptz,
  created_at        timestamptz not null default now()
);

create table class_teachers (
  class_id  uuid not null references classes(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  primary key (class_id, user_id)
);
```

`klascode` excludes visually ambiguous characters. A class code is read aloud to
28 children and typed by them; `0` versus `O` costs a teacher five minutes of
her lesson, every time.

`ranglijst_actief` is a column, not a setting buried in a JSON blob, because
spec §4.4 makes it a dealbreaker feature — some schools will not buy with
leaderboards on, and "is competition off for this class" must be answerable in
one query when a parent complains.

```sql
create table students (
  id                    uuid primary key default gen_random_uuid(),
  class_id              uuid not null references classes(id) on delete cascade,
  organisation_id       uuid not null references organisations(id),
  voornaam              text not null,
  achternaam_initiaal   text check (char_length(achternaam_initiaal) <= 2),
  pincode_hash          text,                    -- argon2id, null until first login
  pincode_gezet_op      timestamptz,
  avatar_config         jsonb not null default '{}',
  niveau                smallint not null default 1 check (niveau between 1 and 3),
  gearchiveerd_op       timestamptz,
  created_at            timestamptz not null default now()
);
```

That is the complete pupil record. No e-mail, no date of birth, no address, no
photo, no free text. `niveau` is the differentiation handle from spec §5.3.
`pincode_hash` is null until the pupil sets a PIN on first login; a null PIN
means "any PIN sets it", which is why a class code alone must never be enough to
reach a pupil slot from outside the school — the rate limiter and the class-code
entropy carry that weight.

`avatar_config` is a JSON blob and is the one place a pupil influences stored
content. It is validated against a whitelist of known cosmetic ids on write, so
it cannot become a free-text field by accident.

## 3. Content

Content is versioned files in `content/`, but the database needs a queryable
mirror for joins, reporting and item analysis. The mirror is rebuilt from the
files by a migration-time seed, never edited by hand.

```sql
create table items (
  id              text primary key,             -- 'nl-prov-gelderland'
  type            text not null,                -- provincie | stad | water | ...
  naam            text not null,
  aliassen        text[] not null default '{}',
  regio_set       text not null,                -- nederland | europa | wereld
  geometrie_ref   text,
  punt            geography(point, 4326),
  niveau          smallint not null check (niveau between 1 and 3),
  weetje          text,
  relaties        jsonb not null default '{}',
  content_versie  text not null
);

create table learning_goals (
  id            text primary key,               -- 'ak-nl-provincies'
  code          text not null,
  omschrijving  text not null,
  leerjaar      text not null,
  kerndoel_refs jsonb not null default '[]'     -- see note below
);

create table item_learning_goals (
  item_id           text not null references items(id) on delete cascade,
  learning_goal_id  text not null references learning_goals(id) on delete cascade,
  primary key (item_id, learning_goal_id)
);
```

`kerndoel_refs` is a JSON array of `{stelsel, code, versie, bron_url, geraadpleegd_op}`
rather than a single foreign key. Two reasons, and the second one is the real
one: the kerndoelen were revised and the first sets entered law in August 2026,
and geography does not sit in one learning area — it spans *mens en natuur* and
*mens en maatschappij*. A one-to-one `kerndoel_ref` column would have been wrong
within a month of writing it. Swapping in a new set of references is a data
change; see `docs/CURRICULUM.md` (phase 1) for the sources and their retrieval
dates.

Items are joined to goals through a table rather than the spec's `leerdoel_ids`
array, because the teacher heatmap (§5.2) is a group-by over exactly this join
and an array would make the most important report in the product the slowest.

## 4. Learning state

```sql
create table item_states (
  student_id      uuid not null references students(id) on delete cascade,
  item_id         text not null references items(id) on delete cascade,
  organisation_id uuid not null,
  leitner_box     smallint not null default 1 check (leitner_box between 1 and 5),
  laatste_review  timestamptz,
  volgende_review timestamptz,
  goed_count      integer not null default 0,
  fout_count      integer not null default 0,
  primary key (student_id, item_id)
);
create index on item_states (student_id, volgende_review);
```

Intervals per box: 1, 2, 4, 8, 21 days (spec §4.2). The index is the query that
runs at the start of every single round; it is the one performance decision that
is cheaper to make now than to discover later.

```sql
create table sessions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  organisation_id uuid not null,
  mode            text not null,
  item_set        jsonb not null,        -- server-authored questions + answer key
  score           integer,
  gestart         timestamptz not null default now(),
  geeindigd       timestamptz,
  gevalideerd     boolean not null default false,
  assignment_id   uuid references assignments(id)
);

create table attempts (
  id              bigserial primary key,
  session_id      uuid not null references sessions(id) on delete cascade,
  student_id      uuid not null references students(id) on delete cascade,
  organisation_id uuid not null,
  item_id         text not null references items(id),
  mode            text not null,
  correct         boolean not null,
  response_ms     integer not null,
  gekozen_antwoord text,                 -- the wrong item id, or normalised text
  tijdstip        timestamptz not null default now()
);
create index on attempts (organisation_id, item_id, correct);
```

`sessions.item_set` holds the answer key server-side. That column is what makes
score validation possible at all, and it is why pupils have no `select` on it —
RLS returns sessions to a pupil through a view that omits `item_set`.

`attempts.gekozen_antwoord` is the column the spec calls gold, and it is: the
item analysis ("many pupils confuse Assen and Zwolle") is a group-by on it. It
stores an item id where the mode offers choices, and a *normalised* string where
the pupil typed — normalised, so that it is bounded content and not a free-text
field wearing a disguise.

`attempts` is append-only and never updated. It is also the table that will
dominate storage: 30 pupils × 20 answers × 180 school days is roughly 100 000
rows per class per year, which is nothing for Postgres but does mean the
retention job in §7 has real work to do.

## 5. Motivation

```sql
create table streaks (
  student_id        uuid primary key references students(id) on delete cascade,
  organisation_id   uuid not null,
  huidige_streak    integer not null default 0,
  langste_streak    integer not null default 0,
  laatste_actieve_dag date,
  vriezers          smallint not null default 0 check (vriezers between 0 and 2)
);

create table league_entries (
  student_id      uuid not null references students(id) on delete cascade,
  week            date not null,              -- Monday of the ISO week
  organisation_id uuid not null,
  divisie         text not null,
  punten          integer not null default 0,
  groei_punten    integer not null default 0,
  positie         integer,
  primary key (student_id, week)
);
```

`groei_punten` is stored separately from `punten` because spec §4.4 makes growth
the ranking key, not absolute score, and the two must be inspectable apart when
a teacher asks why a pupil is third. A ladder nobody can explain is a ladder
nobody trusts.

Holiday pauses are computed from `classes.vakantieperiodes` (falling back to the
organisation's region) at streak-evaluation time rather than stored per pupil.
Storing it per pupil means a corrected holiday date leaves 28 wrong streaks
behind.

```sql
create table badges (
  id           text primary key,
  naam         text not null,
  omschrijving text not null,
  criterium    jsonb not null
);

create table student_badges (
  student_id  uuid not null references students(id) on delete cascade,
  badge_id    text not null references badges(id),
  behaald_op  timestamptz not null default now(),
  primary key (student_id, badge_id)
);
```

## 6. Teaching and duels

```sql
create table assignments (
  id                uuid primary key default gen_random_uuid(),
  class_id          uuid not null references classes(id) on delete cascade,
  organisation_id   uuid not null,
  item_set          jsonb not null,        -- item ids or a goal-based selector
  mode              text not null,
  deadline          timestamptz,
  min_rondes        integer,
  doel_beheersing   smallint check (doel_beheersing between 0 and 100),
  aangemaakt_door   uuid not null references users(id),
  created_at        timestamptz not null default now()
);

create table assignment_progress (
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  status        text not null default 'niet_begonnen',
  rondes        integer not null default 0,
  beheersing    smallint,
  primary key (assignment_id, student_id)
);

create table duels (
  id              uuid primary key default gen_random_uuid(),
  uitdager_id     uuid not null references students(id) on delete cascade,
  tegenstander_id uuid not null references students(id) on delete cascade,
  organisation_id uuid not null,
  vragen          jsonb not null,          -- identical, server-authored, ordered
  status          text not null default 'open',
  verloopt_op     timestamptz not null,
  winnaar_id      uuid references students(id),
  check (uitdager_id <> tegenstander_id)
);
```

`duels.vragen` is authored once by the server so both pupils genuinely get the
same ten questions in the same order (spec §4.1). Expiry at 48 hours is enforced
by a scheduled job, not by a filter in a query — an expired duel that still
shows up because someone forgot a `where` clause is the kind of bug children
report loudly.

## 7. Audit and retention

```sql
create table audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  actor_type  text not null,             -- teacher | admin | student | system
  organisation_id uuid,
  actie       text not null,
  doel_type   text,
  doel_id     text,
  ip_hash     text,                      -- HMAC of IP with a rotating key
  tijdstip    timestamptz not null default now()
);
```

`ip_hash` is an HMAC with a server-side key, not a plain hash: an IPv4 space is
small enough to brute-force a plain SHA-256 back to the address in seconds, so a
plain hash would store personal data while pretending not to.

Retention (spec §6) hangs on **class archival**, not on licence expiry. Those
two can disagree — a class archived in July under a licence that runs to
December — and hanging deletion on the licence would keep data alive that nobody
expects to exist. `subscriptions.data_bewaren_tot` still exists for the
end-of-licence case, and the job deletes on whichever comes first.

The deletion job produces a report *before* it runs and mails it to the school
admin. Silent deletion of a year of pupil work, even correct deletion, is the
kind of correctness that ends a contract.

## 8. RLS, in one table

Every table has RLS enabled and no permissive default. Read this as the summary;
the policies themselves are in the migrations, and each has a negative test.

| Table | Pupil | Teacher | Admin |
|---|---|---|---|
| `students` | own row; classmates' first names only, through a view | own classes | own organisation |
| `item_states` | own rows | own classes | own organisation |
| `attempts` | own rows, select only | own classes | own organisation |
| `sessions` | own rows via view without `item_set` | own classes, aggregated | own organisation |
| `league_entries` | own class, and own division across classes | own classes | own organisation |
| `duels` | duels they are in | own classes | own organisation |
| `assignments` | own class, read only | own classes, write | own organisation |
| `classes` | own class, name only | own classes | own organisation |
| `subscriptions` | none | none | own organisation |
| `audit_log` | none | none | own organisation, read only |
| `items`, `learning_goals`, `badges` | read all | read all | read all |

The cross-class case is the one to watch: divisions (§4.4) put a pupil in a
group with pupils from other schools. The policy exposes only
`(voornaam, avatar_config, punten, positie)` through a dedicated view, never the
`students` table itself. Class name, school name and last-name initial stay
inside the school.

## 9. What is deliberately not here

- No `students.email`, `geboortedatum`, `adres`, `foto`, or any free-text field.
- No stored `seats_used` counter (derived, §1).
- No stored mastery percentage — it is computed from `item_states` at read time.
  A stored figure drifts, and the teacher report is exactly where drift is
  least forgivable.
- No `parent` or `guardian` table in v1. The free consumer tier in spec §7 would
  need one, and it brings a different legal regime with it (ADR-008).
