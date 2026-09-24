import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const databaseUri = process.env.db_uri;
const databaseName = 'abzumplatz';

if (!databaseUri) throw new Error('Missing db_uri. Add it to .env or your environment.');

const client = new MongoClient(databaseUri);

try {
  await client.connect();
  const database = client.db(databaseName);
  const tournaments = database.collection('tournaments');
  const tournamentGroups = database.collection('tournament_groups');
  const registrations = database.collection('tournament_registrations');
  const registrationsExist = await database
    .listCollections({name: 'tournament_registrations'}, {nameOnly: true})
    .hasNext();

  const duplicateRegistration = registrationsExist ? await registrations.aggregate([
    {$unwind: '$user_ids'},
    {$group: {
      _id: {tournament_id: '$tournament_id', group_id: '$group_id', user_id: '$user_ids'},
      registration_ids: {$addToSet: '$_id'},
      count: {$sum: 1},
    }},
    {$match: {count: {$gt: 1}}},
    {$limit: 1},
  ]).next() : null;
  if (duplicateRegistration) {
    throw new Error(`Duplicate tournament registration found: ${JSON.stringify(duplicateRegistration)}`);
  }

  const registrationIndexName = 'tournament_id_1_group_id_1_user_ids_1';
  const existingRegistrationIndex = registrationsExist
    ? (await registrations.listIndexes().toArray()).find(index => index.name === registrationIndexName)
    : undefined;
  if (existingRegistrationIndex && !existingRegistrationIndex.unique) {
    await registrations.dropIndex(registrationIndexName);
  }

  const indexes = await Promise.all([
    tournaments.createIndex(
      {club_id: 1, start_date: -1},
      {name: 'club_id_1_start_date_-1'}
    ),
    tournamentGroups.createIndex(
      {tournament_id: 1, source_group_id: 1},
      {name: 'tournament_id_1_source_group_id_1', unique: true}
    ),
    registrations.createIndex(
      {tournament_id: 1, group_id: 1, registered_at: 1},
      {name: 'tournament_id_1_group_id_1_registered_at_1'}
    ),
    registrations.createIndex(
      {tournament_id: 1, group_id: 1, user_ids: 1},
      {name: registrationIndexName, unique: true}
    ),
    registrations.createIndex(
      {user_ids: 1, tournament_id: 1},
      {name: 'user_ids_1_tournament_id_1'}
    ),
  ]);

  console.log(JSON.stringify({database: databaseName, indexes}));
} finally {
  await client.close();
}
