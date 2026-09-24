import process from 'node:process';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ quiet: true });
const DEFAULT_DATABASE_NAME = 'abzumplatz';
const INVOICE_NUMBER_PATTERN = /^AZP(\d{4})(\d+)$/;
const MISSING_INVOICE_NUMBER = {
  $or: [
    { invoice_number: { $exists: false } },
    { invoice_number: null },
    { invoice_number: '' },
  ],
};

function getInvoiceYear(value) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(value);
}

function getBillingPeriodIssueDate(period) {
  if (period.created_at instanceof Date && !Number.isNaN(period.created_at.getTime())) {
    return period.created_at;
  }

  if (period._id?.getTimestamp) {
    return period._id.getTimestamp();
  }

  throw new Error(`Billing period ${period._id?.toString() ?? 'unknown'} has no valid issue date.`);
}

async function synchronizeCounters(billingPeriods, invoiceCounters) {
  const existingNumbers = await billingPeriods.find(
    { invoice_number: { $type: 'string' } },
    { projection: { invoice_number: 1 } }
  ).toArray();
  const maximumSequenceByYear = new Map();

  for (const period of existingNumbers) {
    const match = INVOICE_NUMBER_PATTERN.exec(period.invoice_number);
    if (!match) {
      continue;
    }

    const [, year, sequenceValue] = match;
    const sequence = Number(sequenceValue);
    maximumSequenceByYear.set(
      year,
      Math.max(maximumSequenceByYear.get(year) ?? 0, sequence)
    );
  }

  for (const [year, sequence] of maximumSequenceByYear) {
    await invoiceCounters.updateOne(
      { _id: `invoice:${year}` },
      { $max: { sequence } },
      { upsert: true }
    );
  }
}

async function allocateInvoiceNumber(invoiceCounters, issueDate) {
  const year = getInvoiceYear(issueDate);
  const counter = await invoiceCounters.findOneAndUpdate(
    { _id: `invoice:${year}` },
    { $inc: { sequence: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  if (!counter) {
    throw new Error(`Could not allocate an invoice number for ${year}.`);
  }

  return `AZP${year}${counter.sequence.toString().padStart(4, '0')}`;
}

async function main() {
  const uri = process.env.db_uri;
  const dbName = process.env.db_name || DEFAULT_DATABASE_NAME;

  if (!uri) {
    throw new Error('Missing db_uri. Add it to .env or your environment.');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db(dbName);
    const billingPeriods = database.collection('billing_periods');
    const invoiceCounters = database.collection('invoice_counters');
    const periods = await billingPeriods.find(MISSING_INVOICE_NUMBER)
      .sort({ created_at: 1, _id: 1 })
      .toArray();

    await synchronizeCounters(billingPeriods, invoiceCounters);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const period of periods) {
      const invoiceNumber = await allocateInvoiceNumber(
        invoiceCounters,
        getBillingPeriodIssueDate(period)
      );
      const result = await billingPeriods.updateOne(
        {
          _id: period._id,
          ...MISSING_INVOICE_NUMBER,
        },
        {
          $set: {
            invoice_number: invoiceNumber,
          },
        }
      );

      if (result.modifiedCount === 1) {
        updatedCount += 1;
        console.log(`Assigned ${invoiceNumber} to billing period ${period._id}.`);
      } else {
        skippedCount += 1;
      }
    }

    console.log(`Done. Updated ${updatedCount} billing period(s); skipped ${skippedCount}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
