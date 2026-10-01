import type { ClientSession, Db } from 'mongodb';
import defaultCompetitionGroups from '../../scripts/data/competition-groups.js';

export async function createDefaultCompetitionGroups(database: Db, clubId: string) {
  if (!defaultCompetitionGroups.length) return;

  await database.collection('competition_groups').insertMany(
    defaultCompetitionGroups.map(group => ({...group, club_id: clubId}))
  );
}

export async function resetDefaultCompetitionGroups(database: Db, clubId: string, session: ClientSession) {
  const groups = database.collection('competition_groups');
  await groups.deleteMany({club_id: clubId}, {session});
  await groups.insertMany(
    defaultCompetitionGroups.map(group => ({...group, club_id: clubId})),
    {session}
  );

  return defaultCompetitionGroups.length;
}
