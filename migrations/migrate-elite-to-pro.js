import process from 'node:process';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ quiet: true });
const DEFAULT_DATABASE_NAME = 'abzumplatz';

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
    const clubs = database.collection('clubs');
    const billingPeriods = database.collection('billing_periods');

    const [
      clubsWithExistingProAccess,
      clubsWithExistingProNextPlan,
      existingProBillingPeriods,
      clubsWithEliteAccess,
      clubsWithEliteNextPlan,
      eliteBillingPeriods,
    ] = await Promise.all([
      clubs.countDocuments({ access_plan_type: 'pro' }),
      clubs.countDocuments({ next_plan_type: 'pro' }),
      billingPeriods.countDocuments({ plan_type: 'pro' }),
      clubs.countDocuments({ access_plan_type: 'elite' }),
      clubs.countDocuments({ next_plan_type: 'elite' }),
      billingPeriods.countDocuments({ plan_type: 'elite' }),
    ]);

    const [clubResult, billingPeriodResult] = await Promise.all([
      clubs.updateMany(
        {
          $or: [
            { access_plan_type: 'elite' },
            { next_plan_type: 'elite' },
          ],
        },
        [
          {
            $set: {
              access_plan_type: {
                $cond: [{ $eq: ['$access_plan_type', 'elite'] }, 'pro', '$access_plan_type'],
              },
              next_plan_type: {
                $cond: [{ $eq: ['$next_plan_type', 'elite'] }, 'pro', '$next_plan_type'],
              },
            },
          },
        ]
      ),
      billingPeriods.updateMany(
        { plan_type: 'elite' },
        { $set: { plan_type: 'pro' } }
      ),
    ]);

    const [remainingEliteClubs, remainingEliteBillingPeriods] = await Promise.all([
      clubs.countDocuments({
        $or: [
          { access_plan_type: 'elite' },
          { next_plan_type: 'elite' },
        ],
      }),
      billingPeriods.countDocuments({ plan_type: 'elite' }),
    ]);

    console.log(JSON.stringify({
      database: dbName,
      policy: 'Legacy Pro and Elite memberships are consolidated into the new Pro plan. Existing billing-period price snapshots are preserved; the next renewal uses the current Pro price.',
      found: {
        clubsWithExistingProAccess,
        clubsWithExistingProNextPlan,
        existingProBillingPeriods,
        clubsWithEliteAccess,
        clubsWithEliteNextPlan,
        eliteBillingPeriods,
      },
      modified: {
        clubs: clubResult.modifiedCount,
        billingPeriods: billingPeriodResult.modifiedCount,
      },
      remaining: {
        clubs: remainingEliteClubs,
        billingPeriods: remainingEliteBillingPeriods,
      },
    }, null, 2));

    if (remainingEliteClubs > 0 || remainingEliteBillingPeriods > 0) {
      throw new Error('Migration verification failed: elite plan references remain.');
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
