# Billing

This document describes how billing works in the app today.

## Plans

The app currently supports three plans:

- `basic`
- `pro`
- `elite`

Shared plan configuration lives in [src/planConfig.ts](/Users/sm/Documents/abzumplatz/src/planConfig.ts).

Relevant config entries:

- `PLAN_CONFIG.basic`
- `PLAN_CONFIG.pro`
- `PLAN_CONFIG.elite`

Plan behavior:

`basic`

- free plan
- limited to the configured `membersLimit`

`pro`

- paid plan
- costs the configured `price`
- renews every configured `durationMonths`
- limited to the configured `membersLimit`

`elite`

- paid plan
- costs the configured `price`
- renews every configured `durationMonths`
- no member limit

## Core Rules

The app keeps billing periods stable when a club changes plan.

That means:

- the current billing period keeps its original `period_start`
- the current billing period keeps its original `period_end`
- plan changes do not create a new billing boundary in the middle of the current period

For clubs on a paid plan:

- upgrades unlock better access immediately
- upgrades during an existing paid period are billed from the next billing period
- downgrades do not reduce access during an already paid period

## Billing Periods

The `billing_periods` collection is the source of truth for paid billing history.

Each billing period stores:

- `club_id`
- `plan_type`
- `period_start`
- `period_end`
- `status`
- `created_at`
- optional `source`

Rules:

- there is at most one active billing period per club
- billing period dates stay fixed once the period has started
- the billed plan for the running period stays attached to that billing period

## Monthly Renewal Boundary

Paid billing periods are month-based and anchored to the same calendar day.

Rule:

- a billing period starts on a calendar day
- the next billing period starts on the same day in the next month
- `period_end` is the renewal boundary

Example:

- `period_start = 2026-06-19`
- `period_end = 2026-07-19`

This means:

- the current paid period runs through `2026-07-18`
- the next billing period starts on `2026-07-19`

If the same day does not exist in the next month, the last valid day of that month is used.

## Club Plan State

Each club stores three plan-related fields:

- `plan_type`
- `access_plan_type`
- `next_plan_type`

Meaning:

`plan_type`

- the plan billed for the current running billing period

`access_plan_type`

- the plan whose features are active right now
- this can be higher than `plan_type` after an upgrade

`next_plan_type`

- the plan that should apply at the next renewal
- this field is always stored on the club document
- if no plan change is scheduled, it matches the plan that should continue next

In practice:

- `plan_type` = billed plan of the current period
- `access_plan_type` = active access plan now
- `next_plan_type` = plan used at the next renewal

## Registration

When a club is created:

- if `plan_type = basic`, no billing period is created
- if `plan_type = pro` or `plan_type = elite`, the first active billing period is created immediately

## Renewal

At renewal time:

- the current billing period ends
- the next billing period starts on the same renewal boundary
- the club switches to `next_plan_type`

If `next_plan_type` is paid:

- a new paid billing period is created

If `next_plan_type = basic`:

- no new paid billing period is created

## Upgrades

If a club upgrades from `basic` to `pro` or `elite`, or from `pro` to `elite`:

- upgraded access starts immediately
- if the club comes from `basic`, the first paid billing period starts immediately
- the current billing period boundary does not move
- if the club upgrades during an existing paid period, the higher price is charged only from the next billing period
- after an upgrade within an existing paid period, a downgrade to a cheaper plan is blocked until the next billing period starts

Example:

- current `Pro` period: `2026-06-19` to `2026-07-19`
- on `2026-07-18` the club upgrades to `Elite`

Result:

- the club gets `Elite` access immediately on `2026-07-18`
- the current billing period still ends on `2026-07-19`
- the next billing period starting `2026-07-19` is billed as `Elite`
- the club cannot switch back to `Pro` before `2026-07-19`

## Downgrades

If a club downgrades from `elite` to `pro`, or from a paid plan to `basic`:

- the downgrade takes effect at period end
- current paid access remains unchanged until the current billing period finishes
- the next billing period uses the downgraded plan, or no paid plan if switching to `basic`

Example:

- current `Elite` period: `2026-06-19` to `2026-07-19`
- on `2026-07-05` the club switches to `Pro`

Result:

- the club keeps `Elite` access until `2026-07-19`
- the next billing period starting `2026-07-19` is billed as `Pro`

If switching to `basic`:

- the club keeps current paid access until the current paid period ends
- after that, no new paid billing period is created

## Invoicing

Invoices are based on whole billing periods.

Rules:

- one invoice covers one full billing period
- invoices are not split because of a mid-period plan change
- the invoice for the current period is based on the plan billed for that period
- the next invoice uses the plan that becomes effective at renewal

## Member Limits

Member limits apply to total club members, not only active members.

Current rules:

- `basic`: up to 100 members
- `pro`: up to 500 members
- `elite`: no limit
