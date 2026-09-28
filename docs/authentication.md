# Authentication and Authorization

This document records authentication and authorization decisions that apply across application features.

## User Status Authority

User status has different roles depending on where it appears:

- The database `users` record is the source of truth for authorization decisions.
- The JWT does not carry `status`; it contains identity and session fields only.
- Redux `auth.status` is client display state and may become stale until the client refreshes or logs in again.
- Login and `/api/verifyAuth` responses may include `status` for UI display, but that response value is not the authorization source of truth.
- If a user record has no stored status, UI-facing authentication responses treat that user as `inactive` by default.

Server endpoints that require an active user reload the current user from MongoDB and apply the active-user rule from that record. They do not trust Redux state or earlier client-cached status values.

For example, reservation write operations require authentication, an existing active user, valid club membership, and an existing club. Feature-specific rules are documented in the corresponding feature guide.
