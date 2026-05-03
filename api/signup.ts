import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import { DBUser } from '../src/types.js';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup.json', 'utf8'));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST') {
        const validator = ajv.compile(schema);
        const body = sanitize(req.body);
        const valid = validator(body);
        if (!valid) {
            const errors = validator.errors;
            if (errors) {
                errors.map(error => {
                    // for custom error messages
                    if (error.parentSchema) {
                        const customErrorMessage = error.parentSchema.errorMessage;
                        if (customErrorMessage) {
                        error.message = customErrorMessage;
                        }
                    }
                    return error;
                });
                return res.status(500).json({error: errors});
            } else {
                return res.status(500).json({error: 'Invalid data'});
            }
        } else {
            const { first_name, last_name, password, club_id } = body;
            const email = body.email.toLowerCase();
            const user: DBUser = {
                first_name,
                last_name,
                email,
                password,
                club_id,
                role: 'player',
                status: 'active',
            };

            try {
                await client.connect();
                const database = client.db(database_name);
                if (!objectIdPattern.test(club_id)) {
                    throw new Error(`Club with id ${club_id} does not exist`, { cause: 'club_id' });
                }
                const club = await database.collection('clubs').findOne({
                    _id: ObjectId.createFromHexString(club_id)
                });
                if (!club) {
                    throw new Error(`Club with id ${club_id} does not exist`, { cause: 'club_id' });
                }
                const insertResponse = await addUser(database, user);
                res.status(201).json({
                  message: `User ${first_name} ${last_name} is registered`,
                });
            } catch (e) {
                console.error(e);
                const instancePath = (e.cause === 'invalid_email') ? '/email' : '/undefined';
                res.status(500).json({error: [
                    {
                        instancePath: instancePath,
                        message: e.message
                    }
            ]});
            }  finally {
                await client.close();
            }
        }
    }
}
