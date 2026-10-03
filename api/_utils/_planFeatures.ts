import { Db, ObjectId } from 'mongodb';
import { ClubDocument } from './_types.js';

export const PRO_PLAN_FEATURE_ERROR = 'Diese Funktion ist nur im Pro-Plan verfügbar.';

export async function clubHasProFeatures(database: Db, clubId: string) {
  if (!ObjectId.isValid(clubId)) return false;

  const club = await database.collection<ClubDocument>('clubs').findOne({
    _id: ObjectId.createFromHexString(clubId),
    deleted_at: {$exists: false},
  }, {projection: {access_plan_type: 1}});

  return club?.access_plan_type === 'pro';
}
