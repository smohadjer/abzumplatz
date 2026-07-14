# Changelog

All notable changes to this project should be documented in this file.

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
