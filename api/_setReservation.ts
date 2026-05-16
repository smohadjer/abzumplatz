
import { ObjectId, Collection } from 'mongodb';
import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import {
  reservationIsOnSameDay,
  getDayName,
  getLocalDate,
  getAllReservations
} from '../src/utils/utils.js';
import { DBUser, JwtPayload, ReservationItem } from '../src/types.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

type ReservationClub = {
  reservations_limit: number;
}

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
      case 'court_selection':
        return 'Nur Administratoren können Plätze für eine Reservierung auswählen.';
        break;
      default:
        return 'Es ist ein Fehler aufgetreten. Bitte wenden Sie sich an den Support.'
    }
};

const getUserReservations = async (
  reservations: Collection<ReservationItem>,
  user_id: string
): Promise<ReservationItem[]> => {
  const docs = await reservations.find({
    user_id,
    date: { $gte: new Date().toISOString().split('T')[0] }
  }).sort({
    date: 1,
    start_time: 1
  });
  return docs.toArray();
};

export const setReservation = async (
    req: VercelRequest,
    res: VercelResponse,
    reservations: Collection<ReservationItem>,
    clubs: Collection<ReservationClub>,
    users: Collection<DBUser>) => {
    const body = sanitize(req.body);
    const { court_num, date, label } = body;
    const start_time = Number(body.start_time);
    const end_time = Number(body.end_time);
    const recurring: boolean = body.recurring === 'true';

    const schema = JSON.parse(fs.readFileSync(process.cwd() +
      '/public/schema/reservation.json', 'utf8'));
    const validator = ajv.compile(schema);
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
        console.error(errors);
        return res.json({error: errors});
      } else {
        return res.json({error: 'Ungültige Daten.'});
      }
    }

    const payload = await getJwtPayload(req);
    if (!payload) {
      return res.status(401).json({error: 'Unauthorized'});
    }
    const user = await users.findOne({
      _id: ObjectId.createFromHexString(payload._id)
    });

    if (!user)  {
      return res.status(404).json({error: 'User not found!'});
    }

    // throw error if user is inactive
    if (user.status !== 'active') {
      throw new Error('Ihr Konto ist derzeit inaktiv. Bitte wenden Sie sich an den Support.');
    }

    const userId: string = user._id.toString();

    const overlappingHoursFilter = (item: ReservationItem) => {
      return (start_time <= item.start_time && end_time > item.start_time) ||
       (start_time >= item.start_time && start_time < item.end_time);
    }

    const requestedCourtNums = Array.isArray(body.court_nums) ? body.court_nums : [court_num];
    const courtNums = [...new Set(requestedCourtNums.map((item) => item.toString()))];

    // throw error if a reservation for any selected court in the same time exists
    const reservationsForSelectedCourts: ReservationItem[] = await reservations.find({
        club_id: user.club_id,
        $or: [
          { court_num: { $in: courtNums } },
          { court_nums: { $in: courtNums } }
        ]
      }).toArray();

    for (const selectedCourtNum of courtNums) {
      const reservationsForSameCourt = reservationsForSelectedCourts.filter((item) => {
        const itemCourtNums = item.court_nums?.map((courtNum) => courtNum.toString()) ?? [item.court_num.toString()];
        return itemCourtNums.includes(selectedCourtNum);
      });
      const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
        return reservationIsOnSameDay(item, date);
      });
      const reservationsWithOverlappingTime = reservationsOnSameDay.filter(overlappingHoursFilter);
      if (reservationsWithOverlappingTime.length) {
        throw new Error(getError('already_booked', {court_num: selectedCourtNum}));
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
          throw new Error(getError('overlapping', {court_num: selectedCourtNum, localDate}));
        }
      }
    }

    const userReservations = await getUserReservations(reservations, userId);
    const club_id = user.club_id;
    if (!club_id) {
      throw new Error('User does not belong to a club');
    }
    const userClub = await clubs.findOne(
      {_id: ObjectId.createFromHexString(club_id)}
    );

    // validation for none-admin users
    if (!user.role || user.role !== 'admin') {
      // throw error if a non-admin tries to use the admin-only court selector
      if (body.court_nums !== undefined) {
        throw new Error(getError('court_selection'));
      }

      // throw error if a non-admin tries to reserve multiple courts
      if (courtNums.length > 1) {
        throw new Error(getError('multiple_courts'));
      }

      // throw error if reservation is recurring
      if (recurring) {
        throw new Error(getError('recurring'));
      }

      // throw error if reservation is more than one hour
      if ((end_time - start_time) > 1) {
        throw new Error(getError('more_hours'));
      }

      // throw error if user has already reached maximum allowed number of reservations
      const limit = userClub?.reservations_limit;
      if (limit === undefined) {
        throw new Error('Club not found');
      }
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
      club_id: club_id,
      user_id: userId,
      court_num: courtNums[0],
      court_nums: courtNums,
      date,
      start_time,
      end_time,
      label,
      recurring,
      timestamp: new Date()
    };
    const insertResponse = await reservations.insertOne(reservation);
    const docs = await getAllReservations(reservations, club_id);

    res.status(201).json({
      message: `${courtNums.length > 1 ? 'Plätze' : 'Platz'} ${courtNums.join(', ')} reserviert mit Reservierungsnummer: ${insertResponse.insertedId}`,
      data: docs
    });
};
