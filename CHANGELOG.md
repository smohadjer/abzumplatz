# Changelog

All notable changes to this project should be documented in this file.

## 0.8.0

### Added

- Added Pro-only access controls for creating and editing tournaments, managing Konkurrenzen, and publishing club-wide member notifications, enforced in both the interface and API.
- Added annual Pro subscription cancellation with immediate cancellation and full manual refund processing during the 30-day withdrawal period, followed by cancellation at the end of the paid year without prorated refunds.
- Added transactional club registration and plan changes so club access, administrator association, competition defaults, and paid billing periods remain consistent when an operation fails or is retried.
- Added database migrations for removing legacy Basic billing periods, enforcing one active billing period per club, and enforcing case-insensitive unique club names.
- Added billing lifecycle regression coverage for free Basic clubs, Pro-to-Basic transitions, and legacy Pro refund eligibility.

### Changed

- Made the Basic plan free without a membership limit or billing periods and removed all related activation restrictions, warnings, and configuration.
- Changed the Pro plan to 50 EUR per year and made upgrades start a paid twelve-month period immediately.
- Simplified billing so only paid Pro subscriptions create periods and invoices; downgrading to Basic no longer creates zero-value periods.
- Consolidated Basic and Pro feature descriptions in the shared plan configuration used by both the homepage and club registration.
- Reworked the homepage around free court reservations for tennis clubs, with separate responsive Basic and Pro feature lists, plan-specific icon styling, and clearer club-focused introductory copy.
- Updated club registration with explicit plan names, inline pricing, annual billing and cancellation guidance, and consistent “Kostenlos” wording for Basic.
- Updated plan documentation, FAQ content, terms, route metadata, and search metadata for the new pricing and feature model.
- Normalized SVG source colors so interface colors are controlled consistently through CSS.

### Fixed

- Prevented Basic billing periods from being created by registration, repair, renewal, restoration, or manual billing workflows.
- Prevented concurrent requests from creating duplicate active Pro subscriptions or duplicate club names.
- Preserved refund eligibility for legacy Pro clubs by falling back to the active Pro period start when the original Pro start timestamp is unavailable.
- Kept invoice email delivery outside database transactions so delivery failures cannot roll back or corrupt committed subscription state.

## 0.7.0

### Added

- Added public privacy and terms pages covering the application's principal data processing and usage conditions.
- Added a validated, rate-limited public support contact form with bot protection and linked it from the Impressum.
- Added password-confirmed self-service account deletion for players, including atomic cleanup of associated reservation, tournament-registration, and notification-recipient data, with rate limiting to protect against password guessing.
- Added end-to-end coverage for public legal pages, registration consent, the contact form, and authenticated-only telephone access.

### Changed

- Replaced the long registration privacy text with concise links to the privacy policy and terms while keeping consent required and unselected by default.
- Linked the Impressum, privacy policy, and terms from both public and authenticated sidebars.
- Updated the Impressum for the DDG, added the VAT identification number, and made the operator telephone number available only to authenticated users through the existing consolidated API function.

## 0.6.0

### Added

- Added a club setting that lets administrators limit player reservations to one or two hours, with a one-hour default and server-side enforcement for new and edited reservations.

### Changed

- Simplified reservation dialogs with compact read-only values, consistent close controls, constrained desktop widths, uniform spacing, and shared primary, secondary, and destructive button styles.
- Replaced reservation deletion checkboxes and inline confirmation panels with explicit delete actions, recurring-reservation scope selection, and native confirmation dialogs.
- Updated end-to-end coverage for the revised one-time and recurring reservation deletion flows.
- Hid the duration selector for players when the club permits only one-hour reservations and displayed the fixed duration directly.
- Standardized save and delete button presentation across profile, club, member, rule, notification, tournament, competition, and reservation interfaces.
- Redesigned application refresh feedback as a fixed progress bar that does not shift page content, and limited notification refreshes on drawer opening to data older than one minute.
- Made administrator tab changes replace their current browser-history entry so Back returns to the preceding page instead of cycling through tab selections.
- Moved reusable Konkurrenzen from the tournament tabs to a dedicated administrator page and grouped the administrator overview into related sections.
- Truncated long club names to a single line in the header and updated the club-settings navigation icon.

### Fixed

- Kept member-management tabs synchronized with browser Back and Forward navigation.
- Corrected radio controls whose numeric option values did not match string-valued form state.
- Aligned reservation submission loaders with their action buttons.
- Prevented native confirmation dialogs from causing a redundant visible application refresh.

## 0.5.0

### Added

- Added common tournament formats as selectable options when creating or editing a tournament.
- Added reusable subtle destructive-button styling for reset and list deletion actions.
- Added contextual icons throughout the administrator navigation and booking details.
- Added a shared trusted-origin utility for links generated by server-side email flows.

### Changed

- Standardized administrator tournament terminology on the tennis-specific term “Konkurrenzen” and clarified competition form labels.
- Redesigned tournament and competition filters as consistent radio-button filter bars with result counts.
- Presented tournament and competition overviews as compact responsive lists with direct edit and delete actions.
- Aligned tournament and competition forms with the shared profile form styling and improved optional age guidance and validation.
- Reorganized tournament and competition creation actions with descriptive text and contextual icons.
- Repositioned the existing competition reset action alongside competition creation and clarified that it restores all defaults.
- Updated the account sidebar so logout follows the navigation links and the centered version label appears directly below it, and reused the public hamburger icon for the authenticated menu.
- Renamed “Regeln” to “Vereinsregeln” in the sidebar and page heading.
- Refined tournament details by moving the date into the tournament-data section, restoring status in the overview, and improving section typography.
- Added clearer labels to administrator navigation, including “Vereinseinstellungen,” moved the club registration date to that page, and tightened the landing-page navigation spacing.
- Standardized user-facing email terminology as “E-Mail” and translated all remaining loader messages into German.
- Renamed the club-registration heading to “Verein anlegen.”
- Centered full-page loaders consistently within the viewport.
- Enlarged the homepage screenshot slider on mobile and refreshed the administration and booking screenshots.
- Redesigned the personal booking list with divider-based rows, compact date, court, and time details, contextual icons, and consistent secondary and destructive actions.
- Simplified profile editing by removing read-only email and status fields and optional-data explanatory copy, and changed birth-year entry to a native year dropdown.
- Removed the redundant calculated age from the profile overview.
- Standardized shared form textarea styling and shortened the displayed application-version label to “Version.”

### Fixed

- Generated password-reset and administrator-notification links from a validated request origin instead of relying on environment-specific client URL configuration or unvalidated Host headers.
- Disabled password-reset requests until a valid email address has been entered.
- Corrected German registration and club-settings wording and translated the remaining English password-reset instructions.

## 0.4.0

### Added

- Added an administrator setup checklist covering club details, court availability, reservation rules, test reservations, and member invitations.
- Added a one-time welcome dialog after a newly registered club administrator signs in, with a direct link to the setup checklist.
- Added loading indicators to player and club registration submissions.
- Added U12 and U15 junior groups plus 30+, 40+, and 60+ senior groups to the default tournament competition groups.
- Added an administrator action for transactionally resetting competition-group templates to the defaults.
- Added end-to-end coverage for resetting competition groups.

### Changed

- Redirected newly registered club administrators directly to login, prefilled their email address, focused the password field, and carried onboarding context through sign-in.
- Replaced hardcoded administrator return links with history-aware Back buttons and preserved checklist navigation after saving setup changes.
- Made the welcome dialog fully modal with focus containment, inert background content, Escape dismissal, and focus restoration.
- Made Basic-plan club addresses optional in club settings while retaining required billing addresses for Pro.
- Renamed administrator setting actions to clearer labels and added guidance for disabling courts.
- Updated competition-group filters so junior and senior groups no longer appear under unrestricted Herren or Damen categories.

### Fixed

- Corrected the new-club notification recipient address to `info@abzumplatz.de`.

## 0.3.1

### Fixed

- Made the homepage slider pagination spacing consistent between Safari and Chromium browsers.

## 0.3.0

### Added

- Added end-to-end coverage for Basic and Pro club registration, including their different address requirements and submitted data.
- Added end-to-end coverage for player registration through a club invitation link.
- Added a dedicated administrator invitation page with a club-specific player-registration link and sharing actions for native sharing, WhatsApp, email, and copying.
- Added an invitation step after club registration and automatic club preselection when players open an invitation link.

### Changed

- Simplified player and club-administrator registration by moving optional birth year and gender details to profile editing.
- Added guidance explaining how optional profile details help clubs understand their membership structure.
- Removed address fields from Basic club registration while keeping a complete billing address mandatory for Pro registration and upgrades.
- Limited member-directory data by access level: administrators retain complete member records, active members receive only the fields needed for club features and administrator contact, and inactive members receive only administrator contact details.
- Loaded the public club list and authentication state concurrently during application startup.
- Kept the initial notification refresh silent to avoid showing a second loading indicator after application startup.

## 0.2.2

### Added

- Added an accessible public fly-in menu for FAQ, support, and legal information.
- Added a responsive Swiper carousel that presents member, reservation, tournament, and administration views with mouse, touch, keyboard, and pagination controls.

### Changed

- Aligned header and footer content with the main desktop content area while keeping page scrolling at the viewport edge.
- Refined the homepage tagline and club feature descriptions to communicate tennis-specific reservations, live membership management, tournament registration, and browser-based access more clearly.
- Redesigned the homepage feature list with compact check markers and separators, and improved the spacing and alignment of the accompanying screenshots.
- Simplified the public homepage by moving FAQ, support, and legal links from the page content into the header menu.
- Tightened the public login control and balanced its spacing with the new menu button.
- Redirected inactive members directly to their profile after login, blocked access to club reservations, and disabled unavailable notification, court-booking, and tournament controls.
- Moved the inactive-account notice into a full-width status banner with guidance for changing clubs and contacting the club administration for activation.

### Fixed

- Updated Nodemailer to resolve reported security vulnerabilities.

## 0.2.1

### Changed

- Redesigned member administration as a responsive table with first name, last name, abbreviated gender, age, and email columns.
- Added sortable member columns and active-member filters for all, male, female, and youth members.
- Simplified member actions with direct activate, deactivate, and remove buttons, clickable member names for selection, and a distinct destructive remove action.
- Limited birth year and gender details in club member lists to administrators.
- Moved member-management styles into a page-specific stylesheet.

## 0.2.0

### Added

- Added database-backed in-app notifications with per-user unread and dismissed state, a header notification icon and unread indicator, a notification inbox, and restoration of dismissed notifications.
- Added an app-wide refresh manager and visible update indicator that refresh notification data after login and when the browser regains focus or becomes visible.
- Added administrator notification management with publication history, a form for publishing club-wide announcements, custom internal links and link labels, a modal preview, editing of published notifications, and reuse of an old notification as a new draft.
- Added optional automatic notifications when administrators publish tournaments, linking members directly to the tournament registration page.
- Added MongoDB notification indexes and a migration command for creating them.

### Changed

- Moved tournament publication alerts from the footer to the shared notification system and added in-app notifications to the homepage feature list.
- Replaced the dedicated notification page with an accessible fly-in drawer that keeps the current page visible and is mutually exclusive with the account drawer.
- Simplified the administrator navigation labels to “Turniere” and “Benachrichtigungen.”
- Refined notification and announcement controls with consistent button styles, required-field indicators, grouped optional link fields, and responsive modal spacing.
- Cached the administrator notification history by club to avoid repeated API requests and full-page loading when revisiting it.
- Organized internal architecture, authentication, club, notification, billing, reservation, testing, and tournament documentation into dedicated guides under `docs/` and linked them from the README.

### Fixed

- Scoped the client notification cache to both user and club and cleared it on logout so switching accounts displays the correct unread indicator.
- Kept the unread badge visible while refreshing after notification publication and immediately loaded the updated unread count.
- Made notification dismissal update the interface immediately and roll back safely if the server request fails.
- Added application rewrites for direct access to the notification inbox and administrator notification pages.

## 0.1.8

### Added

- Added an authenticated account menu that slides in from the right and is opened from a profile button in the header.
- Added the signed-in user's name, email address, and administrator status to the account-menu header.
- Added accessible account-menu behavior including keyboard focus management, Escape and backdrop closing, background-scroll locking, focus restoration, and reduced-motion support.

### Changed

- Replaced the Settings page and footer action with a compact account menu containing profile, club rules, support, FAQ, legal information, logout, and app-version links.
- Kept the former `/settings` URL as a compatibility redirect to reservations and removed redundant back links from authenticated profile, rules, support, FAQ, and legal-information pages.
- Kept the club name centered in the header at mobile widths while placing the profile button at the upper right.
- Refined the account menu with divider-based groups, tighter spacing, and consistent profile and close-button states.
- Redesigned authenticated and public footers with visible labels beside icons at wider widths and centered beneath icons below 400px, plus responsive icon sizes, compact padding, balanced spacing, and accessible touch targets.
- Clarified footer labels with “Platz buchen”, “Meine Buchungen”, “Start”, “Registrieren”, “Verein anlegen”, and “Admin”; aligned the personal-bookings page heading with its footer label; and removed the redundant public login action because login remains available in the header.

### Fixed

- Kept the Administration footer action selected throughout nested administrator pages instead of only on the administrator overview.
- Hid the player reservation-limit count from administrators, whose bookings are not subject to that limit.

## 0.1.7

### Added

- Added direct calendar navigation and confirmed cancellation actions to the personal reservations page, including controls for cancelling one occurrence, the current and future occurrences, or an entire recurring series.
- Added remaining-capacity guidance for players with a reservation limit and a clear warning when that limit is reached.
- Added Playwright end-to-end coverage for creating, editing, and deleting reservations and profile data.

### Changed

- Consolidated all one-time database migrations and backfills in the `migrations` directory while keeping reusable operational utilities in `scripts`.
- Updated the database migration and backfill npm commands to use the consolidated directory.
- Reworked the personal reservations list with nearest reservations first, structured reservation details, court-location icons, clearer action controls, and visually grouped entries.
- Replaced the authenticated footer home icon with a calendar icon for court reservations.
- Standardized warning, error, success, and destructive-action styling throughout the application.
- Improved reservation-grid and form accessibility with descriptive court-slot labels and explicit form-control associations.

### Fixed

- Validated recurring-reservation cancellation dates on the server so only active occurrences belonging to the selected series can be removed.
- Added deployment rewrites for tournament, tournament-administration, profile-editing, and club-deletion routes so reloading or opening those pages directly serves the application correctly.

## 0.1.6

### Added

- Added `robots.txt` and an XML sitemap for the public homepage, FAQ, support, and legal-information pages.
- Added production homepage prerendering so search engines and browsers receive meaningful content in the initial HTML response.
- Added route-specific titles, descriptions, canonical URLs, and search-indexing directives for public and application pages.

### Changed

- Hydrated the prerendered homepage with the existing React application to preserve its styling, behavior, and loading experience without hidden or duplicated SEO content.
- Changed the homepage tagline to a semantic primary heading.
- Pinned deployments to the Node.js 24 major release line so Vercel does not automatically select a future major version.
- Explicitly approved the version-pinned `bcrypt` and `esbuild` dependency installation scripts used during deployment.
- Migrated the API authentication middleware from Vercel's deprecated Edge runtime to the Node.js runtime.

### Fixed

- Replaced the competition-group JSON module import with a shared JavaScript data module so Vercel can compile the API functions without JSON-module or import-attribute errors.
- Consolidated authentication verification into the existing authentication function so the Node.js middleware remains within Vercel Hobby's 12-function deployment limit.

## 0.1.4

### Changed

- Refined homepage messaging with clearer club-management features, more concise registration cards, direct support access, and improved page title and search description.
- Ordered tournament lists with running and nearest upcoming tournaments first and completed tournaments at the bottom.
- Refined tournament cards with light-red completed states, linked titles, calendar icons, weekday labels for single-day events, and more compact date styling.
- Aligned the player tournament detail header with the listing-card presentation and removed the duplicated date from the tournament-data section.
- Unified tournament registration hints under the existing green color scheme and clarified unavailable draw data.
- Renamed account logout actions from “Abmelden” to “Ausloggen” to distinguish them from tournament withdrawals.

## 0.1.3

### Changed

- Changed “Verein löschen” on the admin overview from an inline destructive action to a standard navigation link.
- Moved club deletion to a dedicated confirmation page with consequence guidance and current-password verification.
- Added a footer indicator that alerts players to newly published tournaments until they open the tournament area.

## 0.1.2

### Added

- Added dedicated player and administrator detail pages for individual tournaments.
- Added structured tournament-data, competition, draw, and results sections to tournament detail pages.

### Changed

- Simplified tournament listings to show the tournament name, prominent date, registration status, countdown, and a link to the full details.
- Made competition registration clearer on tournament detail pages while retaining participant lists and singles or doubles registration workflows.
- Refined tournament detail-page spacing, countdowns, section separators, status messages, and responsive title handling.

## 0.1.1

### Added

- Added optional birth-year and sex fields to player registration and authenticated user profiles.
- Added a dedicated profile-editing page where users can update their name, birth year, and sex while email and account status remain read-only.

### Changed

- Changed the profile page to present account details as a read-only overview with birth year, calculated age, and sex.
- Moved the player club-change action to the edit-profile page while retaining the existing restriction for club administrators.
- Kept birth year and sex private from other club members in member API responses.
- Updated the homepage to present court reservations and club-tournament management as the app's core offerings.

## 0.1.0

### Added

- Added tournament and competition management for administrators, including tournament details, statuses, competition selection, participant management, filtering, and soft deletion ([#122](https://github.com/smohadjer/abzumplatz/issues/122)).
- Added a player tournament page with date-based filters, start countdowns, participant lists, and registration or withdrawal for singles and doubles competitions.
- Added reusable competition-group definitions, tournament-specific group snapshots, standard competition seed data, and automatic default-group creation for new clubs.
- Added tournament database migrations, lookup indexes, and a unique registration index that prevents a player from being registered twice in the same competition.
- Added `TOURNAMENTS.md` with the tournament data model, workflows, validation rules, migrations, and deferred features.

### Changed

- Preserved historical tournament groups independently from reusable competition templates so later template changes do not alter existing tournaments.
- Changed tournament deletion to retain tournaments, competition groups, and registrations through soft deletion.
- Updated production dependencies to resolve reported security vulnerabilities.
- Migrated ESLint configuration to the ESLint 9 flat-config format.
- Simplified administration navigation labels and added tournament access to the admin overview and authenticated footer.

### Fixed

- Made concurrent duplicate tournament registrations return a conflict response and enforced the rule atomically in MongoDB.
- Kept tournament and competition caches synchronized after successful create, edit, delete, registration, and withdrawal operations.

## 0.0.31

### Added

- Added `24 Uhr` as a valid club reservation end time and removed the ambiguous `0 Uhr` end-time option.

### Changed

- Centralized reservation date, recurrence, activity, and club-timezone calculations in a shared reservation-time module.
- Marked reservation owners who are no longer in the club as `Ehemaliges Mitglied` while retaining their user ID.

### Fixed

- Fixed completed reservations being counted toward a player's reservation limit when the server timezone differed from the club timezone.
- Made reservation creation, editing, deletion, calendar navigation, recurring occurrences, and member-removal cleanup consistently use the club timezone.
- Normalized midnight reservation end times to `00:00` on the following day in Google Calendar and ICS exports.

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
