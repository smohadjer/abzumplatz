import type { Db } from 'mongodb';
import defaultCompetitionGroups from '../../scripts/data/competition-groups.js';

export async function createDefaultCompetitionGroups(database: Db, clubId: string) {
  if (!defaultCompetitionGroups.length) return;

  await database.collection('competition_groups').insertMany(
    defaultCompetitionGroups.map(group => ({...group, club_id: clubId}))
  );
}
