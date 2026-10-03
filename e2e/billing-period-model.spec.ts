import { expect, test } from '@playwright/test';
import { Collection, ObjectId } from 'mongodb';
import {
  BillingPeriodDocument,
  InvoiceCounterDocument,
  processClubBillingRenewal,
} from '../api/_utils/_billingPeriods';
import { getProCancellationTerms } from '../api/_utils/_planCancellation';
import { ClubDocument } from '../api/_utils/_types';

function createCollections(club: ClubDocument, periods: BillingPeriodDocument[]) {
  const clubs = {
    findOne: async () => club,
    updateOne: async (_query: unknown, update: {$set: Partial<ClubDocument>}) => {
      Object.assign(club, update.$set);
      return {matchedCount: 1};
    },
  } as unknown as Collection<ClubDocument>;

  const billingPeriods = {
    findOne: async (query: {status?: string}) => periods.find(period =>
      !query.status || period.status === query.status
    ) ?? null,
    updateOne: async (query: {_id?: ObjectId}, update: {$set: Partial<BillingPeriodDocument>}) => {
      const period = periods.find(item => item._id?.equals(query._id));
      if (period) Object.assign(period, update.$set);
      return {matchedCount: period ? 1 : 0};
    },
    deleteMany: async (query: {plan_type?: string}) => {
      const retainedPeriods = periods.filter(period =>
        query.plan_type && period.plan_type !== query.plan_type
      );
      const deletedCount = periods.length - retainedPeriods.length;
      periods.splice(0, periods.length, ...retainedPeriods);
      return {deletedCount};
    },
    find: () => ({
      sort: () => ({
        limit: () => ({
          next: async () => [...periods].sort((left, right) =>
            right.period_end.localeCompare(left.period_end)
          )[0] ?? null,
        }),
      }),
    }),
    insertOne: async (period: BillingPeriodDocument) => {
      const insertedId = new ObjectId();
      periods.push({...period, _id: insertedId});
      return {insertedId};
    },
  } as unknown as Collection<BillingPeriodDocument>;

  const invoiceCounters = {
    findOneAndUpdate: async () => ({_id: 'invoice:2026', sequence: 1}),
  } as unknown as Collection<InvoiceCounterDocument>;

  return {clubs, billingPeriods, invoiceCounters};
}

test('Basic clubs do not receive billing periods', async () => {
  const club: ClubDocument = {
    _id: new ObjectId(),
    name: 'Basic Club',
    access_plan_type: 'basic',
    next_plan_type: 'basic',
    start_hour: 8,
    end_hour: 22,
    timezone: 'Europe/Berlin',
    max_reservation_duration: 2,
    reservations_limit: null,
    courts: [],
  };
  const periods: BillingPeriodDocument[] = [{
    _id: new ObjectId(),
    invoice_number: 'AZP20250000',
    club_id: club._id!.toString(),
    plan_type: 'basic',
    price: 0,
    anchor_day: 3,
    period_start: '2025-10-03',
    period_end: '2025-11-03',
    status: 'completed',
    created_at: new Date('2025-10-03T12:00:00Z'),
  }];
  const collections = createCollections(club, periods);

  const result = await processClubBillingRenewal(
    collections.clubs,
    collections.billingPeriods,
    collections.invoiceCounters,
    club,
    new Date('2026-10-03T12:00:00Z')
  );

  expect(result.currentBillingPeriod).toBeNull();
  expect(result.createdPeriods).toHaveLength(0);
  expect(periods).toHaveLength(0);
});

test('an expired Pro subscription switches to Basic without creating a Basic period', async () => {
  const club: ClubDocument = {
    _id: new ObjectId(),
    name: 'Canceling Club',
    access_plan_type: 'pro',
    next_plan_type: 'basic',
    start_hour: 8,
    end_hour: 22,
    timezone: 'Europe/Berlin',
    max_reservation_duration: 2,
    reservations_limit: null,
    courts: [],
  };
  const proPeriod: BillingPeriodDocument = {
    _id: new ObjectId(),
    invoice_number: 'AZP20250001',
    club_id: club._id!.toString(),
    plan_type: 'pro',
    price: 50,
    anchor_day: 3,
    period_start: '2025-10-03',
    period_end: '2026-10-03',
    status: 'active',
    created_at: new Date('2025-10-03T12:00:00Z'),
  };
  const periods = [proPeriod];
  const collections = createCollections(club, periods);

  const result = await processClubBillingRenewal(
    collections.clubs,
    collections.billingPeriods,
    collections.invoiceCounters,
    club,
    new Date('2026-10-04T12:00:00Z')
  );

  expect(club.access_plan_type).toBe('basic');
  expect(proPeriod.status).toBe('completed');
  expect(result.currentBillingPeriod).toBeNull();
  expect(result.createdPeriods).toHaveLength(0);
  expect(periods).toHaveLength(1);
});

test('legacy Pro clubs use the active Pro period start for refund eligibility', () => {
  const club = {
    access_plan_type: 'pro',
    next_plan_type: 'pro',
    timestamp: new Date('2020-01-01T12:00:00Z'),
  } as ClubDocument;
  const period = {
    plan_type: 'pro',
    price: 50,
    period_start: '2026-09-20',
    status: 'active',
  } as BillingPeriodDocument;

  const terms = getProCancellationTerms(
    club,
    period,
    new Date('2026-10-03T12:00:00Z')
  );

  expect(terms.refundEligible).toBe(true);
  expect(terms.refundAmount).toBe(50);
});
