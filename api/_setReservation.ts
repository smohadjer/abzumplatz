
import { ObjectId, Collection } from 'mongodb';
import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import {
  getAllReservations
} from '../src/utils/utils.js';
import {
  getCourtNums,
  getReservationError,
  validateNonAdminReservationRules,
  validateReservationOverlap
} from './_reservationValidation.js';
import { DBUser, ReservationItem } from '../src/types.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

type ReservationClub = {
  reservations_limit: number;
}

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
    const { date, label } = body;
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

    const club_id = user.club_id;
    if (!club_id) {
      throw new Error('User does not belong to a club');
    }

    const userId: string = user._id.toString();
    const courtNums = getCourtNums(body.court_nums);
    await validateReservationOverlap(reservations, club_id, courtNums, date, start_time, end_time, recurring);

    const userReservations = await getUserReservations(reservations, userId);
    const userClub = await clubs.findOne(
      {_id: ObjectId.createFromHexString(club_id)}
    );

    // validation for none-admin users
    if (!user.role || user.role !== 'admin') {
      validateNonAdminReservationRules(courtNums, recurring, start_time, end_time, 'court_selection');

      // throw error if user has already reached maximum allowed number of reservations
      const limit = userClub?.reservations_limit;
      if (limit === undefined) {
        throw new Error('Club not found');
      }
      if (userReservations.length >= limit) {
        throw new Error(getReservationError('reached_limit', {limit}));
      }

      // throw error if user has reservered another court at the same time and day
      const userReservationsOnSameDay = userReservations.filter((item) => {
        return item.date === date;
      });
      const userReservationsAtSameTime = userReservationsOnSameDay.filter((item) => {
        return item.start_time === start_time;
      });
      if (userReservationsAtSameTime.length > 0) {
        throw new Error(getReservationError('multiple_courts'));
      }
    }

    // insert reservation
    const reservation = {
      club_id: club_id,
      user_id: userId,
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
