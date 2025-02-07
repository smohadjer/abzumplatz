import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);

export default async (req, res) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('clubs');
    const projection = {
        name: 1,
        courts_count: 1
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
        const docs = await collection.find({}, {projection})
        // using collation so sort is case insensitive
        .collation({
            locale: 'en',
            strength: 2 /* case insensitive search */
        })
        .sort({ name: 1 })
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
