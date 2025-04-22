import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';
import { Payload } from './_types';

export default async (request, response) => {
    const payload: Payload = await getJwtPayload(request);

    if (payload) {
        response.status(200).json({
            first_name: payload.first_name,
            last_name: payload.last_name,
            club_id: payload.club_id,
            _id: payload._id,
            role: payload.role
        });
    } else {
        const error = 'No jwt token or invalid jwt token, redirecting to login page';
        response.status(200).json({error})
    }
}

export const getJwtPayload = async (req) : Promise<Payload> => {
    const jwt = req.cookies?.jwt;
    const authHeader = req.headers.authorization;
    const hasBearerAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    const token = hasBearerAuthHeader ? authHeader.split(' ')[1] : jwt;
    const secret = new TextEncoder().encode(jwtSecret);

    try {
        const jwtResponse = await jwtVerify<Payload>(token, secret);
        return jwtResponse.payload;
    } catch(error) {
        console.error(error);
        return;
    }
}
