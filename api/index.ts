import client from './_db.js';
import {database_name} from './_config.js';

export default async (req, res) => {
    try {
        await client.connect();
        const database = client.db(database_name);
        const collection = database.collection('users');
        const projection = {
            // name: 1,
            // courts_count: 1
        };

        if (req.method === 'GET') {
            const club_id = req.query?.club_id;
            if (club_id) {
              const query = {club_id};
              const docs = await collection.find(query, {projection}).toArray();
              if (docs.length > 0) {
                res.json(docs);
              } else {
                res.status(500).end();
              }
            } else {
              res.status(500).end();
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
