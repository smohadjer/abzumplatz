# Plans

This document describes the available plans, how plan periods work, and how billing behaves in the app today.

## Plans

The app currently supports two plans:

- `basic`
- `pro`

Shared plan configuration lives in [src/planConfig.ts](/Users/sm/Documents/abzumplatz/src/planConfig.ts).

Plan behavior:

- `basic` renews monthly and limits active members to the configured cap
- `pro` renews monthly and has no member cap

### Legacy plan consolidation

The former `pro` and `elite` tiers are consolidated into the current `pro` plan:

- clubs already on the former `pro` plan remain on `pro`
- clubs on the former `elite` plan are migrated to `pro`
- existing billing periods keep their original price snapshots
- all subsequent renewals use the current `pro` price of 15 EUR per month

## Core Rules

The app keeps plan periods stable when a club changes plan.

- the current period keeps its original `period_start`
- the current period keeps its original `period_end`
- plan changes do not create a new billing boundary in the middle of the current period
- every club should have an active period, including `basic`

Upgrades and downgrades:

- upgrades unlock better access immediately
- the running period keeps its original billed plan until renewal
- downgrades take effect at the next renewal
- after an upgrade within a running period, downgrading to a cheaper plan is blocked until the next renewal

Member caps:

- member caps apply only to active members
- signups and club selection are still allowed even if a club is already above a cap
- the hard cap is enforced only when an admin activates inactive users

## Plan Periods

The `billing_periods` collection is the source of truth for plan-period history.

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

- there is at most one active billing period per club
- billing period dates stay fixed once the period has started
- the running period plan stays attached to that billing period

## Monthly Renewal Boundary

Plan periods are month-based and anchored to the same calendar day.

- a billing period has an anchor day based on the original billing day
- the next billing period starts on that same anchor day in the next month when possible
- `period_end` is the renewal boundary

If the same day does not exist in the next month, the last valid day of that month is used.

The anchor day is preserved across later months.

Examples:

- `2026-06-19 -> 2026-07-19`
- `2026-01-31 -> 2026-02-28`
- `2026-02-28 -> 2026-03-31`

## Club Plan State

Each club stores two plan-related fields:

- `access_plan_type`
- `next_plan_type`

Meaning:

- `access_plan_type` is the plan whose features are active right now
- `access_plan_type` can be higher than the running period plan after an upgrade
- `next_plan_type` is the plan that should apply at the next renewal

In practice:

- `access_plan_type` = active access plan now
- `next_plan_type` = plan used at the next renewal
- current billed/running plan = `billing_periods.active.plan_type`
- `current_billing_plan_type` in API responses exposes that current billed/running plan when the UI needs it

## Registration

When a club is created:

- an initial active billing period is created immediately for the selected plan

## Renewal

At renewal time:

- the current billing period ends
- the next billing period starts on the same renewal boundary
- the club switches to `next_plan_type`
- a new billing period is created for `next_plan_type`

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

## Upgrades

If a club upgrades to a higher plan:

- upgraded access starts immediately
- the current period boundary does not move
- the current period keeps its original billed plan
- the next period starts on the higher plan
- after that upgrade, a downgrade is blocked until the next renewal

Example:

- current `Basic` period: `2026-06-19` to `2026-07-19`
- on `2026-07-10` the club upgrades to `Pro`

Result:

- the club gets `Pro` access immediately on `2026-07-10`
- the current billing period still ends on `2026-07-19`
- the running period remains billed as `Basic`
- the next period starting `2026-07-19` is billed as `Pro`

## Downgrades

If a club downgrades to a cheaper plan:

- the downgrade takes effect at period end
- current access remains unchanged until the current period finishes
- the next billing period uses the downgraded plan

Example:

- current `Pro` period: `2026-06-19` to `2026-07-19`
- on `2026-07-05` the club switches to `Basic`

Result:

- the club keeps `Pro` access until `2026-07-19`
- the next billing period starting `2026-07-19` is billed as `Basic`

## Invoicing

Invoices are based on whole billing periods.

- one invoice covers one full billing period
- invoices are not split because of a mid-period plan change
- the invoice for the current period is based on that billing period document
- each billing period stores the plan price snapshot that applied when that period was created
- the next invoice uses the plan that becomes effective at renewal

### Invoice Email Delivery

Invoice emails are sent to every active administrator assigned to the club.

An invoice email is sent:

- immediately after the initial billing period is created during club registration
- automatically for every billing period created by the scheduled renewal process
- automatically for every billing period created by fallback renewal in another write workflow
- immediately after an administrator manually creates a billing period
- immediately after `GET /api/billing` repairs a club that has no billing periods by creating a missing initial period
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

## Member Limits

Member limits apply only to active members.

- `basic`: up to 100 active members
- `pro`: no limit

Enforcement:

- new signups and club selection are still allowed even if a club already has many members
- the hard cap is enforced when an admin activates inactive users
- if a club is above the active-member cap after a downgrade, existing active members remain unchanged
- in that case, the admin cannot activate additional inactive users until the number of active members falls below the plan limit
