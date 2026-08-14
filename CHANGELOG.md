# Changelog

All notable changes to this project should be documented in this file.

## 0.0.30

### Changed

- Simplified public club registration by applying default country, reservation hours, timezone, and reservation-limit settings without showing those fields; the settings remain editable in club administration.
- Changed invoice emails to use `rechnung@abzumplatz.de` as their default sender while leaving other transactional emails on the general sender address.
- Stopped sending invoice emails for free Basic-plan billing periods and removed the invoice resend action for those periods from club administration.
- Refreshed the homepage feature list with shorter descriptions and corrected the Basic plan to state that it supports up to 100 active members.

## 0.0.29

### Added

- Added administrator actions to delete and restore a club.

### Changed

- Hid deleted clubs from registration and club-selection lists while retaining administrator access for restoration.
- Redirected players assigned to a deleted club to select an active club after login.
- Added the deletion date for club administrators and a deleted-club notice for affected players.
- Restricted administrators of deleted clubs to a recovery page with restore and logout actions.
- Required administrators to re-enter their current password before deleting a club.
- Excluded deleted clubs from club-scoped API operations and scheduled billing renewals.
- Resumed billing on club restoration without creating retroactive billing periods for the deleted interval.

## 0.0.28

### Added

- Added separate player and administrator FAQ sections and linked them from the homepage and Settings.

### Changed

- Refined homepage messaging, cards, actions, screenshot, and supporting links.
- Centered club names in the authenticated header and reduced page-heading size.
- Expanded the Support page and email template to welcome general feedback and feature suggestions as well as bug reports.
- Updated club-registration plan cards to match the homepage card styling and moved the Basic-plan member-limit explanation to the FAQ.
- Restyled FAQ and member-management tabs and updated member action buttons with pill styling.
- Translated the password-strength indicator into German.
- Updated court controls to label unchecked courts as blocked immediately.

### Fixed

- Preserved the club registration timestamp in court-update responses.

## 0.0.27

### Added

- Added app and browser diagnostics to technical-support email drafts.

### Changed

- Restyled the admin overview navigation to match the Settings page.
- Simplified the admin overview to show only the club registration date below its navigation links.

### Fixed

- Contained horizontal scrolling within the billing table on narrow screens.

## 0.0.26

### Added

- Added duplicate-name highlighting to member administration so administrators can identify matching member accounts.
- Added a read-only detail popup when players select another member's reservation.

### Changed

- Updated the default club rules and added court-watering and cancellation guidance.
- Replaced the required club-rules checkbox in the reservation form with a confirmation notice.
- Changed club rules so administrators can save an empty rule list or restore the standard rules.
- Changed member administration to display names as “Nachname, Vorname” and sort members by last name, then first name using German collation.
- Added club rules to the administrator feature overview and adjusted the Settings link order.
- Simplified and refined the reservation popup layout for non-admin players.
- Changed calendar actions to close the reservation popup after use.
- Changed the Bookings page to a read-only list ordered with later reservations first.

### Fixed

- Fixed non-admin reservation edits failing when changing the duration because the existing label was omitted.

## 0.0.25

### Added

- Added a Settings page with links to profile, club rules, support, legal information, and logout.
- Added club-specific rules with default content, database persistence, and an admin editor for adding, removing, reordering, and updating rules.
- Added a required club-rules confirmation checkbox to the reservation form, with the rules opening in a separate tab.
- Added a Support page with the current club administrator as the reservation contact and a technical-support email address.

### Changed

- Replaced the footer profile action with a Settings action and removed the Impressum action from the footer.
- Moved logout from the header to Settings and added a confirmation prompt.
- Changed the Impressum contact address to `info@abzumplatz.de` and moved reservation support details to the Support page.

## 0.0.24

### Fixed

- Fixed newly registered clubs remaining absent from client state by returning the created club from the signup API and upserting it into the club list without another API request ([#117](https://github.com/smohadjer/abzumplatz/issues/117)).
- Fixed the new club administrator seeing “Verein nicht gefunden!” when logging in immediately after registering the club in the same browser session.

## 0.0.23

### Changed

- Deduplicated club-registration validation by referencing the shared account and club schemas from the combined signup schema ([#88](https://github.com/smohadjer/abzumplatz/issues/88)).
- Changed German postal-code validation to require exactly five digits while preserving leading zeroes.
- Changed client-side validation to load referenced JSON schemas asynchronously.

### Fixed

- Fixed shared server-side schema registration so API modules reuse existing AJV validators instead of failing on duplicate schema IDs.
- Fixed schema-loading failures so forms are re-enabled and display a retry message instead of remaining disabled.

## 0.0.22

### Changed

- Changed member administration so admin users are explicitly shown as non-deactivatable and the API returns a specific error when admin deactivation is attempted.
- Changed reservation listing to derive the club from the authenticated user instead of requiring a `club_id` query parameter.
- Changed recurring reservation deletion to default to deleting the entire series when `delete_type` is omitted.
- Changed the inactive-account warning so it is only shown after a user belongs to a club.
- Changed the inactive-account warning to tell newly registered users to wait for club-admin activation before contacting the administrator if activation remains pending.
- Changed the inactive-account warning to display the club administrator's email address alongside their name.
- Changed the profile page to show the club-change action as an inline link after the club name.
- Renamed the club-leave button from “Kein Verein” to the action-oriented “Verein verlassen.”
- Moved the missing-club guidance into the club-selection form below the submit button.
- Changed club selection to keep the user's current club in the dropdown so it remains available after leaving.
- Changed the club-change warning to state that active reservations in the current club are deleted when switching or leaving.
- Changed club selection to disable submission when the user's current club is selected.

## 0.0.21

### Added

- Added an idempotent migration for consolidating legacy Elite records into the Pro plan.

### Changed

- Reduced the available plans to Basic and Pro.
- Changed Pro to include unlimited active members for 15 EUR per month.
- Changed historical price backfilling to reject ambiguous Pro periods instead of guessing their original price.

## 0.0.20

### Added

- Added a reusable invoice-number backfill script for billing periods without a persisted `invoice_number`.
- Added a dedicated TypeScript configuration for API code and included it in the production build.

### Changed

- Removed club IDs from new-member and new-club registration emails when the club name already identifies the club.
- Changed role and status values in registration emails to use German labels such as `Spieler`, `Administrator`, `Aktiv`, and `Inaktiv`.
- Changed registration timestamps in admin emails to the format `DD.MM.YYYY um HH:MM Uhr` using the `Europe/Berlin` timezone.
- Changed billing periods to require persisted, application-wide yearly invoice numbers such as `AZP20260001`, without club-ID fragments, separators, or legacy reference generation.
- Changed billing-period creation to always attempt invoice delivery through one centralized service, including registration, scheduled and fallback renewal, manual creation, and repair.
- Replaced the billing list's creation-date column with the persisted invoice number.
- Expanded `PLANS.md` with invoice-email triggers, recipients, delivery behavior, contents, resend behavior, and invoice-number rules.

## 0.0.19

### Added

- Added a persistent inactive-user warning in the logged-in app shell with a prefilled email link to the current club admin.

### Changed

- Changed inactive-user messaging to use one shared source across frontend alerts, the in-app warning, and backend reservation authorization errors.
- Changed the inactive-user warning to include the current club admin's name when available and to make only that name the email link target.
- Changed the users store to track which club its loaded members belong to, so admin contact details are only reused when they match the current club.
- Changed reservation creation UX so inactive users are blocked immediately in the frontend before a reservation request is sent.

## 0.0.18

### Added

- Added invoice-style admin email content for billing periods, including VAT display, club address details, bank transfer instructions, and stable invoice references.
- Added an admin action to resend the invoice email for a billing period from the billing list in the admin UI.
- Added a backfill script for billing-period prices so older billing documents can be migrated to the new price snapshot model.

### Changed

- Changed billing periods to store a required `price` snapshot that is used as the invoice source of truth.
- Changed the admin billing list to show billing-period prices and clearer invoice resend status messages.
- Changed invoice delivery handling so API responses clearly distinguish between a created billing period and a failed invoice email delivery.
- Changed `api/billing.ts` to delegate invoice rendering and delivery work to a dedicated billing-invoice helper, keeping the endpoint logic smaller and easier to maintain.
- Changed the admin billing list endpoint to recreate a missing initial billing period as a lazy fallback when a club has no billing periods at all, and to issue the invoice email for that repair-created period immediately.

## 0.0.17

### Added

- Added admin email notifications when a billing period is created manually and when renewal creates new billing periods automatically.
- Added billing REST examples for listing billing periods, manually creating a billing period, and triggering the cron-style renewal flow.

### Changed

- Changed billing renewal from lazy read-time state mutation to an explicit renewal process that runs through the shared `/api/billing` endpoint.
- Changed billing helpers to separate read-only billing state lookup from renewal processing, making billing reads predictable and side-effect free.
- Changed renewal processing to catch up clubs across multiple missed billing periods and create one admin notification email per created billing period.
- Changed the billing endpoint documentation and code comments to clarify why renewal uses `GET /api/billing` with the cron secret in both local and Vercel environments.
- Changed billing period price handling so `price` is now required in the shared billing types and invoice generation fails loudly if a malformed billing record is missing its stored price.
- Changed billing invoice delivery to report failures back to the caller instead of silently swallowing admin email delivery errors.

## 0.0.16

### Added

- Added `PLANS.md` to document the unified plan model, billing-period lifecycle, renewal rules, upgrade and downgrade behavior, and member-limit enforcement.

### Changed

- Changed plan and billing handling so all plans, including `basic`, use billing periods and the same renewal model.
- Changed billing periods to keep a stable start and end boundary across mid-period plan changes instead of resetting billing boundaries when a club changes plan.
- Changed club plan state handling to separate current access (`access_plan_type`) from the next renewal plan (`next_plan_type`), so upgrades can apply immediately while downgrades wait for renewal.
- Changed billing-state resolution to advance expired periods lazily when billing-aware data is loaded, creating the next active period automatically from the prior renewal boundary.
- Changed the admin billing and club views to show the current billed period and upcoming plan changes more clearly.
- Changed member-limit enforcement to use the resolved active access plan and current billing state when admins activate members.
- Changed frontend auth initialization to track an explicit `authChecked` state so components can distinguish "not logged in" from "auth check still in progress."

### Fixed

- Fixed billing period typing and API handling so `basic` plan periods are tracked consistently instead of treating billing periods as paid-plan-only records.
- Fixed the header auth action so logged-in users no longer briefly see the `Anmelden` button while the app verifies the existing session during startup.

## 0.0.15

### Added

- Added an `npm run release:github` script to create a GitHub release for the current `package.json` version.
- Added a release automation script that reads the matching changelog section, creates and pushes the git tag, and creates the GitHub release.
- Added README documentation for the GitHub release workflow.

### Changed

- Changed the release script to load `GITHUB_TOKEN` from `.env` in addition to supporting the shell environment.
- Documented that the release workflow uses a GitHub personal access token rather than a deploy key, and that a fine-grained token with `Contents: write` is sufficient for the GitHub Releases API call.

## 0.0.14

### Added

- Added an `npm run export:db` command to export MongoDB collections as Extended JSON backup files.
- Added a MongoDB export script that reads `db_uri`, writes per-collection backup files, and generates a manifest in a timestamped backup folder.
- Added a support contact box to the homepage.

### Changed

- Added `backups/` to `.gitignore` so generated database exports stay out of version control.
- Refreshed the homepage copy to better explain browser-based usage, free usage for smaller clubs, multi-court and recurring bookings, and club administration features.
- Changed logged-in header branding to show the club name as the primary brand label instead of rendering the default logo alongside a separate club-name line.
- Updated the club plan selection cards to show feature lists and plan-specific support and billing footnotes.

### Fixed

- Improved the reservation legend marker layout on smaller screens so marker content stays centered and readable.

## 0.0.13

### Fixed

- Centralized reservation write authorization so authenticated user status is consistently reloaded from MongoDB before create, edit, or delete actions.
- Removed `status` from the JWT payload to avoid treating token data as the source of truth for authorization-sensitive status checks.
- Changed login and `/api/verifyAuth` responses to treat missing user status as `inactive` by default, matching the rule that users remain inactive until an admin activates them.

### Changed

- Clarified in code and documentation that the database user record is authoritative for status decisions, while frontend auth status is UI-facing cached state.
- Added a shared authenticated-user helper for reservation write flows that resolves the JWT identity and then reloads the current user record from MongoDB.

### Added

- Documented that application assumptions, especially around authorization and default business rules, should be captured in `DOCUMENTATION.md`.

## 0.0.12

### Fixed

- Added inactive-user checks to reservation edit and delete requests.
- Changed recurring reservation activity handling in the UI so ended or fully past recurring reservations are no longer treated as active.
- Fixed a calendar bug where past slots could appear available after midnight because date-only values were derived with `toISOString().split('T')` instead of local date formatting.

### Changed

- Changed admin editing of already-started recurring reservations to end the original series at the selected occurrence and insert a new reservation with updated values, preserving past occurrences.
- Added `occurrence_date` to recurring reservation edit requests.
- Added centralized reservation API error handling with shared error codes and German error messages.

### Added

- Added `DOCUMENTATION.md` to the repository for API and behavior documentation.
- Added `CHANGELOG.md` to track notable project changes.
