import bcrypt from 'bcrypt';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
const client = new MongoClient(database_uri);
const saltRounds = 10;

type User = {
    first_name: string;
    last_name: string;
    club_id: string;
    email: string;
    password: string;
    role: string;
}

export async function addUser(user: User) {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('users');
    const collectionClubs = database.collection('clubs');
    collection.createIndex(
        {
           first_name: 1,
           last_name: 1,
        },
        {
           collation:
              {
                 locale : 'en',
                 strength : 1
              }
        }
    );

    const doc = await collection.findOne({ email: user.email });
    if (doc) {
        throw new Error(`Email ${user.email} already exists`, { cause: 'invalid_email' });
    }

    const clubQuery = { _id: ObjectId.createFromHexString(user.club_id)};
    const club = await collectionClubs.findOne(clubQuery);
    if (!club) {
        throw new Error('Club not found', { cause: 'invalid_club'});
    }

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    user.password = hashedPassword;
    const insertResponse = await collection.insertOne(user);
}
