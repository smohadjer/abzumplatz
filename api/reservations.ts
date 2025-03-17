import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('reservations');
    const projection = {
        // name: 1,
        // courts_count: 1
    };

    if (req.method === 'GET') {
      const club_id = req.query?.club_id;
      if (club_id) {
        const query = {club_id};
        const docs = await collection.find(query, {projection}).toArray();
        if (docs.length > 0) {
          res.json(docs);
        } else {
          res.status(500).end();
        }
      } else {
        res.status(500).end();
      }
    }

    if (req.method === 'POST') {
      // validate data
      console.log('validating...')
      const { club_id, user_id, court_num, date, start_time, end_time } = req.body;
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/reservation.json', 'utf8'));
      const validator = ajv.compile(schema);
      const body = sanitize(req.body);
      console.log(body);
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

      // throw error if a reservation for same court in the same time already exists
      const doc = await collection.findOne({ club_id, court_num, date, start_time },{
        collation: { locale: "en", strength: 2 }
      });
      if (doc) {
        throw new Error(`Court ${court_num} is not availble at ${start_time}.`);
      }

      // insert reservation
      const reservation = {
        club_id, user_id, court_num, date, start_time, end_time,
        timestamp: new Date()
      };
      const insertResponse = await collection.insertOne(reservation);
      res.status(201).json({message: `Court ${court_num} is reservered with reservation id: ${insertResponse.insertedId}`});
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
