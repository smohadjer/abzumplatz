# Billing

This document describes how billing and paid/free plan behavior works in the app.

## Current Plan Model

The app currently has two plans:

- `free`
- `paid`

The central plan configuration lives in [src/planConfig.ts](/Users/sm/Documents/abzumplatz/src/planConfig.ts).

Current shared plan rules:

- `FREE_PLAN_MEMBERS_LIMIT`
- `PAID_PLAN_PRICE_EUR`

The paid plan is monthly.

Plan labels and user-facing hint text are also derived from that file.

## Current Club Fields

Relevant billing-related fields currently stored on a club:

- `plan_type`

## Meaning Of Plan Fields

`plan_type` is the renewal-state decision:

- `paid` means renew when the current paid period ends
- `free` means do not renew after the current paid period ends

The end of the current paid period is derived from the active record in `billing_periods`.

## Current Entitlement Rule

A club behaves as `paid` while its current paid period is still active.

That means:

- if there is an active billing period, the club behaves as paid
- if there is no active billing period, the club no longer has paid entitlement unless a new paid period is created

So:

- `plan_type` controls future renewal behavior
- the active billing period controls current paid entitlement

This matches the intended “subscription like Amazon Prime” behavior:

- switching from `paid` to `free` cancels renewal
- but the club keeps paid behavior until the already-paid period ends

## Current Free / Paid Behavior

### Free

- member limit applies
- current limit comes from `FREE_PLAN_MEMBERS_LIMIT`

### Paid

- no member limit
- paid periods run from the same day of one month to the same day of the next month
- paid price comes from `PAID_PLAN_PRICE_EUR`

## Current Renewal Implementation

At the moment, renewal can still be resolved lazily in code as an interim step.

The intended long-term solution is a scheduled cron-based renewal process backed by `billing_periods`.

## Planned Long-Term Model

The app should introduce a separate `billing_periods` collection.

This collection will become the source of truth for paid-period history.

## Planned `billing_periods` Model

Each paid period should be stored as a separate record.

Suggested fields:

- `club_id`
- `period_start`
- `period_end`
- `status`
- `created_at`
- optional `source`

Suggested statuses:

- `active`
- `completed`
- `canceled`

Important invariant:

- there should be at most one active billing period per club

## Planned Billing Lifecycle

### 1. Club starts on Free

- no active billing period
- app behaves as free

### 2. Club enters Paid

- create a billing period
- set:
  - `period_start = today`
  - `period_end = same day next month`
  - `status = active`
- app behaves as paid

### 3. Paid club renews

When the current paid period ends:

- if `plan_type === paid`
  - mark current active billing period as `completed`
  - create a new active billing period

### 4. Club switches from Paid to Free before period ends

- do not shorten the already-active paid period
- do not create a future renewal period
- app continues behaving as paid until the active billing period ends
- after the period ends, app behaves as free

This is effectively:

- cancel renewal
- keep access until period end

### 5. Club switches from Free back to Paid

- if there is no active billing period
  - create a new active billing period starting now
- app behaves as paid again

## Monthly Renewal Rule

The paid subscription should behave like a normal monthly subscription:

- if a club stays on `paid`, it renews automatically
- each new billing period starts on the same calendar day stored as the previous period’s `period_end`
- the new billing period ends on the same calendar day in the following month

Examples:

- `2026-06-17` to `2026-07-17`
- `2026-07-17` to `2026-08-17`

`period_end` is the next renewal boundary, while the user-facing “bezahlt bis” date is derived as the day before that boundary.

This means the system should not model paid periods as a fixed number of days.

## Planned Cron Workflow

The preferred long-term renewal mechanism is a Vercel cron job.

Cron should:

- find clubs with `plan_type === paid`
- renew them when their active paid period ends
- create a new billing period for each new paid cycle
For clubs with `plan_type === free`:

- do not create new billing periods
- once the active paid period ends, renewal stops

## Relationship To Invoices

Invoices are intentionally not implemented yet in this document.

But this billing model is designed so invoices can later be generated from `billing_periods`.

That will be much more reliable than trying to infer invoice history from a denormalized field on the club document.
