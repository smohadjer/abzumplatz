import { ObjectId, Collection } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { DBUser, JwtPayload, ReservationItem } from '../src/types.js';
import { getJwtPayload } from './verifyAuth.js';
import {
  getAllReservations,
  getDayName,
  getLocalDate,
  isInPast,
  reservationIsOnSameDay
} from '../src/utils/utils.js';

const getError = (key: string, options?) => {
  switch (key) {
    case 'recurring':
      return 'Nur Administratoren können wiederkehrende Reservierungen vornehmen.';
    case 'more_hours':
      return 'Nur Administratoren können Reservierungen mit einer Dauer von mehr als zwei Stunden vornehmen.';
    case 'already_booked':
      return `Platz ${options.courtNum} ist zur angegebenen Zeit nicht verfügbar.`;
    case 'overlapping':
      return `Platz ${options.courtNum} ist am ${options.localDate} zu einem Zeitpunkt gebucht, der sich mit Ihrer Buchung überschneidet.`;
    case 'multiple_courts':
      return 'Eine gleichzeitige Reservierung mehrerer Plätze ist nicht gestattet.';
    default:
      return 'Es ist ein Fehler aufgetreten. Bitte wenden Sie sich an den Support.'
  }
};

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

  const payload: JwtPayload = await getJwtPayload(req);
  if (!payload) {
    return res.status(401).json({error: 'Authentication required'});
  }

  const user = await users.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  if (reservation.club_id !== user.club_id) {
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
  const requestedCourtNums = Array.isArray(bodyUpdates.court_nums) ? bodyUpdates.court_nums : [bodyUpdates.court_nums];
  const courtNums = [...new Set(requestedCourtNums.map((item) => item.toString()))];
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
    if (courtNums.length > 1) {
      throw new Error(getError('multiple_courts'));
    }

    if (recurring) {
      throw new Error(getError('recurring'));
    }

    if ((end_time - start_time) > 2) {
      throw new Error(getError('more_hours'));
    }
  }

  const overlappingHoursFilter = (item: ReservationItem) => {
    return (start_time <= item.start_time && end_time > item.start_time) ||
      (start_time >= item.start_time && start_time < item.end_time);
  };

  const reservationsForSelectedCourts: ReservationItem[] = await reservations.find({
    _id: {$ne: query._id},
    club_id: user.club_id,
    court_nums: { $in: courtNums }
  }).toArray();

  for (const selectedCourtNum of courtNums) {
    const reservationsForSameCourt = reservationsForSelectedCourts.filter((item) => {
      const itemCourtNums = item.court_nums.map((courtNum) => courtNum.toString());
      return itemCourtNums.includes(selectedCourtNum);
    });
    const reservationsOnSameDay = reservationsForSameCourt.filter((item) => {
      return reservationIsOnSameDay(item, updates.date);
    });
    const reservationsWithOverlappingTime = reservationsOnSameDay.filter(overlappingHoursFilter);
    if (reservationsWithOverlappingTime.length) {
      throw new Error(getError('already_booked', {courtNum: selectedCourtNum}));
    }

    if (recurring) {
      const reservationsOnSameDayInFuture = reservationsForSameCourt.filter(item => {
        return getDayName(item.date) === getDayName(updates.date) && (
          new Date(item.date) > new Date(updates.date)
        )
      });
      const reservationsWithOverlappingTime = reservationsOnSameDayInFuture.filter(overlappingHoursFilter);
      if (reservationsWithOverlappingTime.length) {
        const localDate = getLocalDate(reservationsWithOverlappingTime[0].date);
        throw new Error(getError('overlapping', {courtNum: selectedCourtNum, localDate}));
      }
    }
  }

  await reservations.updateOne(query, {
    '$set': updates
  });

  const docs = await getAllReservations(reservations, user.club_id);
  return res.status(200).json({
    message: `Reservation with id ${reservation_id} was edited.`,
    data: docs
  });
};
