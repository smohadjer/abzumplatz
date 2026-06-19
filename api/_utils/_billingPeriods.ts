import { Collection, ObjectId } from 'mongodb';
import { PlanType } from '../../src/types.js';
import { getNextBillingPeriodStartForPlan, getPlanLevel, hasFutureBillingPeriodEnd, isPaidPlanType } from '../../src/planConfig.js';
import { ClubDocument } from './_types.js';

export type BillingPeriodStatus = 'active' | 'completed' | 'canceled';
export type PaidPlanType = Exclude<PlanType, 'basic'>;

export type BillingPeriodDocument = {
    _id?: ObjectId;
    club_id: string;
    plan_type: PaidPlanType;
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

function withDerivedBilledPlan(
    club: ClubDocument,
    currentBillingPeriod: BillingPeriodDocument | null
): ClubDocument {
    return {
        ...club,
        plan_type: currentBillingPeriod?.plan_type ?? 'basic',
    };
}

function getDateString(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPaidPlanType(planType?: PlanType): PaidPlanType {
    return planType === 'elite' ? 'elite' : 'pro';
}

function createBillingPeriodRecord(
    clubId: string,
    planType: PlanType,
    startDate: Date,
    status: BillingPeriodStatus,
    source?: string
): BillingPeriodDocument {
    const paidPlanType = getPaidPlanType(planType);

    return {
        club_id: clubId,
        plan_type: paidPlanType,
        period_start: getDateString(startDate),
        period_end: getNextBillingPeriodStartForPlan(paidPlanType, startDate)!,
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

export function getCurrentAccessPlanType(club: ClubDocument) {
    return club.access_plan_type ?? club.next_plan_type ?? 'basic';
}

export function getSelectedPlanType(club: ClubDocument) {
    return club.next_plan_type ?? getCurrentAccessPlanType(club) ?? 'basic';
}

export function normalizeClubPlanState(club: ClubDocument): ClubDocument {
    const access_plan_type = club.access_plan_type ?? club.next_plan_type ?? club.plan_type ?? 'basic';
    const next_plan_type = club.next_plan_type ?? access_plan_type;

    return {
        ...club,
        access_plan_type,
        next_plan_type,
    };
}

export function isDowngradeLocked(
    club: ClubDocument,
    currentBillingPeriod: BillingPeriodDocument | null
) {
    if (!currentBillingPeriod) {
        return false;
    }

    const normalizedClub = normalizeClubPlanState(club);
    const accessPlanType = getCurrentAccessPlanType(normalizedClub);
    const billedPlanType = currentBillingPeriod?.plan_type ?? 'basic';
    return getPlanLevel(accessPlanType) > getPlanLevel(billedPlanType);
}

export async function createInitialBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string,
    planType: PlanType,
    source?: string,
    startDate = new Date()
) {
    return insertBillingPeriod(
        collection,
        createBillingPeriodRecord(clubId, planType, startDate, 'active', source)
    );
}

export async function resolveClubBillingState(
    clubsCollection: Collection<ClubDocument>,
    billingPeriodsCollection: Collection<BillingPeriodDocument>,
    club: ClubDocument,
    now = new Date()
): Promise<ResolvedClubBillingState> {
    const clubId = club._id?.toString();
    let resolvedClub = normalizeClubPlanState(club);

    if (!clubId) {
        return {
            club: withDerivedBilledPlan(resolvedClub, null),
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
            {
                access_plan_type: resolvedClub.next_plan_type,
                next_plan_type: resolvedClub.next_plan_type,
            }
        );
    }

    const selectedPlanType = getSelectedPlanType(resolvedClub);

    if (!isPaidPlanType(selectedPlanType)) {
        return {
            club: withDerivedBilledPlan(resolvedClub, activePeriod),
            currentBillingPeriod: activePeriod,
        };
    }

    if (activePeriod) {
        return {
            club: withDerivedBilledPlan(resolvedClub, activePeriod),
            currentBillingPeriod: activePeriod,
        };
    }

    const latestPeriod = await getLatestBillingPeriod(billingPeriodsCollection, clubId);
    let nextStartDate = latestPeriod?.period_end
        ? new Date(`${latestPeriod.period_end}T12:00:00`)
        : now;

    while (true) {
        const nextPeriod = createBillingPeriodRecord(
            clubId,
            selectedPlanType,
            nextStartDate,
            'active',
            'renewal'
        );

        if (hasFutureBillingPeriodEnd(nextPeriod.period_end, now)) {
            const insertedPeriod = await insertBillingPeriod(billingPeriodsCollection, nextPeriod);
            return {
                club: withDerivedBilledPlan(resolvedClub, insertedPeriod),
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
