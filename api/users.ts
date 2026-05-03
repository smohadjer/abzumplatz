import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { fetchUsers } from './_fetchUsers.js';
import { getJwtPayload } from './verifyAuth.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('users');

    if (req.method === 'GET') {
      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await collection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const user_id = req.query?.id;
      if (user_id) {
        if (Array.isArray(user_id)) {
          return res.status(400).json({error: 'User id is invalid'});
        }

        const doc = await fetchUsers(database, user_id, undefined);
        if (doc) {
          if (doc._id.toString() !== payload._id && doc.club_id !== requester.club_id) {
            return res.status(403).json({error: 'Reading this member is not allowed'});
          }

          return res.json(doc);
        } else {
          return res.status(404).end();
        }
      } else {
        const club_id = req.query?.club_id;
        if (!club_id) {
            throw new Error('You did not provide club id');
        }
        if (Array.isArray(club_id)) {
          return res.status(400).json({error: 'Club id is invalid'});
        }

        if (requester.club_id !== club_id) {
          return res.status(403).json({error: 'Reading these members is not allowed'});
        }

        const docs = await fetchUsers(database, undefined, club_id);
        return res.json(docs);
      }
    }

    // update user status
    if (req.method === 'POST') {
      const user_id = req.body.user_id;
      const status = req.body.status;
      // console.log(user_id, status);
      if (!user_id || !status) {
        throw new Error('You did not provide user id or status');
      }
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({error: 'Invalid status'});
      }

      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await collection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }
      if (requester.role !== 'admin') {
        return res.status(403).json({error: 'Only admins can update member status'});
      }

      const query = {_id: ObjectId.createFromHexString(user_id)};
      const targetUser = await collection.findOne(query);
      if (!targetUser) {
        return res.status(404).json({error: `User with id ${user_id} not found!`});
      }
      if (targetUser.club_id !== requester.club_id) {
        return res.status(403).json({error: 'Updating this member is not allowed'});
      }

      const updateDoc = {
        $set: {
          status: status
        },
      };
      const result = await collection.updateOne(query, updateDoc);
      if (result.modifiedCount > 0) {
        const user = await collection.findOne(query, {projection: {password: 0, club_id: 0}});
        return res.json(user);
      } else {
        return res.status(404).json({error: `User with id ${user_id} not found!`});
      }
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
