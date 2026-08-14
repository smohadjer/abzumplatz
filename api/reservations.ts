import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { getAllReservations } from '../src/utils/utils.js';
import { DBUser, ReservationItem } from '../src/types.js';
import { deleteReservation } from './_utils/_deleteReservation.js';
import { setReservation } from './_utils/_setReservation.js';
import { editReservation } from './_utils/_editReservation.js';
import { ReservationValidationError } from './_utils/_reservationValidation.js';
import { getJwtPayload } from './verifyAuth.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { getErrorMessage, isAppError } from './_utils/_errors.js';

type ReservationClub = {
  deleted_at?: Date | string;
  start_hour: number;
  end_hour: number;
  reservations_limit: number | null;
}

type ReservationRouteBody = {
  delete?: string;
  reservation_id?: string;
}

if (!database_uri || !database_name) {
  throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const reservations = database.collection<ReservationItem>('reservations');
    const clubs = database.collection<ReservationClub>('clubs');
    const users = database.collection<DBUser>('users');

    if (req.method === 'GET' || req.method === 'POST') {
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
      if (!user.club_id) {
        return res.status(403).json({error: 'User does not belong to a club'});
      }

      const club = await clubs.findOne({
        _id: ObjectId.createFromHexString(user.club_id),
        deleted_at: {$exists: false},
      });
      if (!club) {
        return res.status(410).json({error: 'Club has been deleted'});
      }

      if (req.method === 'GET') {
        const docs = await getAllReservations(reservations, user.club_id);
        return res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const body = req.body as ReservationRouteBody;
      if (body.delete === 'true') {
        await deleteReservation(req, res, reservations, users);
      } else if (body.reservation_id) {
        await editReservation(req, res, reservations, clubs, users);
      } else {
        await setReservation(req, res, reservations, clubs, users);
      }
    }
  } catch (e) {
    if (e instanceof ReservationValidationError) {
      return res.status(e.statusCode).json({error: e.message});
    }

    if (isAppError(e)) {
      return res.status(e.statusCode).json({
        code: e.code,
        error: e.message
      });
    }

    const message = getErrorMessage(e);
    console.error(message);
    res.status(500).json({error: message});
  } finally {
    await client.close();
  }
}
