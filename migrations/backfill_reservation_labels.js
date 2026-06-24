/*
Run from the project root:

  node migrations/backfill_reservation_labels.js --dry-run
  node migrations/backfill_reservation_labels.js

This backfills missing reservation labels from the reservation owner's name
using the existing UI format: "Firstname Lastname".
*/

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const databaseName = 'abzumplatz';
const databaseUri = process.env.db_uri;
const dryRun = process.argv.includes('--dry-run');

if (!databaseUri) {
  throw new Error('Missing db_uri environment variable');
}

const client = new MongoClient(databaseUri);

const capitalizeName = (value) => {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getReservationLabel = (user) => {
  return [
    capitalizeName(user.first_name),
    capitalizeName(user.last_name)
  ].filter(Boolean).join(' ');
};

const getUserObjectId = (userId) => {
  try {
    return ObjectId.createFromHexString(userId);
  } catch {
    return null;
  }
};

const getIsoDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

async function run() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const reservations = database.collection('reservations');
    const users = database.collection('users');
    const today = getIsoDateString(new Date());
    const cursor = reservations.find({
      $and: [
        {
          $or: [
            { label: { $exists: false } },
            { label: null },
            { label: '' }
          ]
        },
        {
          $or: [
            { date: { $gte: today } },
            {
              recurring: true,
              $or: [
                { end_date: { $exists: false } },
                { end_date: null },
                { end_date: { $gt: today } }
              ]
            }
          ]
        }
      ]
    });

    let matchedCount = 0;
    let modifiedCount = 0;
    let skippedCount = 0;

    for await (const reservation of cursor) {
      matchedCount += 1;

      if (!reservation.user_id || typeof reservation.user_id !== 'string') {
        skippedCount += 1;
        console.warn(`Skipping reservation ${reservation._id}: missing or invalid user_id`);
        continue;
      }

      const userObjectId = getUserObjectId(reservation.user_id);
      if (!userObjectId) {
        skippedCount += 1;
        console.warn(`Skipping reservation ${reservation._id}: invalid user_id ${reservation.user_id}`);
        continue;
      }

      const user = await users.findOne({ _id: userObjectId });
      if (!user) {
        skippedCount += 1;
        console.warn(`Skipping reservation ${reservation._id}: user not found`);
        continue;
      }

      const label = getReservationLabel(user);
      if (!label) {
        skippedCount += 1;
        console.warn(`Skipping reservation ${reservation._id}: unable to derive label from user`);
        continue;
      }

      if (dryRun) {
        console.log(`Would update reservation ${reservation._id}: label=${JSON.stringify(label)}`);
        continue;
      }

      const result = await reservations.updateOne(
        { _id: reservation._id },
        {
          $set: { label }
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
