import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const result = await client.db(databaseName).collection('tournaments').updateMany(
    {group_participants_limit: {$exists: true}},
    {$unset: {group_participants_limit: ''}}
  );
  console.log(JSON.stringify({database: databaseName, modified: result.modifiedCount}));
} finally {
  await client.close();
}
