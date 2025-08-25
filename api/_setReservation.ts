
import { ObjectId, Collection } from 'mongodb';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import {
  recurringReservationIsOnSameDay,
  getDayName,
  getLocalDate,
  getAllReservations
} from '../src/utils/utils.js';
import { JwtPayload, ReservationItem } from '../src/types.js';

const getError = (key: string, options?) => {
    switch (key) {
      case 'recurring':
        return 'Nur Administratoren können wiederkehrende Reservierungen vornehmen.';
        break;
      case 'more_hours':
        return 'Nur Administratoren können Reservierungen mit einer Dauer von mehr als einer Stunde vornehmen.';
        break;
      case 'reached_limit':
        return `Sie haben die maximal zulässige Anzahl an Reservierungen (${options.limit}) erreicht.`;
        break;
      case 'already_booked':
        return `Platz ${options.court_num} ist zur angegebenen Zeit nicht verfügbar.`;
        break;
      case 'overlapping':
        return `Platz ${options.court_num} ist am ${options.localDate} zu einem Zeitpunkt gebucht, der sich mit Ihrer Buchung überschneidet.`;
        break;
      case 'multiple_courts':
        return 'Eine gleichzeitige Reservierung mehrerer Plätze ist nicht gestattet.';
        break;
      default:
        return 'Es ist ein Fehler aufgetreten. Bitte wenden Sie sich an den Support.'
    }
};

const getUserReservations = async (reservations, user_id): Promise<ReservationItem[]> => {
  const docs = await reservations.find({
    user_id,
    date: { $gte: new Date().toISOString().split('T')[0] }
  }).sort({
    date: 1,
    start_time: 1
  });
  return docs.toArray();
};

export const setReservation = async (req, res, reservations, clubs,
    users: Collection) => {
    const body = sanitize(req.body);
    const { court_num, date, label } = body;
    const start_time = Number(body.start_time);
    const end_time = Number(body.end_time);
    const recurring: boolean = body.recurring === 'true';

    const schema = JSON.parse(fs.readFileSync(process.cwd() +
      '/schema/reservation.json', 'utf8'));
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
      console.error(errors);
      return res.json({error: errors});
    }

    const payload: JwtPayload = await getJwtPayload(req);
    const user = await users.findOne({
      _id: ObjectId.createFromHexString(payload._id)
    });
    const userId: string = user._id.toString();

    const overlappingHoursFilter = (item: ReservationItem) => {
      return (start_time <= item.start_time && end_time > item.start_time) ||
       (start_time >= item.start_time && start_time < item.end_time);
    }

    // throw error if a reservation for same court in the same time exists
    const reservationsForSameCourt: ReservationItem[] = await reservations.find({
        club_id: user.club_id,
        court_num
      }).toArray();
    const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
      return item.date === date || recurringReservationIsOnSameDay(item, date);
    });
    const reservationsWithOverlappingTime = reservationsOnSameDay.filter(overlappingHoursFilter);
    if (reservationsWithOverlappingTime.length) {
      throw new Error(getError('already_booked', {court_num}));
    }

    // throw error if reservation is recurring and another reservation for same
    // court on the same day in future has overlapping hours
    if (recurring) {
      const reservationsOnSameDayInFuture = reservationsForSameCourt.filter(item => {
        return getDayName(item.date) === getDayName(date) && (
          new Date(item.date) > new Date(date)
        )
      })
      const reservationsWithOverlappingTime = reservationsOnSameDayInFuture.filter(overlappingHoursFilter);
      if (reservationsWithOverlappingTime.length) {
        const localDate = getLocalDate(reservationsWithOverlappingTime[0].date);
        throw new Error(getError('overlapping', {court_num, localDate}));
      }
    }

    const userReservations = await getUserReservations(reservations, userId);
    const userClub = await clubs.findOne(
      {_id: ObjectId.createFromHexString(user.club_id)}
    );

    // validation for none-admin users
    if (!user.role || user.role !== 'admin') {
      // throw error if reservation is recurring
      if (recurring) {
        throw new Error(getError('recurring'));
      }

      // throw error if reservation is more than one hour
      if ((end_time - start_time) > 1) {
        throw new Error(getError('more_hours'));
      }

      // throw error if user has already reached maximum allowed number of reservations
      const limit =  userClub.reservations_limit;
      if (userReservations.length >= limit) {
        throw new Error(getError('reached_limit', {limit}));
      }

      // throw error if user has reservered another court at the same time and day
      const userReservationsOnSameDay = userReservations.filter((item) => {
        return item.date === date;
      });
      const userReservationsAtSameTime = userReservationsOnSameDay.filter((item) => {
        return item.start_time === start_time;
      });
      if (userReservationsAtSameTime.length > 0) {
        throw new Error(getError('multiple_courts'));
      }
    }

    // insert reservation
    const reservation = {
      club_id: user.club_id,
      user_id: userId,
      court_num,
      date,
      start_time,
      end_time,
      label,
      recurring,
      timestamp: new Date()
    };
    const insertResponse = await reservations.insertOne(reservation);
    const docs = await getAllReservations(reservations, user.club_id);

    res.status(201).json({
      message: `Platz ${court_num} ist reserviert mit Reservierungsnummer: ${insertResponse.insertedId}`,
      data: docs
    });
};
