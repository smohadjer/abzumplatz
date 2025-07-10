import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import { DBUser } from '../src/types.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('clubs');
    // get all fields except timestamp
    const projection = {
        timestamp: 0
    };

    const getAllClubs = async () => {
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

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        const query = {_id: ObjectId.createFromHexString(id)};
        const doc = await collection.findOne(query, {projection})
        if (doc) {
          res.json(doc);
        } else {
          res.status(404).end();
        }
      } else {
        const docs = await getAllClubs();
        res.json(docs);
      }
    }

    if (req.method === 'POST') {
      console.log('Post received for club')
      // validate data
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/club.json', 'utf8'));
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
      }

      const {
        name,
        first_name,
        last_name,
        password
      } = body;

      const courts_count = Number(body.courts_count);
      const start_hour = Number(body.start_hour);
      const end_hour = Number(body.end_hour);
      const reservations_limit = Number(body.reservations_limit);
      const email = body.email.toLowerCase();

      // throw error if club with same name already exists
      const doc = await collection.findOne({ name },{
        collation: { locale: "en", strength: 2 }
      });
      if (doc) {
        throw new Error(`Club with name ${req.body.name} already exists`);
      }

      // insert club
      const club = {
        name,
        courts_count,
        start_hour,
        end_hour,
        reservations_limit,
        timestamp: new Date()
      };
      const insertResponse = await collection.insertOne(club);
      const club_id = insertResponse.insertedId.toString();

      // insert admin
      const user: DBUser = {
          first_name,
          last_name,
          club_id,
          email,
          password,
          role: 'admin'
      };
      console.log(user);
      await addUser(user);

      const docs = await getAllClubs();
      res.status(201).json({
        message: `Verein ${club.name} ist registeriert mit id ${club_id}`,
        data: docs
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
