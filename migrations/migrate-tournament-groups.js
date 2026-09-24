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
  const templates = database.collection('competition_groups');
  const tournamentGroups = database.collection('tournament_groups');
  const registrations = database.collection('tournament_registrations');
  const legacyTournaments = await tournaments.find({group_ids: {$exists: true}}).toArray();

  let migratedTournaments = 0;
  let createdGroups = 0;
  let updatedRegistrations = 0;

  for (const tournament of legacyTournaments) {
    const groupIds = Array.isArray(tournament.group_ids) ? tournament.group_ids : [];
    const sourceGroups = await templates.find({_id: {$in: groupIds}}).toArray();
    const groupsById = new Map(sourceGroups.map(group => [group._id.toString(), group]));
    const missingIds = groupIds.filter(groupId => !groupsById.has(groupId.toString()));
    if (missingIds.length) {
      throw new Error(`Tournament ${tournament._id} references missing competition groups: ${missingIds.join(', ')}`);
    }

    for (const sourceGroupId of groupIds) {
      const source = groupsById.get(sourceGroupId.toString());
      let tournamentGroup = await tournamentGroups.findOne({
        tournament_id: tournament._id,
        source_group_id: sourceGroupId,
      });
      if (!tournamentGroup) {
        const document = {
          tournament_id: tournament._id,
          source_group_id: sourceGroupId,
          name: source.name,
          competition_type: source.competition_type,
          ...(source.sex ? {sex: source.sex} : {}),
          ...(source.min_age !== undefined ? {min_age: source.min_age} : {}),
          ...(source.max_age !== undefined ? {max_age: source.max_age} : {}),
        };
        const result = await tournamentGroups.insertOne(document);
        tournamentGroup = {...document, _id: result.insertedId};
        createdGroups += 1;
      }
      const result = await registrations.updateMany(
        {tournament_id: tournament._id, group_id: sourceGroupId},
        {$set: {group_id: tournamentGroup._id}}
      );
      updatedRegistrations += result.modifiedCount;
    }

    await tournaments.updateOne({_id: tournament._id}, {$unset: {group_ids: ''}});
    migratedTournaments += 1;
  }

  const allRegistrations = await registrations.find({}).toArray();
  for (const registration of allRegistrations) {
    const existingGroup = await tournamentGroups.findOne({
      _id: registration.group_id,
      tournament_id: registration.tournament_id,
    });
    if (existingGroup) continue;

    const source = await templates.findOne({_id: registration.group_id});
    if (!source) {
      throw new Error(`Registration ${registration._id} references missing group ${registration.group_id}`);
    }
    let tournamentGroup = await tournamentGroups.findOne({
      tournament_id: registration.tournament_id,
      source_group_id: source._id,
    });
    if (!tournamentGroup) {
      const document = {
        tournament_id: registration.tournament_id,
        source_group_id: source._id,
        name: source.name,
        competition_type: source.competition_type,
        ...(source.sex ? {sex: source.sex} : {}),
        ...(source.min_age !== undefined ? {min_age: source.min_age} : {}),
        ...(source.max_age !== undefined ? {max_age: source.max_age} : {}),
      };
      const result = await tournamentGroups.insertOne(document);
      tournamentGroup = {...document, _id: result.insertedId};
      createdGroups += 1;
    }
    const result = await registrations.updateMany(
      {tournament_id: registration.tournament_id, group_id: source._id},
      {$set: {group_id: tournamentGroup._id}}
    );
    updatedRegistrations += result.modifiedCount;
  }

  console.log(JSON.stringify({database: databaseName, migratedTournaments, createdGroups, updatedRegistrations}));
} finally {
  await client.close();
}
