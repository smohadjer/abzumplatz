import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const registrations = client.db(databaseName).collection('tournament_registrations');
  const legacyRegistrations = await registrations.find({
    $or: [{user_id: {$exists: true}}, {partner_user_id: {$exists: true}}],
  }).toArray();

  let migrated = 0;
  for (const registration of legacyRegistrations) {
    const userIds = [...new Set([registration.user_id, registration.partner_user_id]
      .filter(userId => typeof userId === 'string' && userId))];
    if (!userIds.length) continue;
    await registrations.updateOne(
      {_id: registration._id},
      {$set: {user_ids: userIds}, $unset: {user_id: '', partner_user_id: ''}}
    );
    migrated += 1;
  }

  console.log(JSON.stringify({database: databaseName, migrated}));
} finally {
  await client.close();
}
