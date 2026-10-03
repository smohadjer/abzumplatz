import process from 'node:process';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = process.env.db_name || 'abzumplatz';
const collation = {locale: 'en', strength: 2};

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const collection = client.db(databaseName).collection('clubs');
  const duplicateNames = await collection.aggregate([
    {$group: {_id: '$name', ids: {$push: '$_id'}, count: {$sum: 1}}},
    {$match: {count: {$gt: 1}}},
  ], {collation}).toArray();

  if (duplicateNames.length) {
    throw new Error(`Cannot create the club-name index: duplicate club name(s) exist: ${duplicateNames.map(item => item._id).join(', ')}.`);
  }

  const name = await collection.createIndex(
    {name: 1},
    {
      name: 'unique_club_name',
      unique: true,
      collation,
    }
  );
  console.log(JSON.stringify({database: databaseName, index: name}));
} finally {
  await client.close();
}
