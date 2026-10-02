import bcrypt from 'bcrypt';
import {MongoClient, ObjectId} from 'mongodb';
import type {VercelRequest, VercelResponse} from '../_utils/_apiTypes.js';
import {database_name, database_uri} from '../_utils/_config.js';
import {checkRateLimit} from '../_utils/_rateLimit.js';
import {getJwtPayload} from './verify.js';
import type {DBUser} from '../../src/types.js';

const rateLimit = 5;
const rateWindowMs = 15 * 60 * 1000;

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', 'DELETE');
        return res.status(405).json({error: 'Method not allowed'});
    }

    const payload = await getJwtPayload(req);
    if (!payload || !ObjectId.isValid(payload._id)) {
        return res.status(401).json({error: 'Nicht authentifiziert.'});
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
        return res.status(400).json({error: 'Bitte geben Sie Ihr Passwort ein.'});
    }

    try {
        await client.connect();
        const database = client.db(database_name);
        const users = database.collection<DBUser>('users');
        const userId = new ObjectId(payload._id);
        const user = await users.findOne({_id: userId});

        if (!user) {
            return res.status(404).json({error: 'Benutzerkonto nicht gefunden.'});
        }
        if (user.role === 'admin') {
            return res.status(403).json({error: 'Administratorkonten können hier nicht gelöscht werden.'});
        }
        const rateLimitResult = await checkRateLimit(database, {
            scope: 'delete-account',
            key: payload._id,
            limit: rateLimit,
            windowMs: rateWindowMs,
        });
        if (rateLimitResult.limited) {
            res.setHeader('Retry-After', String(rateLimitResult.retryAfterSeconds));
            return res.status(429).json({error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.'});
        }
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({error: 'Das Passwort ist nicht korrekt.'});
        }

        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                await database.collection('reservations').deleteMany({user_id: payload._id}, {session});
                await database.collection('tournament_registrations').deleteMany({user_ids: payload._id}, {session});
                await database.collection('notification_recipients').deleteMany({user_id: userId}, {session});
                const deletion = await users.deleteOne({_id: userId, role: {$ne: 'admin'}}, {session});
                if (deletion.deletedCount !== 1) {
                    throw new Error('Benutzerkonto konnte nicht gelöscht werden.');
                }
            });
        } finally {
            await session.endSession();
        }

        res.setHeader('Set-Cookie', ['jwt=deleted; HttpOnly; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/;']);
        return res.json({message: 'Ihr Konto wurde gelöscht.'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: 'Das Konto konnte nicht gelöscht werden.'});
    }
};
