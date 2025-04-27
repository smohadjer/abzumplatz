import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { isInPast, recurringReservationIsOnSameDay, getDayName, getLocalDate } from '../src/utils/utils.js';
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
      const recurring: boolean = body.recurring === 'true';
      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/reservation.json', 'utf8'));
      const validator = ajv.compile(schema);
      const valid = validator(body);
      if (!valid) {
          const errors = validator.errors;
          console.log(errors);
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

      const overlappingHoursFilter = (item: ReservationItemDB) => {
        return (start_time <= item.start_time && end_time > item.start_time) ||
         (start_time >= item.start_time && start_time < item.end_time);
      }

      // throw error if a reservation for same court in the same time exists
      const reservationsForSameCourt = await reservations.find({ club_id, court_num }).toArray();
      const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
        const normalizedItem = {
          date: item.date,
          recurring: item.recurring
        }
        return item.date === date || recurringReservationIsOnSameDay(normalizedItem, date);
      });
      const reservationsWithOverlappingTime = reservationsOnSameDay.filter(overlappingHoursFilter);
      if (reservationsWithOverlappingTime.length) {
        throw new Error(`Platz ${court_num} ist zur angegebenen Zeit nicht verfügbar.`);
      }

      const user: JwtPayload = await getJwtPayload(req);

      // throw error if reservation is recurring or more than one hour and user is not admin or trainer
      if (recurring || (end_time - start_time) > 1) {
        if (user.role !== 'admin' && user.role !== 'trainer') {
          throw new Error('Nur Administratoren und Trainer können wiederkehrende Reservierungen oder Reservierungen mit einer Dauer von mehr als einer Stunde vornehmen.');
        }
      }

      // throw error if reservation is recurring and another reservation on the same day in future has overlapping hours
      if (recurring) {
        const reservationsOnSameDayInFuture = reservationsForSameCourt.filter(item => {
          return getDayName(item.date) === getDayName(date) && (
            new Date(item.date) > new Date(date)
          )
        })
        const reservationsWithOverlappingTime = reservationsOnSameDayInFuture.filter(overlappingHoursFilter);
        if (reservationsWithOverlappingTime.length) {
          const localDate = getLocalDate(reservationsWithOverlappingTime[0].date);
          throw new Error(`Platz ${court_num} ist am ${localDate} zu einem Zeitpunkt gebucht, der sich mit Ihrer Buchung überschneidet.`);
        }
      }

      // throw error if user has already reached maximum allowed number of reservations unless user is admin
      const userReservations = await getUserReservations(reservations, user._id);
      const userClub = await clubs.findOne(
        {_id: ObjectId.createFromHexString(club_id)}
      )
      const limit =  userClub.reservations_limit;
      if (user.role !== 'admin' && user.role !== 'trainer' && userReservations.length >= limit) {
        throw new Error(`Sie haben die maximal zulässige Anzahl an Reservierungen (${limit}) erreicht.`);
      }

      // insert reservation
      const reservation = {
        club_id, user_id, court_num, date, start_time, end_time, label, recurring,
        timestamp: new Date()
      };
      const insertResponse = await reservations.insertOne(reservation);
      const docs = await getAllReservations(reservations, club_id);

      res.status(201).json({
        message: `Platz ${court_num} ist reserviert mit Reservierungsnummer: ${insertResponse.insertedId}`,
        data: docs
      });
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
