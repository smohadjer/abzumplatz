# API Documentation

This document is the starting point for documenting the application's APIs.
For now it covers reservation editing and deletion behavior. Additional API
endpoints can be added here over time.

## Reservations API

Base route: `/api/reservations`

The reservations endpoint supports:

- `GET` for listing reservations in the authenticated user's club
- `POST` for creating reservations
- `POST` with `reservation_id` for editing reservations
- `POST` with `delete=true` for deleting reservations

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

Edit a recurring reservation from a selected occurrence onward:

```json
{
  "reservation_id": "6876f2a8d3d8fd0a4d0f1001",
  "edit_from_date": "2026-06-30",
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

- Authentication is required.
- The reservation must exist.
- The reservation must belong to the same club as the authenticated user.
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
series. Once the selected occurrence's start time has passed, it is treated as
past and can no longer be used as the edit boundary.

Past occurrences are not modified.

When an admin edits a recurring reservation from a selected occurrence:

- the selected occurrence must be sent as `edit_from_date`
- the selected occurrence must not have started yet
- the existing recurring series is ended at that occurrence
- a new reservation/series is created for the edited version going forward

This means the edit affects future occurrences only, while current or
historical occurrences remain unchanged.

### Important Fields

- `reservation_id`: identifies the reservation to edit
- `edit_from_date`: required for recurring reservation edits; the clicked occurrence date, provided that the occurrence has not started yet
- `date`: the start date of the edited reservation or new recurring segment
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

- Authentication is required.
- The reservation must exist.
- The reservation must belong to the same club as the authenticated user.
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

### Important Fields

- `reservation_id`: identifies the reservation to delete
- `delete=true`: marks the request as a delete operation
- `date`: the selected occurrence date to delete
- `delete_type`: `once`, `once_and_future`, or `all`
