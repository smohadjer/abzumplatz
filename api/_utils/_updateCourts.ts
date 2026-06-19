import { Collection, ObjectId, WithId } from 'mongodb';
import { VercelResponse } from '@vercel/node';
import { DBUser } from '../../src/types.js';
import { ClubDocument, CourtsFormBody } from './_types.js';
import { fetchClub } from './_fetchClub.js';

const projection = {
  timestamp: 0
} as const;

export async function updateCourts(
  collection: Collection<ClubDocument>,
  res: VercelResponse,
  body: CourtsFormBody,
  requester: WithId<DBUser>
) {
  if (!body._id) {
    return res.status(400).json({error: 'Club id is required'});
  }

  if (requester.club_id !== body._id) {
    return res.status(403).json({error: 'Updating these courts is not allowed'});
  }

  const doc = await fetchClub(body._id, collection, {projection});
  if (!doc) {
    return res.status(404).json({error: 'Club not found'});
  }

  const courts = doc.courts;
  const activeCourtsIndices = body.courts.map(court => Number(court.split('_')[1]));
  courts.forEach((court, index) => {
    if (activeCourtsIndices.includes(index + 1)) {
      court.status = 'active';
    } else {
      court.status = 'inactive';
    }
  });

  const query = {_id: ObjectId.createFromHexString(body._id)};
  const updateResponse = await collection.updateOne(
    query,
    {'$set': { courts }}
  );

  if (!updateResponse) {
    throw new Error(`Club courts couldn't be updated`);
  }

  const docs = await collection.find({}, {projection})
    .collation({
      locale: 'en',
      strength: 2
    })
    .sort({ name: 1 })
    .toArray();

  return res.status(200).json({
    message: 'Courts are updated',
    data: {
      club_id: body._id,
      clubs: docs
    }
  });
}
