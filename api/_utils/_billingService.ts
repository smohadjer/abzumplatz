import { Collection, Db } from 'mongodb';
import { PlanType } from '../../src/types.js';
import {
  BillingPeriodDocument,
  createInitialBillingPeriod,
  insertBillingPeriod,
  InvoiceCounterDocument,
  NewBillingPeriodDocument,
  processBillingRenewals,
  ProcessedBillingRenewalsResult,
  processClubBillingRenewal,
} from './_billingPeriods.js';
import {
  BillingInvoiceNotificationType,
  sendBillingPeriodInvoiceEmail,
} from './_billingInvoices.js';
import { ClubDocument } from './_types.js';

export class BillingPeriodInvoiceDeliveryError extends Error {
  period: BillingPeriodDocument;

  constructor(period: BillingPeriodDocument, cause: unknown) {
    super(`Billing period ${period._id?.toString() ?? 'unknown'} was created, but its invoice email could not be delivered.`, {
      cause,
    });
    this.name = 'BillingPeriodInvoiceDeliveryError';
    this.period = period;
  }
}

async function sendCreatedPeriodInvoices(
  database: Db,
  club: ClubDocument,
  periods: BillingPeriodDocument[],
  notificationType: BillingInvoiceNotificationType
) {
  const results = await Promise.allSettled(periods.map(period =>
    sendBillingPeriodInvoiceEmail(database, club, period, notificationType)
  ));
  const failures = results.filter((result): result is PromiseRejectedResult =>
    result.status === 'rejected'
  );

  if (failures.length) {
    throw new AggregateError(
      failures.map(result => result.reason),
      `Invoice email delivery failed for ${failures.length} billing period(s).`
    );
  }
}

export async function createInitialBillingPeriodAndSendInvoice(
  database: Db,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
  club: ClubDocument,
  clubId: string,
  planType: PlanType,
  source?: string,
  startDate = new Date(),
  anchorDay = startDate.getDate(),
  notificationType: Extract<BillingInvoiceNotificationType, 'initial' | 'repair'> = 'initial'
) {
  const period = await createInitialBillingPeriod(
    billingPeriodsCollection,
    invoiceCountersCollection,
    clubId,
    planType,
    source,
    startDate,
    anchorDay
  );
  try {
    await sendBillingPeriodInvoiceEmail(database, club, period, notificationType);
  } catch (error) {
    throw new BillingPeriodInvoiceDeliveryError(period, error);
  }
  return period;
}

export async function createManualBillingPeriodAndSendInvoice(
  database: Db,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
  club: ClubDocument,
  period: NewBillingPeriodDocument
) {
  const insertedPeriod = await insertBillingPeriod(
    billingPeriodsCollection,
    invoiceCountersCollection,
    period
  );
  try {
    await sendBillingPeriodInvoiceEmail(database, club, insertedPeriod, 'manual');
  } catch (error) {
    throw new BillingPeriodInvoiceDeliveryError(insertedPeriod, error);
  }
  return insertedPeriod;
}

export async function processClubBillingRenewalAndSendInvoices(
  database: Db,
  clubsCollection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
  club: ClubDocument,
  now = new Date()
) {
  const result = await processClubBillingRenewal(
    clubsCollection,
    billingPeriodsCollection,
    invoiceCountersCollection,
    club,
    now
  );
  await sendCreatedPeriodInvoices(database, result.club, result.createdPeriods, 'renewal');
  return result;
}

export async function processBillingRenewalsAndSendInvoices(
  database: Db,
  clubsCollection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
  now = new Date()
): Promise<ProcessedBillingRenewalsResult & { failedInvoiceDeliveries: PromiseRejectedResult[] }> {
  const result = await processBillingRenewals(
    clubsCollection,
    billingPeriodsCollection,
    invoiceCountersCollection,
    now
  );
  const deliveries = await Promise.allSettled(
    result.renewedClubs.flatMap(({club, createdPeriods}) =>
      createdPeriods.map(period =>
        sendBillingPeriodInvoiceEmail(database, club, period, 'renewal')
      )
    )
  );

  return {
    ...result,
    failedInvoiceDeliveries: deliveries.filter(
      (delivery): delivery is PromiseRejectedResult => delivery.status === 'rejected'
    ),
  };
}
