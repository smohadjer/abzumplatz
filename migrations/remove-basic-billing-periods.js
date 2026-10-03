import process from 'node:process';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = process.env.db_name || 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const result = await client.db(databaseName).collection('billing_periods').deleteMany({
    plan_type: 'basic',
  });
  console.log(JSON.stringify({database: databaseName, deleted: result.deletedCount}));
} finally {
  await client.close();
}
