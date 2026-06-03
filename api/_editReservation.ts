import { ObjectId, Collection } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { DBUser, ReservationItem } from '../src/types.js';
import { getJwtPayload } from './verifyAuth.js';
import {
  getAllReservations,
  isInPast
} from '../src/utils/utils.js';
import {
  getCourtNums,
  validateNonAdminReservationRules,
  validateReservationOverlap
} from './_reservationValidation.js';

export const editReservation = async (
  req: VercelRequest,
  res: VercelResponse,
  reservations: Collection<ReservationItem>,
  users: Collection<DBUser>
) => {
  const reservation_id = req.body?.reservation_id;
  if (!reservation_id || typeof reservation_id !== 'string') {
    return res.status(400).json({error: 'Reservation id is required'});
  }

  const query = {
    _id: ObjectId.createFromHexString(reservation_id)
  };
  const reservation = await reservations.findOne(query);

  if (!reservation) {
    return res.status(404).json({error: 'Reservation not found'});
  }

  const payload = await getJwtPayload(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required'});
  }

  const user = await users.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  const club_id = user.club_id;
  if (!club_id) {
    throw new Error('User does not belong to a club');
  }

  if (reservation.club_id !== club_id) {
    return res.status(403).json({error: 'Editing this reservation is not allowed'});
  }

  if (isInPast(new Date(reservation.date), reservation.start_time) && !reservation.recurring) {
    throw new Error('Vergangene Reservierungen können nicht bearbeitet werden');
  }

  if (reservation.user_id !== payload._id && user.role !== 'admin') {
    return res.status(403).json({error: 'Editing this reservation is not allowed'});
  }

  if (reservation.recurring && user.role !== 'admin') {
    return res.status(403).json({error: 'Editing recurring reservations is not allowed'});
  }

  const {
    reservation_id: _reservationId,
    user_id,
    date,
    start_time: startTimeValue,
    end_time: endTimeValue,
    label,
    court_nums,
    recurring: recurringValue
  } = req.body;
  const bodyUpdates = {
    date,
    ...(label !== undefined ? {label} : {}),
    court_nums,
    recurring: recurringValue,
    start_time: startTimeValue,
    end_time: endTimeValue
  };

  if (!bodyUpdates.date || bodyUpdates.start_time === undefined || bodyUpdates.end_time === undefined || !bodyUpdates.court_nums) {
    return res.status(400).json({error: 'Reservation date, time and courts are required'});
  }

  const start_time = Number(bodyUpdates.start_time);
  const end_time = Number(bodyUpdates.end_time);
  if (!Number.isFinite(start_time) || !Number.isFinite(end_time)) {
    return res.status(400).json({error: 'Reservation time is invalid'});
  }

  const recurring = bodyUpdates.recurring === true || bodyUpdates.recurring === 'true';
  const courtNums = getCourtNums(bodyUpdates.court_nums);
  const updates = {
    ...bodyUpdates,
    court_nums: courtNums,
    start_time,
    end_time,
    recurring,
    ...(user_id ? {user_id} : {})
  };

  if (!Object.keys(updates).length) {
    return res.status(400).json({error: 'No reservation fields to update'});
  }

  if (user_id && user.role !== 'admin') {
    return res.status(403).json({error: 'Only admins can assign reservations'});
  }

  if (user.role !== 'admin') {
    validateNonAdminReservationRules(courtNums, recurring, start_time, end_time);
  }

  await validateReservationOverlap(reservations, club_id, courtNums, updates.date, start_time, end_time, recurring, query._id);

  await reservations.updateOne(query, {
    '$set': updates
  });

  const docs = await getAllReservations(reservations, club_id);
  return res.status(200).json({
    message: `Reservation with id ${reservation_id} was edited.`,
    data: docs
  });
};
