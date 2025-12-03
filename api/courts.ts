import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';

const client = new MongoClient(database_uri);
const projection = {
    timestamp: 0
};

const fetchClub = async (id: string, collection) => {
  const query = {_id: ObjectId.createFromHexString(id)};
  const doc = await collection.findOne(query, {projection});
  return doc;
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('clubs');

    if (req.method === 'POST') {
      console.log('Post received', req.body)
      // validate data
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/courts.json', 'utf8'));
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
        await updateCourts(collection, res, body);
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

async function updateCourts(collection, res, body) {
  const doc = await fetchClub(body._id, collection);
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
