import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseName = process.env.db_name || 'abzumplatz';
const databaseUri = process.env.db_uri;
const seedPath = path.join(process.cwd(), 'scripts', 'data', 'competition-groups.json');

if (!databaseUri) {
  throw new Error('Missing db_uri. Add it to .env or your environment.');
}

const client = new MongoClient(databaseUri);

try {
  const definitions = JSON.parse(await fs.readFile(seedPath, 'utf8'));
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new Error('Competition group seed data is empty or invalid.');
  }

  await client.connect();
  const database = client.db(databaseName);
  const clubs = await database.collection('clubs').find({}, {projection: {_id: 1, name: 1}}).toArray();
  const groups = database.collection('competition_groups');

  let inserted = 0;
  let skipped = 0;

  for (const club of clubs) {
    const clubId = club._id.toString();
    for (const definition of definitions) {
      const existing = await groups.findOne(
        {club_id: clubId, name: definition.name},
        {collation: {locale: 'de', strength: 2}, projection: {_id: 1}}
      );
      if (existing) {
        skipped += 1;
        continue;
      }

      await groups.insertOne({...definition, club_id: clubId});
      inserted += 1;
    }
  }

  console.log(JSON.stringify({database: databaseName, clubs: clubs.length, inserted, skipped}));
} finally {
  await client.close();
}
