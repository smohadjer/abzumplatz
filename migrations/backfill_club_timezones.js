/*
Run from the project root:

  node migrations/backfill_club_timezones.js --dry-run
  node migrations/backfill_club_timezones.js

This backfills missing club `timezone` values with the current default
club timezone used by the application.
*/

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const databaseName = 'abzumplatz';
const databaseUri = process.env.db_uri;
const dryRun = process.argv.includes('--dry-run');
const defaultTimeZone = 'Europe/Berlin';

if (!databaseUri) {
  throw new Error('Missing db_uri environment variable');
}

const client = new MongoClient(databaseUri);

async function run() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const clubs = database.collection('clubs');
    const cursor = clubs.find({
      $or: [
        { timezone: { $exists: false } },
        { timezone: null },
        { timezone: '' }
      ]
    });

    let matchedCount = 0;
    let modifiedCount = 0;

    for await (const club of cursor) {
      matchedCount += 1;

      if (dryRun) {
        console.log(`Would update club ${club._id}: timezone=${JSON.stringify(defaultTimeZone)}`);
        continue;
      }

      const result = await clubs.updateOne(
        { _id: club._id },
        {
          $set: { timezone: defaultTimeZone }
        }
      );
      modifiedCount += result.modifiedCount;
    }

    console.log(JSON.stringify({
      dryRun,
      defaultTimeZone,
      matchedCount,
      modifiedCount
    }, null, 2));
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
