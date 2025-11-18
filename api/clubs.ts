import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { JwtPayload } from '../src/types.js';

const client = new MongoClient(database_uri);
const projection = {
    timestamp: 0
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('clubs');
    const userCollection = database.collection('users');

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        const query = {_id: ObjectId.createFromHexString(id)};
        const doc = await collection.findOne(query, {projection})
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
      console.log('Post received for club', req.body._id)
      // validate data
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/club.json', 'utf8'));
      const validator = ajv.compile(schema);
      const body = sanitize(req.body);
      const valid = validator(body);

      if (!valid) {
          const errors = validator.errors;
          errors.map(error => {
              // for custom error messages
              if (error.parentSchema) {
                  const customErrorMessage = error.parentSchema.errorMessage;
                  if (customErrorMessage) {
                    error.message = customErrorMessage;
                  }
              }
              return error;
          });
          return res.json({error: errors});
      } else {
        console.log('valid data received');
      }

      if (body._id) {
        await updateClub(collection, res, body);
      } else {
        await addClub(collection, req, res, body, userCollection);
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}

async function addClub(collection, req, res, body, userCollection) {
  const courts_count = Number(body.courts_count);
  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const reservations_limit = Number(body.reservations_limit);

  // throw error if club with same name already exists
  const doc = await collection.findOne({ name: body.name },{
    collation: { locale: "en", strength: 2 }
  });
  if (doc) {
    throw new Error(`Club with name ${body.name} already exists`);
  }

  // insert club
  const club = {
    name: body.name,
    courts_count,
    start_hour,
    end_hour,
    reservations_limit,
    timestamp: new Date()
  };
  const insertResponse = await collection.insertOne(club);
  const club_id = insertResponse.insertedId.toString();

  // add club_id to user who posted the club
  if (club_id) {
    const payload: JwtPayload = await getJwtPayload(req);
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


async function updateClub(collection, res, body) {
  const courts_count = Number(body.courts_count);
  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const reservations_limit = Number(body.reservations_limit);

    const query = {_id: ObjectId.createFromHexString(body._id)};
    const updateResonse = await collection.updateOne(
        query,
        {'$set' : {
          name : body.name,
          courts_count,
          start_hour,
          end_hour,
          reservations_limit,
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

async function getAllClubs(collection) {
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
