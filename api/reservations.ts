import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { getAllReservations } from '../src/utils/utils.js';
import { DBUser, ReservationItem } from '../src/types.js';
import { deleteReservation } from './_deleteReservation.js';
import { setReservation } from './_setReservation.js';
import { editReservation } from './_editReservation.js';
import { ReservationValidationError } from './_reservationValidation.js';
import { getJwtPayload } from './verifyAuth.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

if (!database_uri || !database_name) {
  throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

type ReservationClub = {
  start_hour: number;
  end_hour: number;
  reservations_limit: number;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const reservations = database.collection<ReservationItem>('reservations');
    const clubs = database.collection<ReservationClub>('clubs');
    const users = database.collection<DBUser>('users');

    if (req.method === 'GET') {
      const club_id = req.query?.club_id;
      if (club_id) {
        if (Array.isArray(club_id)) {
          return res.status(400).json({error: 'Club id is invalid'});
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
        if (user.club_id !== club_id) {
          return res.status(403).json({error: 'Reading these reservations is not allowed'});
        }

        const docs = await getAllReservations(reservations, club_id);
        res.json(docs);
      } else {
        res.status(500).end();
      }
    }

    if (req.method === 'POST') {
      if (req.body.delete === 'true') {
        await deleteReservation(req, res, reservations, users);
      } else if (req.body.reservation_id) {
        await editReservation(req, res, reservations, clubs, users);
      } else {
        await setReservation(req, res, reservations, clubs, users);
      }
    }
  } catch (e) {
    if (e instanceof ReservationValidationError) {
      return res.status(e.statusCode).json({error: e.message});
    }

    console.error(e.message);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
