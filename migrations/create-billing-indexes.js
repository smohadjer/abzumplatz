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
  const collection = client.db(databaseName).collection('billing_periods');
  const duplicateActivePeriods = await collection.aggregate([
    {$match: {status: 'active'}},
    {$group: {_id: '$club_id', count: {$sum: 1}}},
    {$match: {count: {$gt: 1}}},
  ]).toArray();

  if (duplicateActivePeriods.length) {
    throw new Error(`Cannot create the active-period index: duplicate active periods exist for club(s) ${duplicateActivePeriods.map(item => item._id).join(', ')}.`);
  }

  const name = await collection.createIndex(
    {club_id: 1},
    {
      name: 'unique_active_billing_period_per_club',
      unique: true,
      partialFilterExpression: {status: 'active'},
    }
  );
  console.log(JSON.stringify({database: databaseName, index: name}));
} finally {
  await client.close();
}
