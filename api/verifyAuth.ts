import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';
import { JwtPayload } from '../src/types.js';
import { fetchUsers } from './_fetchUsers.js';
import { database_uri, database_name } from './_config.js';
import { MongoClient } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';

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
        return response.json(doc);

        // response.status(200).json({
        //     first_name: payload.first_name,
        //     last_name: payload.last_name,
        //     email: payload.email,
        //     club_id: payload.club_id,
        //     _id: payload._id,
        //     role: payload.role
        // });
    } else {
        const error = 'No jwt token or invalid jwt token, redirecting to login page';
        response.status(500).json({error})
    }
}

export const getJwtPayload = async (req: VercelRequest) : Promise<JwtPayload | undefined> => {
    const jwt = req.cookies?.jwt;
    const authHeader = req.headers.authorization;
    const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    const secret = new TextEncoder().encode(jwtSecret);

    try {
        const jwtResponse = await jwtVerify<JwtPayload>(token, secret);
        return jwtResponse.payload;
    } catch(error) {
        console.error(error);
        return;
    }
}
