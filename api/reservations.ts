import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { getAllReservations } from '../src/utils/utils.js';
import { ReservationItem } from '../src/types.js';
import { deleteReservation } from './_deleteReservation.js';
import { setReservation } from './_setReservation.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const reservations = database.collection<ReservationItem>('reservations');
    const clubs = database.collection('clubs');
    const users = database.collection('users');

    if (req.method === 'GET') {
      const club_id = req.query?.club_id;
      if (club_id) {
        const docs = await getAllReservations(reservations, club_id);
        res.json(docs);
      } else {
        res.status(500).end();
      }
    }

    if (req.method === 'POST') {
      if (req.body.form_method === 'delete') {
        await deleteReservation(req, res, reservations, users);
      } else {
        await setReservation(req, res, reservations, clubs, users);
      }
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
