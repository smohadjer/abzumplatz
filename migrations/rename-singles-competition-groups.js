import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const groups = client.db(databaseName).collection('competition_groups');
  const renames = [
    {from: 'Herren', to: 'Herren Einzel'},
    {from: 'Damen', to: 'Damen Einzel'},
  ];
  const results = [];

  for (const rename of renames) {
    const result = await groups.updateMany(
      {name: rename.from, 'competition_type.id': 'single'},
      {$set: {name: rename.to}}
    );
    results.push({...rename, modified: result.modifiedCount});
  }

  console.log(JSON.stringify({database: databaseName, results}));
} finally {
  await client.close();
}
