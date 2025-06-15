import { ObjectId } from 'mongodb';
import { ReservationItem } from '../src/types.js';
import { isInPast } from '../src/utils/utils.js';
import { getJwtPayload } from './verifyAuth.js';
import { getAllReservations } from '../src/utils/utils.js';

export const deleteReservation = async (req, res, reservations) => {
    const reservation_id: string = req.query?.reservation_id;
    console.log(`Deleting reserveration with id ${reservation_id}`);
    const query = {
      _id: ObjectId.createFromHexString(reservation_id)
    };
    const reservation: ReservationItem = await reservations.findOne(query);
    // reservations in the past that do not recurr can not be deleted
    console.log(reservation);
    const reservationIsInPast = isInPast(new Date(reservation.date), reservation.start_time);
    const reservationIsRecurring = reservation.recurring;
    if (reservationIsInPast && !reservationIsRecurring) {
      throw new Error('Vergangene Reservierungen können nicht gelöscht werden');
    }

    const user = await getJwtPayload(req);
    console.log({user});
    const club_id = user.club_id;

    const returnResponse = async () => {
      const docs = await getAllReservations(reservations, club_id);
      res.status(200).json({
        message: `Reservation with id ${reservation_id} was deleted.`,
        data: docs
      });
    }

    // only owner of reservation and admin can delete it
    if (reservation.user_id !== user._id && user.role !== 'admin') {
      console.log('deleting not allowed');
      res.json({'Error': 'deleting not allowed!'});
    }

    console.log('deleting allowed');

    // delete reservation from db
    if (!reservationIsRecurring || req.body.delete_type === 'all') {
      const result = await reservations.deleteOne(query);
      if (result.deletedCount > 0) {
        await returnResponse();
      } else {
        res.json({'Error': 'Delete failed!'});
      }
    // add req.body.date to deleted_dates array of reservation doc in db
    } else if (req.body.delete_type === 'once') {
      console.log(req.body.date, 'once');
      if (reservation.deleted_dates) {
        reservation.deleted_dates.push(req.body.date);
      } else {
        reservation.deleted_dates = [req.body.date];
      }
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    // set end_date of reservation doc in db to req.body.date
    } else {
      reservation.end_date = req.body.date;
      await reservations.replaceOne(query, reservation);
      await returnResponse();
    }
};
