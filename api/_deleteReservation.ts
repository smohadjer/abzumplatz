import { ObjectId, Collection } from 'mongodb';
import { DBUser, JwtPayload, ReservationItem } from '../src/types.js';
import { isInPast } from '../src/utils/utils.js';
import { getJwtPayload } from './verifyAuth.js';
import { getAllReservations } from '../src/utils/utils.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

const getWeeklyOccurrenceDatesBefore = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
  }

  return dates;
};

const previousOccurrencesWereDeleted = (reservation: ReservationItem, selectedDate: string) => {
  const deletedDates = new Set(reservation.deleted_dates ?? []);
  const previousOccurrenceDates = getWeeklyOccurrenceDatesBefore(reservation.date, selectedDate);

  return previousOccurrenceDates.every(date => deletedDates.has(date));
};

export const deleteReservation = async (req: VercelRequest, res: VercelResponse, reservations: Collection<ReservationItem>,
  users: Collection<DBUser>) => {
    const reservation_id = req.query?.reservation_id;
    if (!reservation_id || Array.isArray(reservation_id)) {
      return res.status(400).json({error: 'Reservation id is required'});
    }

    // console.log(`Deleting reserveration with id ${reservation_id}`);
    const query = {
      _id: ObjectId.createFromHexString(reservation_id)
    };
    const reservation = await reservations.findOne(query);
    if (!reservation) {
      return res.status(404).json({error: 'Reservation not found'});
    }

    // reservations in the past that do not recurr can not be deleted
    const reservationIsInPast = isInPast(new Date(reservation.date), reservation.start_time);
    const reservationIsRecurring = reservation.recurring;
    if (reservationIsInPast && !reservationIsRecurring) {
      throw new Error('Vergangene Reservierungen können nicht gelöscht werden');
    }

    const payload = await getJwtPayload(req);
    if (!payload) {
      return res.status(401).json({error: 'Authentication required'});
    }

    const user = await users.findOne({
      _id: ObjectId.createFromHexString(payload._id)
    });
    if (!user) {
      return res.status(401).json({error: 'Authentication required'});
    }

    const returnResponse = async () => {
      const docs = await getAllReservations(reservations, user.club_id);
      res.status(200).json({
        message: `Reservation with id ${reservation_id} was deleted.`,
        data: docs
      });
    }

    // only owner of a reservation and admin can delete the reservation
    if (reservation.user_id !== payload._id && user.role !== 'admin') {
      return res.status(403).json({error: 'Deleting this reservation is not allowed'});
    }

    if (reservation.club_id !== user.club_id) {
      return res.status(403).json({error: 'Deleting this reservation is not allowed'});
    }

    // delete reservation from db
    if (!reservationIsRecurring || req.body.delete_type === 'all') {
      const result = await reservations.deleteOne(query);
      if (result.deletedCount > 0) {
        await returnResponse();
      } else {
        return res.json({error: 'Delete failed!'});
      }
    // add req.body.date to deleted_dates array of reservation doc in db
    } else if (req.body.delete_type === 'once') {
      if (reservation.deleted_dates) {
        reservation.deleted_dates.push(req.body.date);
      } else {
        reservation.deleted_dates = [req.body.date];
      }
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    // set end_date of reservation doc in db to req.body.date
    } else {
      if (previousOccurrencesWereDeleted(reservation, req.body.date)) {
        const result = await reservations.deleteOne(query);
        if (result.deletedCount > 0) {
          await returnResponse();
        } else {
          return res.json({error: 'Delete failed!'});
        }
        return;
      }

      reservation.end_date = req.body.date;
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    }
};
