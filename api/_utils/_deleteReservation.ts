import { ObjectId, Collection } from 'mongodb';
import { DBUser, ReservationItem } from '../../src/types.js';
import { addDaysToIsoDate, isReservationTimeInPast, reservationIsOnSameDay } from '../../src/utils/reservationTime.js';
import { getAllReservations } from '../../src/utils/utils.js';
import type { VercelRequest, VercelResponse } from './_apiTypes.js';
import { createAppError, getAppErrorResponse } from './_errors.js';
import { getAuthenticatedUserContext } from './_authenticatedUser.js';

const getWeeklyOccurrenceDatesBefore = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  let current = startDate;

  while (current < endDate) {
    dates.push(current);
    current = addDaysToIsoDate(current, 7);
  }

  return dates;
};

const previousOccurrencesWereDeleted = (reservation: ReservationItem, selectedDate: string) => {
  const deletedDates = new Set(reservation.deleted_dates ?? []);
  const previousOccurrenceDates = getWeeklyOccurrenceDatesBefore(reservation.date, selectedDate);

  return previousOccurrenceDates.every(date => deletedDates.has(date));
};

export const deleteReservation = async (req: VercelRequest, res: VercelResponse, reservations: Collection<ReservationItem>,
  users: Collection<DBUser>, clubTimeZone: string) => {
    const reservation_id = req.body?.reservation_id;
    const deleteType = req.body?.delete_type ?? 'all';
    if (!['once', 'once_and_future', 'all'].includes(deleteType)) {
      throw createAppError('RESERVATION_DELETE_TYPE_INVALID');
    }
    if (!reservation_id || typeof reservation_id !== 'string') {
      const { status, body } = getAppErrorResponse('RESERVATION_ID_REQUIRED');
      return res.status(status).json(body);
    }

    // console.log(`Deleting reserveration with id ${reservation_id}`);
    const query = {
      _id: ObjectId.createFromHexString(reservation_id)
    };
    const reservation = await reservations.findOne(query);
    if (!reservation) {
      const { status, body } = getAppErrorResponse('RESERVATION_NOT_FOUND');
      return res.status(status).json(body);
    }

    const { payload, user } = await getAuthenticatedUserContext(req, users, {
      requireActive: true
    });

    const club_id = user.club_id;
    if (!club_id) {
      throw createAppError('USER_HAS_NO_CLUB');
    }
    // Reservations are evaluated in the club's timezone, not the server's timezone.
    const reservationIsInPast = isReservationTimeInPast(reservation.date, reservation.start_time, clubTimeZone);
    const reservationIsRecurring = reservation.recurring;
    if (reservationIsInPast && !reservationIsRecurring) {
      throw createAppError('RESERVATION_DELETE_PAST_NOT_ALLOWED');
    }

    const returnResponse = async () => {
      const docs = await getAllReservations(reservations, club_id);
      res.status(200).json({
        message: `Reservation with id ${reservation_id} was deleted.`,
        data: docs
      });
    }

    // only owner of a reservation and admin can delete the reservation
    if (reservation.user_id !== payload._id && user.role !== 'admin') {
      const { status, body } = getAppErrorResponse('RESERVATION_DELETE_OWN_OR_ADMIN_ONLY');
      return res.status(status).json(body);
    }

    if (reservation.club_id !== club_id) {
      const { status, body } = getAppErrorResponse('RESERVATION_DELETE_OWN_CLUB_ONLY');
      return res.status(status).json(body);
    }

    let selectedOccurrenceDate: string | undefined;
    if (reservationIsRecurring && deleteType !== 'all') {
      selectedOccurrenceDate = req.body?.date;
      if (!selectedOccurrenceDate || typeof selectedOccurrenceDate !== 'string') {
        throw createAppError('RESERVATION_DELETE_OCCURRENCE_DATE_REQUIRED');
      }
      if (!reservationIsOnSameDay(reservation, selectedOccurrenceDate)) {
        throw createAppError('RESERVATION_DELETE_OCCURRENCE_INVALID');
      }
      if (isReservationTimeInPast(selectedOccurrenceDate, reservation.start_time, clubTimeZone)) {
        throw createAppError('RESERVATION_DELETE_PAST_NOT_ALLOWED');
      }
    }

    // delete reservation from db
    if (!reservationIsRecurring || deleteType === 'all') {
      const result = await reservations.deleteOne(query);
      if (result.deletedCount > 0) {
        await returnResponse();
      } else {
        const { body } = getAppErrorResponse('RESERVATION_DELETE_FAILED');
        return res.status(500).json(body);
      }
    // add req.body.date to deleted_dates array of reservation doc in db
    } else if (deleteType === 'once') {
      if (reservation.deleted_dates) {
        reservation.deleted_dates.push(selectedOccurrenceDate!);
      } else {
        reservation.deleted_dates = [selectedOccurrenceDate!];
      }
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    // set end_date of reservation doc in db to req.body.date
    } else {
      if (previousOccurrencesWereDeleted(reservation, selectedOccurrenceDate!)) {
        const result = await reservations.deleteOne(query);
        if (result.deletedCount > 0) {
          await returnResponse();
        } else {
          const { body } = getAppErrorResponse('RESERVATION_DELETE_FAILED');
          return res.status(500).json(body);
        }
        return;
      }

      reservation.end_date = selectedOccurrenceDate!;
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    }
};
