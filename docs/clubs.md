# Clubs

This document describes club lifecycle behavior that affects multiple application features.

## Club names

Club names are unique regardless of capitalization, including names belonging to soft-deleted clubs. The database enforces this with the collation-aware `unique_club_name` index. Run `npm run migrate:club-indexes` when deploying the index. The migration aborts without changing data when duplicate names already exist.

## Club Soft Deletion

An administrator can delete their club from the Admin page. This is a soft delete: the API sets the club's `deleted_at` field to the current date and time. It does not remove the club document or any associated users, reservations, billing records, rules, or court data.

Deleting a club requires the administrator to re-enter their current password. The API verifies the password against the current administrator record before setting `deleted_at`; the client-side confirmation form is not treated as authorization by itself.

While a club is soft-deleted:

- It is excluded from club lists shown during player registration and club selection.
- Registration and club-selection API requests cannot assign a player to it.
- Club-scoped reservation, member-management, club-management, and billing API operations reject it.
- Scheduled billing renewals skip it, so no new billing periods or invoices are created while it is deleted.
- The club administrator can still log in, but the app redirects protected routes to a recovery-only Admin page.
- The recovery page hides normal club-management navigation and offers only **Verein wiederherstellen** and **Ausloggen**.
- Restoring the club removes `deleted_at` and makes the club available again.
- If the club still has an active billing period whose end date is in the future, restoration keeps that period unchanged and does not issue another invoice.
- If the previous active Pro billing period has expired and the club remains on Pro, restoration completes it and creates exactly one new Pro period beginning on the restoration date. The deleted interval is not recreated or invoiced retroactively.
- Restoring a Basic club creates no billing period or invoice.
- A restoration-created Pro period anchors future renewals to the restoration date and sends one invoice for the new period.
- Billing reconciliation and removal of `deleted_at` are committed in one database transaction. Any invoice email is sent only after that transaction commits, so email failure cannot roll back or duplicate the restored billing state.
- Players previously assigned to the club can still log in, but authentication exposes an empty `club_id` for them. The app therefore redirects them to the club-selection page.
- A player's stored club association remains unchanged until they select another club or leave the deleted club. If the administrator restores the club first, the original association becomes effective again on the player's next login or session verification.

Only an authenticated administrator can delete or restore their own club. There is no automatic or scheduled permanent deletion of club data.

Authentication and recovery are intentional exceptions to the operational exclusion: login and session verification inspect the deleted club to route players to club selection and administrators to recovery. The club detail endpoint also permits the club's own authenticated administrator to read the deleted record, and the restore endpoint must be able to update it.
