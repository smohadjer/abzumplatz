import { ObjectId, Collection } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { DBUser, JwtPayload, ReservationItem } from '../src/types.js';
import { getJwtPayload } from './verifyAuth.js';
import { getAllReservations } from '../src/utils/utils.js';

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
  const user = await users.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });

  if (!user) {
    return res.status(404).json({error: 'User not found'});
  }

  if (reservation.club_id !== user.club_id) {
    return res.status(403).json({error: 'Editing this reservation is not allowed'});
  }

  if (reservation.user_id !== payload._id && user.role !== 'admin') {
    return res.status(403).json({error: 'Editing this reservation is not allowed'});
  }

  const { reservation_id: _reservationId, ...updates } = req.body;
  if (!Object.keys(updates).length) {
    return res.status(400).json({error: 'No reservation fields to update'});
  }

  if (updates.user_id && user.role !== 'admin') {
    return res.status(403).json({error: 'Only admins can assign reservations'});
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
