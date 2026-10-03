# Plans

This document describes the available plans, how plan periods work, and how billing behaves in the app today.

## Plans

The app currently supports two plans:

- `basic`
- `pro`

Shared plan configuration lives in [src/planConfig.ts](/Users/sm/Documents/abzumplatz/src/planConfig.ts).

Plan behavior:

- `basic` is free, has no billing period, and includes member management and court reservations
- `pro` costs 50 EUR per year and additionally unlocks tournament creation and competition management
- neither plan limits the number of active members

### Legacy plan consolidation

The former `pro` and `elite` tiers are consolidated into the current `pro` plan:

- clubs already on the former `pro` plan remain on `pro`
- clubs on the former `elite` plan are migrated to `pro`
- existing billing periods keep their original price snapshots
- all subsequent renewals use the current `pro` price of 50 EUR per year

## Core Rules

Billing periods represent paid Pro subscriptions only.

- Basic clubs do not have an active billing period
- a Pro period keeps its original `period_start` and `period_end`
- upgrading from Basic starts a paid Pro period immediately
- historical Basic periods created by older versions are deleted

Run `npm run migrate:remove-basic-billing-periods` once when deploying this change to remove existing Basic records, including records belonging to deleted clubs. Renewal processing also removes any Basic records it encounters later.

Upgrades and downgrades:

- upgrades unlock Pro access and start annual billing immediately
- downgrades after the refund window take effect at the end of the paid Pro period
- Pro can be canceled during a running period; the 30-day refund policy determines whether cancellation is immediate or scheduled for renewal

Tournament features:

- members can continue to view and register for an existing published tournament
- only a club with active `pro` access can create, edit, or delete tournaments
- competition templates (Konkurrenzen) are available only to clubs with active `pro` access
- publishing and managing club announcements is available only to clubs with active `pro` access
- members can continue to read and manage notifications they have already received
- the API enforces these restrictions independently of the admin navigation

## Plan Periods

The `billing_periods` collection is the source of truth for paid Pro subscription history. Basic periods are not stored.

Each billing period stores:

- `club_id`
- `invoice_number`
- `plan_type`
- `price`
- `period_start`
- `period_end`
- `status`
- `created_at`
- optional `source`

Rules:

- there is at most one active Pro billing period per club
- Basic clubs do not require an active billing period
- billing period dates stay fixed once the period has started
- the running period plan stays attached to that billing period
- the partial unique index `unique_active_billing_period_per_club` prevents concurrent requests from creating more than one active period for the same club

Run `npm run migrate:billing-indexes` when deploying this change. The migration refuses to create the index if duplicate active periods already exist, so those records can be reviewed rather than modified automatically.

## Renewal Boundaries

Pro periods are annual and anchored to the same calendar day.

- a billing period has an anchor day based on the original billing day
- Pro periods run for twelve months
- the next Pro billing period starts on the same anchor day twelve months later when possible
- `period_end` is the renewal boundary

If the same day does not exist in the target month, the last valid day of that month is used.

The anchor day is preserved across later months.

Examples:

- `2026-06-19 -> 2027-06-19`
- `2028-02-29 -> 2029-02-28`

## Club Plan State

Each club stores two plan-related fields:

- `access_plan_type`
- `next_plan_type`

Meaning:

- `access_plan_type` is the plan whose features are active right now
- `access_plan_type` is `pro` while a paid Pro period is active
- `next_plan_type` is the plan that should apply at the next renewal

In practice:

- `access_plan_type` = active access plan now
- `next_plan_type` = plan used at the next renewal
- current billed/running plan = the active Pro billing period, if one exists
- `current_billing_plan_type` in API responses exposes that current billed/running plan when the UI needs it

## Registration

When a club is created:

- Basic registration creates no billing period
- Pro registration immediately creates a twelve-month Pro billing period and sends its invoice
- user creation or association, club creation, default competition groups, and the initial Pro period commit in one database transaction
- invoice email and the internal new-club notification are sent only after the registration transaction commits

## Renewal

At renewal time:

- an expiring Pro period is marked completed
- if `next_plan_type` is `pro`, a new annual Pro period starts on the same renewal boundary
- if `next_plan_type` is `basic`, the club switches to Basic and no new billing period is created

## When Billing State Is Refreshed

Billing renewal is now processed explicitly instead of being triggered by reads.

- `GET /api/billing` advances due billing periods for requests authorized with `CRON_SECRET`
- the renewal trigger intentionally shares the billing endpoint because Vercel cron uses `GET` and the free tier has a tight endpoint limit
- localhost and production both use the same `GET /api/billing` renewal flow
- the Vercel cron schedule calls that endpoint once per day with `GET`
- the endpoint expects `Authorization: Bearer ${CRON_SECRET}`
- write workflows that depend on current billing state run the renewal processor before applying plan-sensitive changes
- read endpoints no longer mutate billing state as a side effect

Renewal still keeps the original billing anchor day.

- expired active periods are marked as completed
- the next active period is created from the previous renewal boundary
- missed periods are backfilled in order if processing runs after multiple renewal boundaries

### Deleted and restored clubs

Deleted clubs are excluded from scheduled and fallback billing renewal processing. No billing periods or invoice emails are created while a club is deleted.

When an administrator restores a club:

- a still-current active billing period is kept unchanged
- no new invoice is issued while that period remains current
- an expired active period is marked as completed
- if there is no current active period and `next_plan_type` is Pro, exactly one new Pro period begins on the restoration date
- restoring a Basic club creates no billing period or invoice
- the restoration date becomes the anchor for subsequent renewals
- periods covering the deleted interval are not backfilled or invoiced

The billing reconciliation and club restoration are committed in one database transaction. If a new period is created, its invoice email is sent only after the transaction commits.

## Upgrades

If a club upgrades to a higher plan:

- Pro access starts immediately
- a twelve-month Pro billing period starts immediately
- the annual Pro invoice is sent immediately
- the club update and Pro-period creation commit atomically; invoice email is attempted after the transaction commits

Example:

- the club is using Basic without a billing period
- on `2026-07-10` the club upgrades to Pro

Result:

- the club gets `Pro` access immediately on `2026-07-10`
- a paid Pro period runs from `2026-07-10` to `2027-07-10`
- the club is invoiced 50 EUR for that annual period

## Downgrades

If a club downgrades to a cheaper plan:

- during the first 30 days after the initial Pro contract starts, cancellation is immediate
- an active paid Pro period canceled in that window is marked `canceled` with its full price in `refund_amount` and `refund_status: pending` for manual processing
- after the 30-day window, no full or prorated refund is offered
- after the 30-day window, the downgrade takes effect at period end
- after that window, current access remains unchanged until the current period finishes
- Basic begins without a replacement billing period

Example:

- current `Pro` period: `2026-06-19` to `2027-06-19`
- after the refund window, the club schedules a switch to Basic

Result:

- the club keeps `Pro` access until `2027-06-19`
- Basic access begins on `2027-06-19` without creating a new billing period

## Invoicing

Invoices are based on whole billing periods.

- one invoice covers one full billing period
- the invoice for the current period is based on that billing period document
- each billing period stores the plan price snapshot that applied when that period was created
- Basic has no invoices
- a renewed Pro subscription uses the current Pro price

### Invoice Email Delivery

Invoice emails are sent to every active administrator assigned to the club.

An invoice email is sent:

- immediately after a Pro billing period is created during club registration or upgrade
- automatically for every billing period created by the scheduled renewal process
- automatically for every billing period created by fallback renewal in another write workflow
- once when club restoration creates a new current billing period
- immediately after an administrator manually creates a billing period
- immediately after `GET /api/billing` repairs a Pro club that has no billing periods by creating a missing initial period
- when an administrator uses the resend action for an existing billing period

If renewal processing catches up multiple missed periods, one invoice email is sent for each newly created period.

Invoice emails include:

- the club name and address
- the invoiced plan and billing period
- the stored price snapshot, including net amount and VAT
- a stable invoice reference
- bank-transfer instructions when the required bank details are configured

New billing periods receive a persisted invoice number in the format `AZPYYYYNNNN`, for example `AZP20260001`.

- `YYYY` is the invoice year in the `Europe/Berlin` timezone
- `NNNN` is an application-wide sequence that starts at `0001` each year
- the sequence is allocated atomically from the `invoice_counters` collection
- the number contains no club ID and is not changed when an invoice is resent
- invoice delivery fails clearly if a billing period does not have a persisted `invoice_number`

Delivery behavior:

- billing-period creation and its initial invoice-delivery attempt are coordinated by one billing service
- invoice delivery uses the email transport configured by the application
- a manually created or repair-created billing period remains stored if email delivery fails
- the API reports the delivery failure separately from the successful billing-period creation
- renewal processing reports failed invoice deliveries after completing the billing-period renewals
- resending an invoice does not create a new billing period or change the existing one

## Members

Both plans allow an unlimited number of active members. New signups, club selection,
and activation by an administrator are not restricted by the club's plan.
