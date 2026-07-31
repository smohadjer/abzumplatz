import process from 'node:process';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ quiet: true });
const DEFAULT_DATABASE_NAME = 'abzumplatz';

const PRICE_BY_PLAN = {
  basic: 0,
};

async function main() {
  const uri = process.env.db_uri;
  const dbName = process.env.db_name || DEFAULT_DATABASE_NAME;

  if (!uri) {
    throw new Error('Missing db_uri. Add it to .env or your environment.');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const collection = client.db(dbName).collection('billing_periods');
    const ambiguousProPeriodsCount = await collection.countDocuments({
      plan_type: 'pro',
      $or: [
        { price: { $exists: false } },
        { price: null },
      ],
    });

    if (ambiguousProPeriodsCount > 0) {
      throw new Error(
        `Cannot safely backfill ${ambiguousProPeriodsCount} Pro billing period(s): ` +
        'the Pro identifier covers legacy Pro, migrated Elite, and current Pro prices. ' +
        'Resolve these records from their original invoices or another authoritative source.'
      );
    }

    let updatedCount = 0;

    for (const [planType, price] of Object.entries(PRICE_BY_PLAN)) {
      const result = await collection.updateMany(
        {
          plan_type: planType,
          $or: [
            { price: { $exists: false } },
            { price: null },
          ],
        },
        {
          $set: {
            price,
          },
        }
      );

      updatedCount += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} ${planType} billing period(s) to price ${price}.`);
    }

    console.log(`Done. Updated ${updatedCount} billing period(s) in total.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
