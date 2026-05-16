import { Collection, MongoClient, ObjectId, WithId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Club, DBUser } from '../src/types.js';

type ClubDocument = Omit<Club, '_id'> & {
  timestamp?: Date;
}

type CourtsFormBody = {
  _id: string;
  courts: string[];
}

const client = new MongoClient(database_uri);
const projection = {
    timestamp: 0
};

const fetchClub = async (id: string, collection: Collection<ClubDocument>) => {
  const query = {_id: ObjectId.createFromHexString(id)};
  const doc = await collection.findOne(query, {projection});
  return doc;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection<ClubDocument>('clubs');
    const users = database.collection<DBUser>('users');

    if (req.method === 'POST') {
      // validate data
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/courts.json', 'utf8'));
      const validator = ajv.compile(schema);
      const body = sanitize(req.body) as unknown as CourtsFormBody;
      const valid = validator(body);

      if (!valid) {
          const errors = validator.errors;
          errors.map(error => {
              // for custom error messages
              const customErrorMessage = getCustomErrorMessage(error);
              if (customErrorMessage) {
                  error.message = customErrorMessage;
              }
              return error;
          });
          return res.json({error: errors});
      }

      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await users.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }
      if (requester.role !== 'admin') {
        return res.status(403).json({error: 'Only admins can update courts'});
      }

      if (body._id) {
        await updateCourts(collection, res, body, requester);
      }
    }
  } catch (e) {
    console.error(e);
    const errors = [
      {
        message: e.message,
        instancePath: `#${e.cause}`
      }
    ];
    res.status(500).json({error: errors});
  } finally {
    await client.close();
  }
}

async function updateCourts(
  collection: Collection<ClubDocument>,
  res: VercelResponse,
  body: CourtsFormBody,
  requester: WithId<DBUser>
) {
  if (requester.club_id !== body._id) {
    return res.status(403).json({error: 'Updating these courts is not allowed'});
  }

  const doc = await fetchClub(body._id, collection);
  if (!doc) {
    return res.status(404).json({error: 'Club not found'});
  }

  const courts = doc.courts;
  const activeCourtsIndices = body.courts.map(court => Number(court.split('_')[1]));
  courts.forEach((court, index) => {
    if (activeCourtsIndices.includes(index+1)) {
      court.status = 'active';
    } else {
      court.status = 'inactive';
    }
  });

  const query = {_id: ObjectId.createFromHexString(body._id)};
  const updateResonse = await collection.updateOne(
      query,
      {'$set' : {
        courts,
      }}
  );

  if (!updateResonse) {
    throw new Error(`Club courts couldn't be updated`);
  }

  const docs = await getAllClubs(collection);
  res.status(201).json({
    message: `Courts are updated`,
    data: {
      club_id: body._id,
      clubs: docs
    }
  });
}

async function getAllClubs(collection: Collection<ClubDocument>) {
    const docs = await collection.find({}, {projection})
    // using collation so sort is case insensitive
    .collation({
        locale: 'en',
        strength: 2 /* case insensitive search */
    })
    .sort({ name: 1 })
    .toArray();
    return docs;
};
