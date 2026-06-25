import {jwtVerify} from 'jose';
import { jwtSecret } from './_utils/_config.js';
import { AuthenticatedUserResponse, JwtPayload } from '../src/types.js';
import { fetchUsers } from './_utils/_fetchUsers.js';
import { database_uri, database_name } from './_utils/_config.js';
import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}   

const client = new MongoClient(database_uri);

export default async (request: VercelRequest, response: VercelResponse) => {
    const payload = await getJwtPayload(request);

    if (payload) {
        await client.connect();
        const database = client.db(database_name);
        const user_id = payload._id;
        const doc = await fetchUsers(database, user_id, undefined);
        if (!doc) {
            return response.status(404).json({error: 'User not found'});
        }
        const authenticatedUser: AuthenticatedUserResponse = {
            _id: doc._id.toString(),
            first_name: doc.first_name,
            last_name: doc.last_name,
            club_id: doc.club_id ?? '',
            email: doc.email,
            role: doc.role,
            status: doc.status ?? 'inactive',
        };
        return response.json(authenticatedUser);
    } else {
        const error = 'No jwt token or invalid jwt token';
        response.status(401).json({error})
    }
}

export const getJwtPayload = async (req: VercelRequest) : Promise<JwtPayload | undefined> => {
    const jwt = req.cookies?.jwt;
    const authHeader = req.headers.authorization;
    const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    const secret = new TextEncoder().encode(jwtSecret);

    if (typeof token !== 'string' || token.trim().length === 0) {
        return;
    }

    try {
        const jwtResponse = await jwtVerify<JwtPayload>(token, secret);
        // The JWT carries identity/session fields only. Authorization-sensitive
        // status checks must read the current user record from the database.
        return jwtResponse.payload;
    } catch(error) {
        return;
    }
}
