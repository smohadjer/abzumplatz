import {createHmac} from 'crypto';
import type {Db} from 'mongodb';
import {jwtSecret} from './_config.js';

type RateLimitDocument = {
    _id: string;
    count: number;
    expires_at: Date;
};

type RateLimitOptions = {
    scope: string;
    key: string;
    limit: number;
    windowMs: number;
};

if (!jwtSecret) {
    throw new Error('Rate-limit configuration is missing');
}

export async function checkRateLimit(database: Db, options: RateLimitOptions) {
    const collection = database.collection<RateLimitDocument>('api_rate_limits');
    await collection.createIndex({expires_at: 1}, {expireAfterSeconds: 0});

    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
    const expiresAt = windowStart + options.windowMs;
    const keyHash = createHmac('sha256', jwtSecret)
        .update(`${options.scope}:${options.key}`)
        .digest('hex');
    const result = await collection.findOneAndUpdate(
        {_id: `${options.scope}:${keyHash}:${windowStart}`},
        {
            $inc: {count: 1},
            $setOnInsert: {expires_at: new Date(expiresAt)},
        },
        {upsert: true, returnDocument: 'after'}
    );

    return {
        limited: (result?.count ?? 1) > options.limit,
        retryAfterSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
    };
}
