import { sanitize, ajv, getCustomErrorMessage } from './_utils/_lib.js';
import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage } from './_utils/_errors.js';

type ResetPasswordBody = {
    resetToken: string;
    password: string;
}

type PasswordResetUser = {
    email: string;
    password: string;
    resetToken?: string;
    resetTokenHash?: string;
    resetTokenExpiry?: number;
}

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/resetPassword.json', 'utf8'));

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const saltRounds = 10;
const hashResetToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST') {
        const body = sanitize(req.body) as ResetPasswordBody;
        const validator = ajv.compile(schema);
        const valid = validator(body);
        if (!valid) {
            const errors = validator.errors ?? [];
            errors.map(error => {
                // for custom error messages
                const customErrorMessage = getCustomErrorMessage(error);
                if (customErrorMessage) {
                    error.message = customErrorMessage;
                }
                return error;
            });
            return res.json({error: errors});
        } else {
            const { resetToken, password } = body;
            const resetTokenHash = hashResetToken(resetToken);
            //return res.json('Server received valid data');

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection<PasswordResetUser>('users');
                const filter = {
                    resetTokenHash,
                    resetTokenExpiry: { $gt: Date.now() },
                };
                const doc = await collection.findOne(filter);

                if (!doc) {
                    //throw new Error(`Email ${email} already exists`);
                    return res.status(500).json({error: [
                        {
                            instancePath: '/password',
                            message: 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'
                        }
                    ]});
                }

                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const updateDoc = {
                    $set: {
                        password: hashedPassword,
                    },
                    $unset: {
                        resetToken: '',
                        resetTokenHash: '',
                        resetTokenExpiry: ''
                    }
                };
                await collection.updateOne(filter, updateDoc);
                // console.log(
                //     `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
                // );
                return res.status(201).json({message: `Password is updated now`});
                // res.setHeader('Location', '/login');
                // res.status(302).end();
                //return res.redirect(307, '/login');
            } catch (e) {
                const message = getErrorMessage(e);
                console.error(e);
                return res.status(500).json({error: [{
                    instancePath: '/undefined',
                    message
                }]});
            }
        }
    }
}
