import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { DBUser } from '../src/types.js';

const saltRounds = 10;

export async function addUser(database, user: DBUser) {
    const collectionUsers = database.collection('users');
    const collectionClubs = database.collection('clubs');
    collectionUsers.createIndex(
        {
           email: 1
        },
        {
            unique: true,
            collation: {
                locale : 'en',
                strength : 1
            }
        }
    );
    const doc = await collectionUsers.findOne({ email: user.email });
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
    const insertResponse = await collectionUsers.insertOne(user);
    return insertResponse;
}
