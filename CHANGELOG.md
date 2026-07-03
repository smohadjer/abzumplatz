# Changelog

All notable changes to this project should be documented in this file.

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
