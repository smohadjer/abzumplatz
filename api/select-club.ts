import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { JwtPayload } from '../src/types.js';
import { fetchUsers } from './_fetchUsers.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const userCollection = database.collection('users');

    if (req.method === 'POST') {
      const body = sanitize(req.body);
      const { club_id } = body;

      // add club_id to user who posted the club
      if (club_id) {
        const payload: JwtPayload = await getJwtPayload(req);
        const query = {_id: ObjectId.createFromHexString(payload._id)};
        const updateResonse = await userCollection.updateOne(
            query,
            {'$set' : {'club_id' : club_id}}
        );
        console.log(updateResonse);
        //const doc = await fetchUsers(database, payload._id, undefined);
        return res.status(201).json({
          message: `Added club_id ${club_id} to logged-in user in database.`,
          data: {
            club_id
            //doc
          }
        });
      } else {
        const error = 'No club id was submitted...';
        res.status(500).json({error})
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
