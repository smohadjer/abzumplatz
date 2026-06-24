# Changelog

All notable changes to this project should be documented in this file.

## 0.0.12

### Fixed

- Added inactive-user checks to reservation edit and delete requests.
- Changed recurring reservation activity handling in the UI so ended or fully past recurring reservations are no longer treated as active.
- Fixed a calendar bug where past slots could appear available after midnight because date-only values were derived with `toISOString().split('T')` instead of local date formatting.

### Changed

- Changed admin editing of already-started recurring reservations to end the original series at the selected occurrence and insert a new reservation with updated values, preserving past occurrences.
- Added `edit_from_date` to recurring reservation edit requests and frontend validation that blocks editing recurring occurrences in the past.
- Added centralized reservation API error handling with shared error codes and German error messages.

### Added

- Added `DOCUMENTATION.md` to the repository for API and behavior documentation.
- Added `CHANGELOG.md` to track notable project changes.
