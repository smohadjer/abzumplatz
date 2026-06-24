# Documentation

This document is the starting point for documenting the application's APIs and
important behavior decisions.

For now it covers reservation editing and deletion behavior. Additional API
endpoints, workflows, and logic decisions can be added here over time.

## Table of Contents

- [Reservations API](#reservations-api)
- [Adding Reservations](#adding-reservations)
- [Editing Reservations](#editing-reservations)
- [Deleting Reservations](#deleting-reservations)

## Reservations API

Base route: `/api/reservations`

The reservations endpoint supports:

- `GET` for listing reservations in the authenticated user's club
- `POST` for creating reservations
- `POST` with `reservation_id` for editing reservations
- `POST` with `delete=true` for deleting reservations

### General POST Rules

These rules apply to all `POST` operations on `/api/reservations`:

- Authentication is required.
- The authenticated user must exist.
- The authenticated user must belong to a club.
- The club must exist.
- Inactive users cannot send `POST` requests to reservation API endpoints.

## Adding Reservations

Create requests are handled when the request body does not contain
`reservation_id` and does not contain `delete=true`.

### Example POST

Create a non-recurring reservation:

```json
{
  "date": "2026-06-30",
  "court_nums": ["1"],
  "start_time": 18,
  "end_time": 19,
  "label": "Freies Spiel"
}
```

Create a recurring reservation:

```json
{
  "date": "2026-06-30",
  "court_nums": ["1", "2"],
  "start_time": 18,
  "end_time": 20,
  "label": "Training Herren 40",
  "recurring": true
}
```

### General Rules

- Reservations cannot be created in the past.
- Reservations must stay within the club's configured reservation hours.
- Reservations must not overlap with existing reservations on the selected courts.

### Non-Admin Users

- Can only reserve according to the non-admin reservation rules.
- Are limited by the club's `reservations_limit` when one is configured.
- Cannot reserve multiple courts at the same time.
- Cannot create recurring reservations.

### Admin Users

- Are not restricted by the normal user reservation limit.
- Can reserve multiple courts.
- Can create recurring reservations.

### Important Fields

- `date`: reservation date or recurring series start date
- `court_nums`: selected court numbers
- `start_time`: reservation start hour
- `end_time`: reservation end hour
- `label`: reservation label
- `recurring`: whether the reservation repeats weekly

## Editing Reservations

Edit requests are handled when `reservation_id` is included in the request body.

### Example POST

Edit a non-recurring reservation:

```json
{
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "date": "2026-06-30",
  "court_nums": ["1"],
  "start_time": 18,
  "end_time": 19,
  "label": "Freies Spiel"
}
```

Edit a recurring reservation for all occurrences that are not yet in the past:

```json
{
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "occurrence_date": "2026-07-14",
  "date": "2026-06-30",
  "court_nums": ["1", "2"],
  "start_time": 18,
  "end_time": 20,
  "label": "Training Herren 40",
  "recurring": true
}
```

Reassign a reservation to the current admin without changing the schedule:

```json
{
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "date": "2026-06-30",
  "court_nums": ["1"],
  "start_time": 18,
  "end_time": 19,
  "label": "Freies Spiel",
  "assign_to_myself": true
}
```

### General Rules

- The reservation must exist.
- Past non-recurring reservations cannot be edited.
- Edits must still pass normal validation such as club hours and overlap checks.

### Non-Admin Users

- Can edit only their own reservations.
- Cannot edit recurring reservations.
- Cannot assign a reservation to another user.

### Admin Users

- Can edit any reservation in their own club.
- Can edit recurring reservations.
- Can assign a reservation to themselves by sending `assign_to_myself=true`.

### Recurring Reservation Edit Behavior

Recurring reservation edits are applied only to future occurrences of the
series. Once an occurrence's start time has passed, it is treated as past and
can no longer be changed.

Past occurrences are not modified.

When an admin edits a recurring reservation:

- `occurrence_date` identifies the clicked occurrence in the recurring series
- the backend applies the edit starting from the first occurrence in the series that has not started yet
- if the series already has past occurrences, the existing recurring series is ended at that occurrence and a new reservation/series is created for the edited version going forward
- if the series has not started yet, the existing reservation is updated in place and no new reservation is created

This means the edit affects all occurrences that are not yet in the past, while
historical occurrences remain unchanged.

### Recurring Edit Edge Cases

- Editing a later future occurrence can still update earlier future occurrences in the same series, as long as those earlier occurrences have not started yet.
- Clicking a future occurrence in the calendar does not guarantee that the edit starts from that exact date. The backend uses `occurrence_date` as the clicked occurrence, then derives the first occurrence in the series that has not started yet as the effective edit boundary.
- If today's occurrence has already started, it is treated as past and the edit boundary moves to the next occurrence in the series that has not started yet.
- If a recurring series has already started, the edit preserves history by splitting the series into an old unchanged part and a new edited part.
- If a recurring series has not started yet, there is no historical part to preserve, so the reservation is edited in place.

### Edit UI Notes

- When editing a recurring reservation in the popup, the app shows a highlighted message that all occurrences in the series that have not started yet will be updated.
- Reservation-level validation errors in the popup are shown as form-level error messages instead of being attached to a specific field.

### Important Fields

- `reservation_id`: identifies the reservation to edit
- `occurrence_date`: required for recurring reservation edits; the clicked occurrence in the recurring series
- `date`: the requested edited reservation date; for recurring edits the backend may normalize the new recurring segment to the first occurrence in the series that has not started yet
- `court_nums`: selected court numbers
- `start_time`: reservation start hour
- `end_time`: reservation end hour
- `label`: reservation label
- `recurring`: whether the reservation repeats weekly
- `assign_to_myself`: optional admin-only boolean for taking over the reservation

## Deleting Reservations

Delete requests are handled when `delete=true` is included in the request body.

### Example POST

Delete a single occurrence of a recurring reservation:

```json
{
  "delete": "true",
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "date": "2026-06-30",
  "delete_type": "once"
}
```

Delete the selected occurrence and all following occurrences:

```json
{
  "delete": "true",
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "date": "2026-06-30",
  "delete_type": "once_and_future"
}
```

Delete an entire reservation or recurring series:

```json
{
  "delete": "true",
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "date": "2026-06-30",
  "delete_type": "all"
}
```

### General Rules

- The reservation must exist.
- Past non-recurring reservations cannot be deleted.

### Non-Admin Users

- Can delete only their own reservations.

### Admin Users

- Can delete their own reservations.
- Can delete other users' reservations in their own club.

### Recurring Reservation Delete Behavior

Recurring reservation deletion supports three modes:

- `delete_type=once`: remove only the selected occurrence
- `delete_type=once_and_future`: end the series at the selected occurrence
- `delete_type=all`: delete the entire recurring series

Implementation details:

- `once` stores the selected date in `deleted_dates`
- `once_and_future` sets `end_date` to the selected date
- `all` removes the reservation document entirely

### Recurring Delete Edge Cases

- `once` removes only the selected occurrence and keeps the rest of the series active.
- `once_and_future` removes the selected occurrence and every later occurrence in the series.
- If `once_and_future` is used and all earlier occurrences in the same series were already deleted, the backend removes the whole reservation document instead of only setting `end_date`.

### Important Fields

- `reservation_id`: identifies the reservation to delete
- `delete=true`: marks the request as a delete operation
- `date`: the selected occurrence date to delete
- `delete_type`: `once`, `once_and_future`, or `all`
