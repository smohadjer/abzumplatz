import { Collection, ObjectId } from 'mongodb';
import { getNextBillingPeriodStartForPlan, hasFutureBillingPeriodEnd } from '../../src/planConfig.js';

export type BillingPeriodStatus = 'active' | 'completed' | 'canceled';

export type BillingPeriodDocument = {
    _id?: ObjectId;
    club_id: string;
    period_start: string;
    period_end: string;
    status: BillingPeriodStatus;
    created_at: Date;
    source?: string;
}

function getDateString(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createBillingPeriodRecord(
    clubId: string,
    startDate: Date,
    status: BillingPeriodStatus,
    source?: string
): BillingPeriodDocument {
    return {
        club_id: clubId,
        period_start: getDateString(startDate),
        period_end: getNextBillingPeriodStartForPlan('paid', startDate)!,
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

async function markBillingPeriodStatus(
    collection: Collection<BillingPeriodDocument>,
    periodId: ObjectId | undefined,
    status: BillingPeriodStatus
) {
    if (!periodId) {
        return;
    }

    await collection.updateOne(
        {_id: periodId},
        {$set: {status}}
    );
}

export async function createInitialBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string,
    source?: string,
    startDate = new Date()
) {
    return insertBillingPeriod(
        collection,
        createBillingPeriodRecord(clubId, startDate, 'active', source)
    );
}

export async function resolveCurrentBillingPeriod(
    collection: Collection<BillingPeriodDocument>,
    clubId: string,
    planType?: 'free' | 'paid',
    now = new Date()
) {
    let activePeriod = await getActiveBillingPeriod(collection, clubId);

    if (activePeriod && !hasFutureBillingPeriodEnd(activePeriod.period_end, now)) {
        await markBillingPeriodStatus(collection, activePeriod._id, 'completed');
        activePeriod = null;
    }

    if (planType !== 'paid') {
        return activePeriod;
    }

    if (activePeriod) {
        return activePeriod;
    }

    const latestPeriod = await getLatestBillingPeriod(collection, clubId);
    let nextStartDate = latestPeriod?.period_end
        ? new Date(`${latestPeriod.period_end}T12:00:00`)
        : now;

    while (true) {
        const nextPeriod = createBillingPeriodRecord(
            clubId,
            nextStartDate,
            'active',
            'renewal'
        );

        if (hasFutureBillingPeriodEnd(nextPeriod.period_end, now)) {
            return insertBillingPeriod(collection, nextPeriod);
        }

        await insertBillingPeriod(collection, {
            ...nextPeriod,
            status: 'completed'
        });
        nextStartDate = new Date(`${nextPeriod.period_end}T12:00:00`);
    }
}
