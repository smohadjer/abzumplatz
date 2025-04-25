import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { isInPast, ARecurringReservationFallsOnThisDay } from '../src/utils/utils.js';
import { JwtPayload, ReservationItem, ReservationItemDB } from '../src/types.js';

const client = new MongoClient(database_uri);
const getAllReservations = async (reservations, club_id) => {
  const docs = await reservations.find({club_id}).sort({
    date: 1,
    start_time: 1
  });
  return docs.toArray();
};
const getUserReservations = async (reservations, user_id) => {
  const docs = await reservations.find({
    user_id,
    date: { $gte: new Date().toISOString().split('T')[0] }
  }).sort({
    date: 1,
    start_time: 1
  });
  return docs.toArray();
};

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const reservations = database.collection<ReservationItemDB>('reservations');
    const clubs = database.collection('clubs');

    if (req.method === 'GET') {
      const club_id = req.query?.club_id;
      if (club_id) {
        const docs = await getAllReservations(reservations, club_id);
        res.json(docs);
      } else {
        res.status(500).end();
      }
    }

    if (req.method === 'DELETE') {
      const reservation_id: string = req.query?.reservation_id;
      const club_id = req.query?.club_id;

      console.log(`deleting reserveration with id ${reservation_id}`);
      const query = {
        _id: ObjectId.createFromHexString(reservation_id)
      };

      const reservation = await reservations.findOne(query);
      if (isInPast(new Date(reservation.date), reservation.start_time)) {
        throw new Error('Reservations in the past can not be deleted!');
      }

      const user = await getJwtPayload(req);

      if (reservation.user_id === user._id) {
        console.log('deleting allowed');
        const result = await reservations.deleteOne(query);
        if (result.deletedCount > 0) {
          if (club_id) {
            const docs = await getAllReservations(reservations, club_id);
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
      const body = sanitize(req.body);
      const { club_id, user_id, court_num, date, label } = body;
      const start_time = Number(body.start_time);
      const end_time = Number(body.end_time);
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/reservation.json', 'utf8'));
      const validator = ajv.compile(schema);
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

      // throw error if a reservation for same court in the same time exists
      const reservationsForSameCourt = await reservations.find({ club_id, court_num }).toArray();
      const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
        const normalizedItem: ReservationItem = {
          _id: item._id.toString(),
          club_id: item.club_id,
          user_id: item.user_id,
          date: item.date,
          court_num: item.court_num,
          start_time: item.start_time,
          end_time: item.end_time,
          recurring: item.recurring
        }
        return item.date === date || ARecurringReservationFallsOnThisDay(normalizedItem, date);
      });
      const reservationsWithOverlappingTime = reservationsOnSameDay.filter(item => {
        return (start_time <= item.start_time && end_time > item.start_time) ||
         (start_time >= item.start_time && start_time < item.end_time)
      });
      if (reservationsWithOverlappingTime.length) {
        throw new Error(`Court ${court_num} is not availble at the specified time.`);
      }

      // throw error if user has already reached maximum allowed number of reservations unless user is admin
      const user: JwtPayload = await getJwtPayload(req);
      const userReservations = await getUserReservations(reservations, user._id);
      const userClub = await clubs.findOne(
        {_id: ObjectId.createFromHexString(club_id)}
      )
      const limit =  userClub.reservations_limit;
      if (user.role !== 'admin' && user.role !== 'trainer' && userReservations.length >= limit) {
        throw new Error(`You have reached maximum allowed reservations (${limit}).`);
      }

      // insert reservation
      const reservation = {
        club_id, user_id, court_num, date, start_time, end_time, label,
        timestamp: new Date()
      };
      const insertResponse = await reservations.insertOne(reservation);
      const docs = await getAllReservations(reservations, club_id);

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
