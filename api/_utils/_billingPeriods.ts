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

export type ProcessedClubBillingRenewal = ResolvedClubBillingState & {
    renewalApplied: boolean;
    completedPeriodsCount: number;
    createdPeriodsCount: number;
    createdPeriods: BillingPeriodDocument[];
}

export type ProcessedBillingRenewalsSummary = {
    totalClubsChecked: number;
    clubsRenewed: number;
    completedPeriodsCount: number;
    createdPeriodsCount: number;
}

export type ProcessedBillingRenewalClub = {
    club: ClubDocument;
    currentBillingPeriod: BillingPeriodDocument | null;
    completedPeriodsCount: number;
    createdPeriodsCount: number;
    createdPeriods: BillingPeriodDocument[];
}

export type ProcessedBillingRenewalsResult = {
    summary: ProcessedBillingRenewalsSummary;
    renewedClubs: ProcessedBillingRenewalClub[];
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

export async function getClubBillingState(
    billingPeriodsCollection: Collection<BillingPeriodDocument>,
    club: ClubDocument,
    now = new Date()
): Promise<ResolvedClubBillingState> {
    const clubId = club._id?.toString();
    if (!clubId) {
        return {
            club,
            currentBillingPeriod: null,
        };
    }

    const activePeriod = await getActiveBillingPeriod(billingPeriodsCollection, clubId);
    const currentBillingPeriod = activePeriod && hasFutureBillingPeriodEnd(activePeriod.period_end, now)
        ? activePeriod
        : null;

    return {
        club,
        currentBillingPeriod,
    };
}

export async function processClubBillingRenewal(
    clubsCollection: Collection<ClubDocument>,
    billingPeriodsCollection: Collection<BillingPeriodDocument>,
    club: ClubDocument,
    now = new Date()
): Promise<ProcessedClubBillingRenewal> {
    const clubId = club._id?.toString();
    let resolvedClub = club;
    let renewalApplied = false;
    let completedPeriodsCount = 0;
    let createdPeriodsCount = 0;
    const createdPeriods: BillingPeriodDocument[] = [];

    if (!clubId) {
        return {
            club: resolvedClub,
            currentBillingPeriod: null,
            renewalApplied,
            completedPeriodsCount,
            createdPeriodsCount,
            createdPeriods,
        };
    }

    let activePeriod = await getActiveBillingPeriod(billingPeriodsCollection, clubId);

    if (activePeriod && !hasFutureBillingPeriodEnd(activePeriod.period_end, now)) {
        renewalApplied = true;
        completedPeriodsCount += 1;
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
            renewalApplied,
            completedPeriodsCount,
            createdPeriodsCount,
            createdPeriods,
        };
    }

    const latestPeriod = await getLatestBillingPeriod(billingPeriodsCollection, clubId);
    if (!latestPeriod) {
        return {
            club: resolvedClub,
            currentBillingPeriod: null,
            renewalApplied,
            completedPeriodsCount,
            createdPeriodsCount,
            createdPeriods,
        };
    }

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
            renewalApplied = true;
            createdPeriodsCount += 1;
            const insertedPeriod = await insertBillingPeriod(billingPeriodsCollection, nextPeriod);
            createdPeriods.push(insertedPeriod);
            return {
                club: resolvedClub,
                currentBillingPeriod: insertedPeriod,
                renewalApplied,
                completedPeriodsCount,
                createdPeriodsCount,
                createdPeriods,
            };
        }

        renewalApplied = true;
        completedPeriodsCount += 1;
        createdPeriodsCount += 1;
        const insertedCompletedPeriod = await insertBillingPeriod(billingPeriodsCollection, {
            ...nextPeriod,
            status: 'completed'
        });
        createdPeriods.push(insertedCompletedPeriod);
        nextStartDate = new Date(`${nextPeriod.period_end}T12:00:00`);
    }
}

export async function processBillingRenewals(
    clubsCollection: Collection<ClubDocument>,
    billingPeriodsCollection: Collection<BillingPeriodDocument>,
    now = new Date()
): Promise<ProcessedBillingRenewalsResult> {
    const clubs = await clubsCollection.find({}).toArray();
    const summary: ProcessedBillingRenewalsSummary = {
        totalClubsChecked: clubs.length,
        clubsRenewed: 0,
        completedPeriodsCount: 0,
        createdPeriodsCount: 0,
    };
    const renewedClubs: ProcessedBillingRenewalClub[] = [];

    for (const club of clubs) {
        const result = await processClubBillingRenewal(
            clubsCollection,
            billingPeriodsCollection,
            club,
            now
        );

        if (!result.renewalApplied) {
            continue;
        }

        summary.clubsRenewed += 1;
        summary.completedPeriodsCount += result.completedPeriodsCount;
        summary.createdPeriodsCount += result.createdPeriodsCount;
        renewedClubs.push({
            club: result.club,
            currentBillingPeriod: result.currentBillingPeriod,
            completedPeriodsCount: result.completedPeriodsCount,
            createdPeriodsCount: result.createdPeriodsCount,
            createdPeriods: result.createdPeriods,
        });
    }

    return {
        summary,
        renewedClubs,
    };
}
