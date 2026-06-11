import { Collection, MongoClient, ObjectId, WithId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { DBUser, JwtPayload } from '../src/types.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ClubDocument, ClubFormBody } from './types.js';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

const fetchClub = async (id: string, collection: Collection<ClubDocument>) => {
  const query = {_id: ObjectId.createFromHexString(id)};
  const doc = await collection.findOne(query);
  return doc;
};

const getPaidUntilOneYearFromNow = () => {
  const paidUntil = new Date();
  paidUntil.setFullYear(paidUntil.getFullYear() + 1);
  return paidUntil.toISOString().slice(0, 10);
};

const hasFuturePaidUntil = (paidUntil?: string) => {
  if (!paidUntil) {
    return false;
  }

  const endOfPaidDay = new Date(`${paidUntil}T23:59:59.999`);
  return endOfPaidDay > new Date();
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection<ClubDocument>('clubs');
    const userCollection = database.collection<DBUser>('users');

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        if (Array.isArray(id)) {
          return res.status(400).json({error: 'Club id is invalid'});
        }

        const doc = await fetchClub(id, collection);
        if (doc) {
          return res.json(doc);
        } else {
          return res.status(404).end();
        }
      } else {
        const docs = await getAllClubs(collection);
        return res.json(docs);
      }
    }

    if (req.method === 'POST') {
      // validate data
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/club.json', 'utf8'));
      const validator = ajv.compile(schema);
      const body = sanitize(req.body) as ClubFormBody;
      const valid = validator(body);

      if (!valid) {
          const errors = validator.errors;
          if (errors) {
            errors.map(error => {
                // for custom error messages
                const customErrorMessage = getCustomErrorMessage(error);
                if (customErrorMessage) {
                    error.message = customErrorMessage;
                }
                return error;
            });
            return res.status(500).json({error: errors});
          } else {
            return res.status(500).json({error: 'Ungültige Daten.'});   
          }
      }

      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await userCollection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }
      if (requester.role !== 'admin') {
        return res.status(403).json({error: 'Only admins can edit clubs'});
      }

      if (body._id) {
        await updateClub(collection, res, body, requester);
      } else {
        await addClub(collection, res, body, userCollection, payload, requester);
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

async function addClub(
  collection: Collection<ClubDocument>,
  res: VercelResponse,
  body: ClubFormBody,
  userCollection: Collection<DBUser>,
  payload: JwtPayload,
  requester: WithId<DBUser>
) {
  if (requester.club_id) {
    return res.status(403).json({error: 'Creating another club is not allowed'});
  }

  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const timezone = body.timezone;
  const reservations_limit = body.reservations_limit !== undefined ? Number(body.reservations_limit) : null;
  const members_limit = body.plan_type === 'free' ? 100 : null;
  const auto_renew = body.auto_renew === true || body.auto_renew === 'true';
  const paid_until = body.plan_type === 'paid' ? getPaidUntilOneYearFromNow() : undefined;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    const error = new Error('Bitte geben Sie eine gültige IANA-Zeitzone an.', {
      cause: 'timezone'
    });
    throw error;
  }

  // throw error if club with same name already exists
  const doc = await collection.findOne({ name: body.name },{
    collation: { locale: "en", strength: 2 }
  });
  if (doc) {
    const error = new Error('Ein Verein mit diesem Namen existiert bereits.', {
      cause: 'name'
    });
    throw error;
  }

  // add courts array to db
  const courts = [];
  for (let i=0; i < Number(body.courts_count); i++) {
    courts.push({
      status: 'active'
    });
  }

  // insert club
  const club = {
    name: body.name,
    address_line1: body.address_line1,
    postal_code: body.postal_code,
    city: body.city,
    country: body.country,
    auto_renew,
    paid_until,
    plan_type: body.plan_type,
    members_limit,
    start_hour,
    end_hour,
    timezone,
    reservations_limit,
    courts,
    timestamp: new Date()
  };
  const insertResponse = await collection.insertOne(club);
  const club_id = insertResponse.insertedId.toString();

  // add club_id to user who posted the club
  if (club_id) {
    const query = {_id: ObjectId.createFromHexString(payload._id)};
    const updateResonse = await userCollection.updateOne(
        query,
        {'$set' : {'club_id' : club_id}}
    );
  }

  const docs = await getAllClubs(collection);
  res.status(201).json({
    message: `Verein ${club.name} ist registeriert mit id ${club_id}`,
    data: {
      club_id,
      clubs: docs
    }
  });
}


async function updateClub(
  collection: Collection<ClubDocument>,
  res: VercelResponse,
  body: ClubFormBody,
  requester: WithId<DBUser>
) {
  if (requester.club_id !== body._id) {
    return res.status(403).json({error: 'Updating this club is not allowed'});
  }

  const courts_count = Number(body.courts_count);
  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const timezone = body.timezone;
  const reservations_limit = body.reservations_limit !== undefined ? Number(body.reservations_limit) : null;
  const members_limit = body.plan_type === 'free' ? 100 : null;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    const error = new Error('Bitte geben Sie eine gültige IANA-Zeitzone an.', {
      cause: 'timezone'
    });
    throw error;
  }

  // updating courts array in db if user has changed courts_count
  const doc = await fetchClub(body._id, collection);
  if (!doc) {
    return res.status(404).json({error: 'Club not found'});
  }
  const preserveExistingPaidCoverage = hasFuturePaidUntil(doc.paid_until);
  const auto_renew = body.plan_type === 'paid'
    ? body.auto_renew === true || body.auto_renew === 'true'
    : doc.auto_renew;
  const paid_until = body.plan_type === 'paid'
    ? preserveExistingPaidCoverage
      ? doc.paid_until
      : getPaidUntilOneYearFromNow()
    : doc.paid_until;

  const courts = doc.courts;
  if (courts_count < courts.length) {
    courts.length = courts_count;
  } else if (courts_count > courts.length) {
    const diff = courts_count - courts.length;
    for (let i=0; i < diff; i++) {
      courts.push({
        status: 'active'
      });
    }
  }

  const query = {_id: ObjectId.createFromHexString(body._id)};
  const updateResonse = await collection.updateOne(
      query,
      {'$set' : {
        name : body.name,
        address_line1: body.address_line1,
        postal_code: body.postal_code,
        city: body.city,
        country: body.country,
        auto_renew,
        paid_until,
        plan_type: body.plan_type,
        members_limit,
        start_hour,
        end_hour,
        timezone,
        reservations_limit,
        courts,
      }}
  );

  if (!updateResonse) {
    throw new Error(`Club ${body.name} couldn't be updated`);
  }

  const docs = await getAllClubs(collection);
  res.status(201).json({
    message: `Verein ${body.name} ist updated`,
    data: {
      club_id: body._id,
      clubs: docs
    }
  });
}

async function getAllClubs(collection: Collection<ClubDocument>) {
    const docs = await collection.find({})
    // using collation so sort is case insensitive
    .collation({
        locale: 'en',
        strength: 2 /* case insensitive search */
    })
    .sort({ name: 1 })
    .toArray();
    return docs;
};
