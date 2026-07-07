import { Collection, ObjectId } from 'mongodb';
import { PlanType } from '../../src/types.js';
import { getNextBillingPeriodStartForPlan, hasFutureBillingPeriodEnd } from '../../src/planConfig.js';
import { ClubDocument } from './_types.js';
import {
    getPlanStateAtRenewal,
} from './_planTransitions.js';
import { getPlanLevel } from '../../src/planConfig.js';

export type BillingPeriodStatus = 'active' | 'completed' | 'canceled';

export type BillingPeriodDocument = {
    _id?: ObjectId;
    club_id: string;
    plan_type: PlanType;
    anchor_day: number;
    period_start: string;
    period_end: string;
    status: BillingPeriodStatus;
    created_at: Date;
    source?: string;
}

type ResolvedClubBillingState = {
    club: ClubDocument;
    currentBillingPeriod: BillingPeriodDocument | null;
}

function getDateString(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createBillingPeriodRecord(
    clubId: string,
    planType: PlanType,
    startDate: Date,
    status: BillingPeriodStatus,
    source?: string,
    anchorDay = startDate.getDate()
): BillingPeriodDocument {
    return {
        club_id: clubId,
        plan_type: planType,
        anchor_day: anchorDay,
        period_start: getDateString(startDate),
        period_end: getNextBillingPeriodStartForPlan(planType, startDate, anchorDay)!,
        status,
        created_at: new Date(),
        ...(source ? {source} : {})
    };
}

async function insertBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    period: BillingPeriodDocument
) {
    await collection.insertOne(period);
    return period;
}

async function getLatestBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string
) {
    return collection.find({club_id: clubId})
        .sort({period_end: -1, created_at: -1})
        .limit(1)
        .next();
}

async function getActiveBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string
) {
    return collection.findOne({
        club_id: clubId,
        status: 'active'
    });
}

async function updateBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    periodId: ObjectId | undefined,
    fields: Partial<BillingPeriodDocument>
) {
    if (!periodId) {
        return;
    }

    await collection.updateOne(
        {_id: periodId},
        {$set: fields}
    );
}

async function updateClubPlanState(
    clubsCollection: Collection<ClubDocument>,
    club: ClubDocument,
    fields: Partial<ClubDocument>
) {
    if (!club._id) {
        return {
            ...club,
            ...fields,
        };
    }

    await clubsCollection.updateOne(
        {_id: club._id},
        {
            $set: fields,
        }
    );

    return {
        ...club,
        ...fields,
    };
}

export function isDowngradeLocked(
    club: ClubDocument,
    currentBillingPeriod: BillingPeriodDocument | null
) {
    if (!currentBillingPeriod) {
        return false;
    }

    return getPlanLevel(club.access_plan_type) > getPlanLevel(currentBillingPeriod.plan_type);
}

export async function createInitialBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string,
    planType: PlanType,
    source?: string,
    startDate = new Date(),
    anchorDay = startDate.getDate()
) {
    return insertBillingPeriod(
        collection,
        createBillingPeriodRecord(clubId, planType, startDate, 'active', source, anchorDay)
    );
}

// Resolves the club's current billing state and lazily advances renewals by
// completing expired periods, updating the club plan state, and creating the
// next active billing period when needed.
export async function resolveClubBillingState(
    clubsCollection: Collection<ClubDocument>,
    billingPeriodsCollection: Collection<BillingPeriodDocument>,
    club: ClubDocument,
    now = new Date()
): Promise<ResolvedClubBillingState> {
    const clubId = club._id?.toString();
    let resolvedClub = club;

    if (!clubId) {
        return {
            club: resolvedClub,
            currentBillingPeriod: null,
        };
    }

    let activePeriod = await getActiveBillingPeriod(billingPeriodsCollection, clubId);

    if (activePeriod && !hasFutureBillingPeriodEnd(activePeriod.period_end, now)) {
        await updateBillingPeriod(billingPeriodsCollection, activePeriod._id, {
            status: 'completed'
        });
        activePeriod = null;

        resolvedClub = await updateClubPlanState(
            clubsCollection,
            resolvedClub,
            getPlanStateAtRenewal(resolvedClub.next_plan_type)
        );
    }

    if (activePeriod) {
        return {
            club: resolvedClub,
            currentBillingPeriod: activePeriod,
        };
    }

    const latestPeriod = await getLatestBillingPeriod(billingPeriodsCollection, clubId);
    let nextStartDate = latestPeriod?.period_end
        ? new Date(`${latestPeriod.period_end}T12:00:00`)
        : now;
    const anchorDay = latestPeriod?.anchor_day
        ?? (latestPeriod?.period_start
            ? new Date(`${latestPeriod.period_start}T12:00:00`).getDate()
            : nextStartDate.getDate());

    while (true) {
        const nextPeriod = createBillingPeriodRecord(
            clubId,
            resolvedClub.next_plan_type,
            nextStartDate,
            'active',
            'renewal',
            anchorDay
        );

        if (hasFutureBillingPeriodEnd(nextPeriod.period_end, now)) {
            const insertedPeriod = await insertBillingPeriod(billingPeriodsCollection, nextPeriod);
            return {
                club: resolvedClub,
                currentBillingPeriod: insertedPeriod,
            };
        }

        await insertBillingPeriod(billingPeriodsCollection, {
            ...nextPeriod,
            status: 'completed'
        });
        nextStartDate = new Date(`${nextPeriod.period_end}T12:00:00`);
    }
}
