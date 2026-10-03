import bcrypt from 'bcrypt';
import { ClientSession, Db } from 'mongodb';
import { DBUser } from '../../src/types.js';
import { createError } from './_errors.js';

const saltRounds = 10;

export async function ensureUserEmailIndex(database: Db) {
    const collectionUsers = database.collection<DBUser>('users');
    await collectionUsers.createIndex(
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
}

export async function addUser(database: Db, user: DBUser, session?: ClientSession) {
    const collectionUsers = database.collection<DBUser>('users');
    if (!session) await ensureUserEmailIndex(database);
    const options = session ? {session} : undefined;
    const doc = await collectionUsers.findOne({ email: user.email }, options);
    if (doc) {
        throw createError('Diese E-Mail-Adresse wird bereits verwendet.', 'invalid_email');
    }

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    const insertResponse = await collectionUsers.insertOne({
        ...user,
        password: hashedPassword,
        timestamp: new Date(),
    }, options);
    return insertResponse;
}
