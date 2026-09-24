import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const tournaments = client.db(databaseName).collection('tournaments');
  const drafts = await tournaments.updateMany(
    {status: {$in: ['draft', 'cancelled']}},
    {$set: {status: 'draft'}}
  );
  const published = await tournaments.updateMany(
    {status: {$in: ['registration_open', 'registration_closed', 'in_progress', 'completed']}},
    {$set: {status: 'published'}}
  );

  console.log(`Kept ${drafts.matchedCount} draft or cancelled tournaments as drafts.`);
  console.log(`Migrated ${published.modifiedCount} tournaments to published.`);
} finally {
  await client.close();
}
