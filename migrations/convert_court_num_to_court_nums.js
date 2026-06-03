/*
Run from the project root:

  node migrations/convert_court_num_to_court_nums.js --dry-run
  node migrations/convert_court_num_to_court_nums.js

This backfills canonical `court_nums` from legacy `court_num`.
It intentionally keeps `court_num` in place for a safer rollout.
*/

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const databaseName = 'abzumplatz';
const databaseUri = process.env.db_uri;
const dryRun = process.argv.includes('--dry-run');

if (!databaseUri) {
  throw new Error('Missing db_uri environment variable');
}

const client = new MongoClient(databaseUri);

const getCourtNums = (reservation) => {
  if (Array.isArray(reservation.court_nums) && reservation.court_nums.length) {
    return [...new Set(reservation.court_nums.map((courtNum) => courtNum.toString()))];
  }

  if (reservation.court_num !== undefined && reservation.court_num !== null) {
    return [reservation.court_num.toString()];
  }

  return [];
};

async function run() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const reservations = database.collection('reservations');
    const cursor = reservations.find({
      court_num: { $exists: true }
    });

    let matchedCount = 0;
    let modifiedCount = 0;
    let skippedCount = 0;

    for await (const reservation of cursor) {
      matchedCount += 1;
      const courtNums = getCourtNums(reservation);

      if (!courtNums.length) {
        skippedCount += 1;
        console.warn(`Skipping reservation ${reservation._id}: no court number found`);
        continue;
      }

      if (dryRun) {
        console.log(`Would update reservation ${reservation._id}: court_nums=${JSON.stringify(courtNums)}`);
        continue;
      }

      const result = await reservations.updateOne(
        { _id: reservation._id },
        {
          $set: { court_nums: courtNums }
        }
      );
      modifiedCount += result.modifiedCount;
    }

    console.log(JSON.stringify({
      dryRun,
      matchedCount,
      modifiedCount,
      skippedCount
    }, null, 2));
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
