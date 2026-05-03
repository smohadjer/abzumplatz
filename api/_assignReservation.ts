import { ObjectId, Collection } from 'mongodb';
import { JwtPayload, ReservationItem } from '../src/types.js';
import { getJwtPayload } from './verifyAuth.js';
import { getAllReservations } from '../src/utils/utils.js';

export const assignReservation = async (
  req,
  res,
  reservations: Collection<ReservationItem>,
  users: Collection
) => {
  const reservation_id: string = req.query?.reservation_id;
  const query = {
    _id: ObjectId.createFromHexString(reservation_id)
  };
  const reservation = await reservations.findOne(query);

  if (!reservation) {
    return res.status(404).json({error: 'Reservation not found'});
  }

  const payload: JwtPayload = await getJwtPayload(req);
  const user = await users.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  if (user.role !== 'admin') {
    return res.status(403).json({error: 'Only admins can assign reservations'});
  }

  if (reservation.club_id !== user.club_id) {
    return res.status(403).json({error: 'Assigning this reservation is not allowed'});
  }

  await reservations.updateOne(query, {
    '$set': {
      user_id: payload._id
    }
  });

  const docs = await getAllReservations(reservations, user.club_id);
  return res.status(200).json({
    message: `Reservation with id ${reservation_id} was assigned.`,
    data: docs
  });
};
