import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '../_utils/_apiTypes.js';
import { database_name, database_uri, operator_phone } from '../_utils/_config.js';
import sendEmail from '../_utils/_sendEmail.js';
import {getJwtPayload} from '../_auth/verify.js';
import {checkRateLimit} from '../_utils/_rateLimit.js';
import {fetchUsers} from '../_utils/_fetchUsers.js';

type ContactBody = {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    website?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rateLimit = 5;
const rateWindowMs = 60 * 60 * 1000;

if (!database_uri) {
    throw new Error('Contact form configuration is missing');
}

const client = new MongoClient(database_uri);

function getClientAddress(req: VercelRequest) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const address = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0];
    return address?.trim() || req.socket.remoteAddress || 'unknown';
}

async function isRateLimited(req: VercelRequest) {
    await client.connect();
    return checkRateLimit(client.db(database_name), {
        scope: 'contact',
        key: getClientAddress(req),
        limit: rateLimit,
        windowMs: rateWindowMs,
    });
}

export default async function contact(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        const payload = await getJwtPayload(req);
        if (!payload) {
            return res.status(401).json({error: 'Authentication required'});
        }

        await client.connect();
        const user = await fetchUsers(client.db(database_name), payload._id, undefined);
        if (!user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        if (!operator_phone) {
            return res.status(503).json({error: 'Contact number is not configured'});
        }

        return res.status(200).json({phone: operator_phone});
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({error: 'Method not allowed'});
    }

    const body = (req.body ?? {}) as ContactBody;
    if (typeof body.website === 'string' && body.website.trim()) {
        return res.status(200).json({message: 'Nachricht wurde gesendet.'});
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || email.length > 254 || message.length < 10 || message.length > 5000) {
        return res.status(400).json({error: 'Bitte prüfen Sie Ihre Angaben.'});
    }

    try {
        const rateLimitResult = await isRateLimited(req);
        if (rateLimitResult.limited) {
            res.setHeader('Retry-After', String(rateLimitResult.retryAfterSeconds));
            return res.status(429).json({error: 'Zu viele Nachrichten. Bitte versuchen Sie es später erneut.'});
        }

        await sendEmail({
            email: 'support@abzumplatz.de',
            replyTo: email,
            subject: `Kontaktanfrage von ${name}`,
            text: `Name: ${name}\nE-Mail: ${email}\n\n${message}`,
        });
    } catch (error) {
        console.error('Contact message delivery failed', error);
        return res.status(500).json({error: 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'});
    }

    return res.status(200).json({message: 'Vielen Dank. Ihre Nachricht wurde gesendet.'});
}
