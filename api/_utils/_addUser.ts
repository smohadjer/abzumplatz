import bcrypt from 'bcrypt';
import { Db } from 'mongodb';
import { DBUser } from '../../src/types.js';
import { createError } from './_errors.js';

const saltRounds = 10;

export async function addUser(database: Db, user: DBUser) {
    const collectionUsers = database.collection<DBUser>('users');
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
        throw createError('Diese E-Mail-Adresse wird bereits verwendet.', 'invalid_email');
    }

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    user.password = hashedPassword;
    user.timestamp = new Date();
    const insertResponse = await collectionUsers.insertOne(user);
    return insertResponse;
}
