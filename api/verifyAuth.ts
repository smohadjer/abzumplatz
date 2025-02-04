import {jwtVerify} from 'jose';
import { jwtSecret } from './_config.js';

export default async (request, response) => {
    const cookies = request.cookies;
    const jwt = cookies?.jwt;
    const secret = new TextEncoder().encode(jwtSecret);

    try {
        const jwtResponse = await jwtVerify(jwt, secret);
        console.log(jwtResponse.payload);
        response.status(200).json({
            name: jwtResponse.payload.name,
            id: jwtResponse.payload.id
        });
    } catch(err) {
        console.error('No jwt token or invalid jwt token, redirecting to login page');
        response.status(200).json({error: err})
    }
}
