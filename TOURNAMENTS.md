# Tournament data model

This document describes the tournament data model and the currently
implemented administration workflow. Competition groups are reusable
definitions owned by a club. Groups can represent singles or doubles
competitions.

Administrators can currently manage tournaments, competition groups, and
participant registrations. Authenticated club members can view published
tournaments at `/tournaments`, register themselves for open singles groups or
select an active club member as their doubles partner, and withdraw before the
deadline. Partner confirmation and automatic profile-based eligibility checks
remain future work.

## Collections

The feature uses four MongoDB collections:

- `competition_groups`
- `tournaments`
- `tournament_groups`
- `tournament_registrations`

Future member eligibility checks will use optional fields on existing `users`
documents. Those fields are not implemented yet.

## Competition groups

A competition group is a reusable template defining eligibility rules such as "Herren
Einzel", "Damen Einzel", "U18", or "Herren 50". A group belongs to a club but
is not tied to a particular tournament.

```ts
type CompetitionSex = 'male' | 'female' | 'mixed';
type CompetitionType = {
  id: 'single' | 'double';
  name: 'Einzel' | 'Doppel';
};

type CompetitionGroup = {
  _id?: ObjectId;
  club_id: string;

  name: string;
  competition_type: CompetitionType;
  sex?: CompetitionSex;
  min_age?: number;
  max_age?: number;
};
```

`competition_type.id` is the stable value used by application logic, while
`competition_type.name` is its German UI label. A `single` group accepts one
player per registration and a `double` group accepts a two-player team.

Omitting `sex` makes the group open to members of any sex. `mixed` is intended
for a doubles group whose two partners must satisfy the future mixed-team
eligibility rules. Omitting `min_age` or `max_age` means that the corresponding
age boundary does not apply.

Group templates can be selected by an administrator when creating or editing
a tournament. Each selection is copied into `tournament_groups`. Later changes
or deletion of the template do not affect existing or completed tournaments.

### Default group definitions

Because common competition groups are largely the same across clubs, the
repository contains the default definitions in
`scripts/data/competition-groups.json`. A seed script reads this file and
inserts the definitions into the
`competition_groups` collection for a club. This reduces initial setup work
while still allowing administrators to create additional groups that are not
included in the defaults.

The JSON file is seed input only. It is not a separate runtime data source and
does not change the data model. Once inserted, a default group is a normal
`CompetitionGroup` document with a MongoDB `ObjectId` and a `club_id`, just
like a group created by an administrator.

When a new club is created, the standard definitions are inserted
automatically for that club. This applies both to public club registration and
to club creation by an existing account.

The JSON file is the authoritative list of seed definitions and currently
contains nine groups, including men's and women's singles, U18 and 50+
singles, and men's, women's, and mixed doubles.

For clubs created before this behavior was introduced, run the idempotent seed
command with:

```sh
npm run seed:competition-groups
```

The seed script:

- seeds all existing clubs;
- adds the target club's `club_id` to inserted documents;
- lets MongoDB generate each group's `_id`;
- skips a definition when a group with the same name already exists in that
  club; and
- is idempotent, so running it repeatedly does not create duplicates.

The inserted definitions are templates used while configuring a tournament.
The application does not resolve tournament groups directly from the JSON file
at runtime.

## Tournament groups

Each selected template is copied into a tournament-specific snapshot:

```ts
type TournamentGroup = {
  _id?: ObjectId;
  tournament_id: ObjectId;
  source_group_id: ObjectId;
  name: string;
  competition_type: CompetitionType;
  sex?: CompetitionSex;
  min_age?: number;
  max_age?: number;
};
```

`source_group_id` identifies the reusable template that was selected. The
copied values are authoritative for that tournament and remain unchanged when
the source template is edited. A template may be copied into a tournament only
once.

## Tournaments

```ts
type TournamentStatus = 'draft' | 'published';

type TournamentPaymentMethod = 'cash' | 'bank_transfer';

type Tournament = {
  _id?: ObjectId;
  club_id: string;

  name: string;
  description?: string;
  format?: string;
  start_date: string;
  end_date: string;
  registration_deadline: Date;
  draw?: Date;
  entry_fee?: number;
  payment_method?: TournamentPaymentMethod;
  status: TournamentStatus;

  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
};
```

`start_date` and `end_date` are local calendar dates in `YYYY-MM-DD` format.
`registration_deadline`, `draw`, `created_at`, and `updated_at` are MongoDB
dates. `draw` is optional and records when the tournament draw takes place. It
is displayed to administrators and members as "Auslosung". When no date has
been entered, the UI displays "Noch nicht festgelegt".

`entry_fee` is an optional non-negative integer amount in euros. It is shown
as "Startgeld". A value of `0` is displayed as "Kostenlos"; an omitted value is
displayed as "Noch nicht festgelegt".

`payment_method` is optional and limited to predefined values. `cash` is shown
as "Barzahlung" and `bank_transfer` as "Überweisung". An omitted value is shown
as "Noch nicht festgelegt".

`format` is optional free text describing how matches are organized, for
example knockout, round-robin, group stage, or a combination of formats. It is
entered by an administrator and displayed to members as "Spielmodus".

Tournament deletion is soft: deleting a tournament sets `deleted_at` and
removes it from normal API results. Its tournament-specific groups and
registrations remain stored so the historical data is preserved.

Tournament groups are linked through `tournament_id`. The API includes them as
a derived `groups` array in each serialized tournament response; the array is
not stored on the tournament document.

Tournament participant limits are intentionally not part of the current
model. Registrations are unlimited within each competition.

### Tournament API fields

The tournament API adds the following derived fields to serialized tournament
responses. They are not stored on tournament documents:

```ts
type TournamentApiFields = {
  groups: TournamentGroup[];
  registrants_count: number;
  group_registrants_count: Record<string, number>;
  current_user_registrations: Record<string, TournamentRegistration>;
};
```

`groups` contains the tournament-specific competition snapshots.
`registrants_count` is the total number of individual players across all
registrations. `group_registrants_count` contains the number of registrations
in each competition group, so one singles registration and one doubles team
each count as one.
`current_user_registrations` lets the player page show the correct Anmelden or
Abmelden action on its first render without loading every participant list.

## Tournament registrations

Each registration represents one member joining one competition group in one
tournament.

```ts
type TournamentRegistration = {
  _id?: ObjectId;
  tournament_id: ObjectId;
  group_id: ObjectId;
  user_ids: string[];
  registered_at: Date;
};
```

`user_ids` contains exactly one member for a singles registration and exactly
two distinct members for a doubles registration.

`tournament_id` is stored directly even though the selected group is listed
on the tournament. This makes it straightforward to load or delete all
registrations for a tournament.

`club_id` is deliberately not stored on a registration. It is obtained from
the referenced tournament, avoiding duplicated club ownership data.

The registration API verifies that:

1. The authenticated user is an active member of the tournament's club.
2. The competition group belongs to that same club.
3. The tournament-specific group belongs to the selected tournament.
4. Every selected player is an active member of the club.
5. Singles have one player and doubles have two distinct players.
6. Neither player is already registered in the same tournament group.

The admin may add and remove registrations as an override. Members may add
themselves to singles competitions or create a doubles registration containing
their own user ID and one active member of the same club. The selected partner
is registered immediately; confirmation is not required in the current
version. Members may add or remove registrations containing their own user ID
while the tournament status is `published` and the Meldeschluss has not passed.
Upcoming, running, and past states are derived from the tournament dates rather
than stored as statuses. The optional member profile fields are implemented;
automatic age and sex eligibility enforcement is still pending.

## Member profile fields

The member profile includes two optional properties:

```ts
type MemberSex = 'male' | 'female';

type TournamentProfileFields = {
  birth_year?: number;
  sex?: MemberSex;
};
```

Both remain optional so members can continue using court booking
without providing them. A member must provide the relevant field before
joining a group with a corresponding eligibility restriction.

Age is based on the tournament's start year, not the member's birthday:

```ts
const tournamentYear = Number(tournament.start_date.slice(0, 4));
const competitionAge = tournamentYear - member.birth_year;
```

For a tournament starting in 2026, U18 therefore accepts birth years from
2008 onward, while a 50+ group accepts birth years up to and including 1976.

Birth year and sex are not shown in participant lists. Other authenticated
members of the same club see only participant names.

## Relationships

```text
club
├── competition_groups
└── tournaments
    ├── tournament_groups
    │   └── source_group_id ────> competition_groups
    └── tournament_registrations
        ├── group_id ───────────> tournament_groups
        └── user_ids[] ─────────> users
```

## Admin routes and APIs

The implemented administration routes are:

```text
/admin/tournaments
/admin/tournaments/new
/admin/tournaments/:id/edit
/admin/tournaments/:id/participants
/admin/tournaments/groups/new
/admin/tournaments/groups/:id/edit
```

The protected member route is:

```text
/tournaments
```

The tournament list displays competition names as comma-separated links below
the `Konkurrenzen` label. Selecting a competition opens a dialog with its
participant count, participant names, and the current member's Anmelden or
Abmelden action. Participant names are loaded lazily when the dialog is opened.
The `Meine Turniere` filter and the registration summary below each tournament
title make the member's own registrations visible without opening the dialog.

The overview has separate tournament and competition-group tabs. Tournament
and competition-group lists are cached in club-scoped Redux slices. Create,
edit, and delete operations update those slices only after the corresponding
database operation succeeds. Player registration and withdrawal update the
cached total, per-group count, and current-user registration state immediately
after the API succeeds. Full participant lists remain local to the page that
loaded them.

The relevant API handlers are:

- `api/tournaments.ts`
- `api/competition-groups.ts`
- `api/tournament-registrations.ts`

Tournament and competition-group management mutations require an active
administrator and are scoped to the administrator's club. Active members may
create or remove their own singles registrations while registration is open.
Members creating a doubles registration must include themselves and one active
club partner. Administrators may manage registrations as an override. A
reusable competition-group template can be edited or deleted without changing
tournament-specific copies already created from it.

When an administrator tries to edit or delete a tournament after its
`end_date`, the administration interface displays a warning and asks for
confirmation. The administrator can still proceed with either operation.

## Database indexes

The tournament lookup indexes are created idempotently with:

```sh
npm run migrate:tournament-indexes
```

Run this migration once for every database environment. It creates the
following indexes:

```ts
// List a club's tournaments in chronological order.
db.tournaments.createIndex({ club_id: 1, start_date: -1 });

// Prevent the same template from being copied twice into one tournament.
db.tournament_groups.createIndex(
  { tournament_id: 1, source_group_id: 1 },
  { unique: true }
);

// Prevent a member from appearing in two registrations for the same group.
db.tournament_registrations.createIndex(
  { tournament_id: 1, group_id: 1, user_ids: 1 },
  { unique: true }
);

// List the participants of a tournament group in registration order.
db.tournament_registrations.createIndex(
  { tournament_id: 1, group_id: 1, registered_at: 1 }
);

// List a member's registrations.
db.tournament_registrations.createIndex(
  { user_ids: 1, tournament_id: 1 }
);
```

The registration API checks `user_ids` so a player cannot occur in another
registration in the same group. The unique multikey index enforces the same
rule atomically: each array member produces an index key for its tournament
and group. This also prevents simultaneous requests from registering the same
player twice. The index migration checks for existing duplicates before
replacing a legacy non-unique index.

## Data migrations

Existing installations can migrate legacy registration documents from
`user_id` and `partner_user_id` to `user_ids` with:

```sh
npm run migrate:tournament-registration-user-ids
```

The obsolete tournament participant-limit field can be removed with:

```sh
npm run migrate:remove-tournament-limits
```

Legacy "Herren" and "Damen" singles group names can be updated without
changing their IDs with:

```sh
npm run migrate:rename-singles-groups
```

Legacy tournament `group_ids` can be copied into `tournament_groups`, with
existing registration references rewritten to the snapshot IDs, using:

```sh
npm run migrate:tournament-groups
```

All migrations are idempotent.

## Current exclusions and future work

- Automatic age, sex, and mixed-team eligibility enforcement
- Partner invitation and confirmation for member-created doubles teams
- Participant limits
- Waiting lists
- Match/bracket modeling, pending a decision on competition format
