import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);

type Query = {
    first_name?: string;
    club_id: string;
}

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('users');
    const projection = {
        first_name: 1,
        last_name: 1,
        _id: 1,
    };
    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        const query = {_id: ObjectId.createFromHexString(id)};
        const doc = await collection.findOne(query, {projection})
        if (doc) {
          res.json(doc);
        } else {
          res.status(404).end();
        }
      } else {
        const club_id = req.query?.club_id;

        if (!club_id) {
            throw new Error('You did not provide club id');
        }

        const query: Query = { club_id };

        if (req.query?.first_name) {
            query.first_name = req.query.first_name;
        }

        const docs = await collection.find(query, {projection})
        // using collation so sort is case insensitive
        .collation({
            locale: 'en',
            strength: 2 /* case insensitive search */
        })
        .sort({ first_name: 1 })
        .toArray();
        res.json(docs);
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
