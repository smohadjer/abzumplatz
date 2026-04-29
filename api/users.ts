import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { fetchUsers } from './_fetchUsers.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);

    if (req.method === 'GET') {
      const user_id = req.query?.id;
      if (user_id) {
        const doc = await fetchUsers(database, user_id, undefined);
        if (doc) {
          return res.json(doc);
        } else {
          return res.status(404).end();
        }
      } else {
        const club_id = req.query?.club_id;
        if (!club_id) {
            throw new Error('You did not provide club id');
        }
        const docs = await fetchUsers(database, undefined, club_id);
        return res.json(docs);
      }
    }

    // update user status
    if (req.method === 'POST') {
      const user_id = req.body.user_id;
      const status = req.body.status;
      console.log(user_id, status);
      if (!user_id || !status) {
        throw new Error('You did not provide user id or status');
      }
      const collection = database.collection('users');
      const query = {_id: ObjectId.createFromHexString(user_id)};
      const updateDoc = {
        $set: {
          status: status
        },
      };
      const result = await collection.updateOne(query, updateDoc);
      if (result.modifiedCount > 0) {
        const user = await collection.findOne(query, {projection: {password: 0, club_id: 0, role: 0}});
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
