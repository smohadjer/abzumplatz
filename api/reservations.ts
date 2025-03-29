import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';

const client = new MongoClient(database_uri);

const getAllReservations = async (collection, club_id) => {
    console.time('reservation');
    const data = await collection.find({club_id}).sort({
      date: 1,
      start_time: 1
  });
    console.timeEnd('reservation');
    return data.toArray();
}

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('reservations');

    if (req.method === 'GET') {
      const club_id = req.query?.club_id;
      if (club_id) {
        const docs = await getAllReservations(collection, club_id);

        if (docs.length > 0) {
          res.json(docs);
        } else {
          res.status(500).end();
        }
      } else {
        res.status(500).end();
      }
    }

    if (req.method === 'DELETE') {
      const reservation_id = req.query?.reservation_id;
      const club_id = req.query?.club_id;

      console.log(`deleting reserveration with id ${reservation_id}`);
      const query = {
        _id: ObjectId.createFromHexString(reservation_id)
      };

      const reservation = await collection.findOne(query);

      console.log(reservation);
      const payload = await getJwtPayload(req);

      if (reservation.user_id === payload._id) {
        console.log('deleting allowed');
        const result = await collection.deleteOne(query);
        console.log(result);
        if (result.deletedCount > 0) {
          if (club_id) {
            const docs = await getAllReservations(collection, club_id);
            res.status(200).json({
              message: `Reservation with id ${reservation_id} was deleted.`,
              data: docs
            });
          } else {
            res.status(200).json({
              message: `Reservation with id ${reservation_id} was deleted.`
            });
          }
        } else {
          res.json({'Error': 'Delete failed!'});
        }
      } else {
        console.log('deleting not allowed');
        res.json({'Error': 'deleting not allowed!'});
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
      const docs = await getAllReservations(collection, club_id);

      res.status(201).json({
        message: `Court ${court_num} is reservered with reservation id: ${insertResponse.insertedId}`,
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
