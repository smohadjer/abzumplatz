import client from './_db.js';
import {database_name} from './_config.js';

export default async (req, res) => {
    try {
        await client.connect();
        const database = client.db(database_name);
        const collection = database.collection('users');
        console.log(database_name);
        if (req.method === 'GET') {
			const data = await collection.find({}).limit(100).toArray();
			res.json(data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
