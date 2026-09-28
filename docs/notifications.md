# In-App Notifications

This document describes the notification data model, recipient lifecycle, API, user inbox, administrator publishing workflow, and automatic tournament notifications.

Base route: `/api/notifications`

The application provides database-backed in-app notifications. These are shown inside the application and are not browser, operating-system, email, or mobile push notifications. Delivery does not use a service worker or an external push-notification provider.

Authenticated users see a notification icon beside the profile control in the header. A numeric red badge appears when the current user has unread notifications. Selecting the icon opens a right-side notification drawer without changing the current page or URL. The drawer supports marking notifications as read, dismissing and restoring them, and following internal links. It closes with its close button, the backdrop, Escape, or navigation. The notification and account drawers are mutually exclusive.

The notification cache is scoped to both the user and club and is cleared on logout so switching accounts cannot reuse another user's unread count. There is intentionally no dedicated `/notifications` page; the drawer is the only user inbox interface.

The app refreshes notification data after login and when the browser window regains focus or the document becomes visible. Focus and visibility events are throttled to avoid duplicate requests when both events fire together. A global header indicator remains visible for at least 500 milliseconds while app data is being refreshed. The refresh manager and indicator are app-wide so additional refresh tasks can be added later.

Publishing a manual notification or a tournament notification explicitly requests an immediate refresh. The existing inbox cache remains visible until the request completes, preventing the unread badge from disappearing temporarily.

## Data Model

Notification data is split between two MongoDB collections:

- `notifications` stores shared content once per published notification.
- `notification_recipients` stores delivery and per-user state once per recipient.

A `notifications` document can contain:

- `club_id`: club whose users receive the notification
- `type`: notification category, such as `announcement` or `tournament_published`
- `title`: notification heading
- `body`: notification text
- `link`: optional internal application path
- `link_label`: optional visible label for the internal link
- `source_key`: optional idempotency key used by automatically generated notifications
- `created_by`: ID of the administrator or user responsible for creation
- `created_at`: publication date and time

A `notification_recipients` document contains:

- `notification_id`: reference to the shared notification
- `user_id`: recipient user ID
- `created_at`: time the recipient record was created
- `read_at`: present after the user reads the notification
- `dismissed_at`: present after the user removes the notification from their inbox

Dismissal is a soft delete. It does not delete the shared notification or another user's recipient record. Restoring dismissed notifications removes `dismissed_at` while preserving their previous read state.

The client dismisses a notification optimistically so the card disappears immediately. If the API request fails, the card is restored to its previous position and its unread and dismissed counts are rolled back.

## Recipient Creation

When a notification is published, one recipient record is created for every user currently assigned to the notification's club, including inactive users and administrators. Inactive users cannot access the notification API until activated, but their existing recipient records remain available.

Recipient assignment is a publication-time snapshot. Users who join the club after a notification was published do not automatically receive that older notification.

The notification content is not duplicated per user. This keeps shared title, body, and link data in one document while allowing every recipient to have independent read and dismissed state.

## User Inbox API

The endpoint supports these authenticated operations:

- `GET /api/notifications`: returns the current user's non-dismissed notifications, unread count, and dismissed count.
- `PATCH /api/notifications?id=<notification-id>`: marks one notification as read for the current user.
- `PATCH /api/notifications?id=all`: marks all of the current user's club notifications as read.
- `DELETE /api/notifications?id=<notification-id>`: sets `dismissed_at` on the current user's recipient record.
- `PATCH /api/notifications?action=restore-dismissed`: restores all notifications dismissed by the current user in their current club.

Authentication, active status, club membership, and notification ownership are verified on the server. Read and dismissal operations cannot modify another user's recipient state.

## Administrator Publishing

Only active club administrators can publish manual announcements using `POST /api/notifications`. The request supports:

```json
{
  "title": "Neue Trainingszeiten",
  "body": "Die Trainingszeiten wurden für die kommende Woche angepasst.",
  "link": "/rules",
  "link_label": "Neue Zeiten ansehen"
}
```

The title and body are required. The optional link must be an internal path beginning with a single `/`; protocol-relative and external links are rejected. The optional link label is stored only when a link is present.

The administrator area provides two tabs:

- **Bisherige Benachrichtigungen** reads shared club notifications directly from `notifications`, so an administrator's personal read or dismissed state does not hide publication history.
- **Neue Benachrichtigung** provides the publishing form and a modal preview.

The publication history is cached separately from the personal inbox in Redux and is scoped to the current club. Returning to the history reuses the cached list instead of calling the API again. Publishing a manual notification prepends it to an already loaded cache, relevant tournament publication invalidates the cache, and logout clears it.

An old notification can be used as a template. Its title, body, link, and link label prefill the form, but publishing always creates a new notification and new recipient records. The original notification and its recipients are not changed.

## Tournament Notifications

The tournament form includes a notification checkbox that is enabled by default. When enabled, a notification is generated when a new tournament is published or an existing draft changes to published status.

The notification includes the tournament name and a direct internal link to its tournament page so users can view it and register. A stable `source_key` makes this operation idempotent and prevents the same tournament publication event from creating duplicate shared notifications.

## Indexes

Run the notification index migration after deploying the feature:

```sh
npm run migrate:notification-indexes
```

The indexes include a unique `(notification_id, user_id)` constraint for recipient records and a unique partial `(club_id, source_key)` constraint for notifications that have a source key. These constraints prevent duplicate per-user delivery and duplicate automatically generated notifications.
