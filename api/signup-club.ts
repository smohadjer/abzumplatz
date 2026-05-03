import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import { Club, DBUser } from '../src/types.js';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

type ClubDocument = Omit<Club, '_id'> & {
    timestamp?: Date;
}

type SignupClubBody = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    name: string;
    courts_count: number | string;
    start_hour: number | string;
    end_hour: number | string;
    reservations_limit: number | string;
}

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup-club.json', 'utf8'));

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST') {
        const body = sanitize(req.body) as unknown as SignupClubBody;
        const validator = ajv.compile(schema);
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
        }

        try {
            await client.connect();
            const database = client.db(database_name);
            const clubs = database.collection<ClubDocument>('clubs');
            const existingClub = await clubs.findOne({ name: body.name },{
                collation: { locale: "en", strength: 2 }
            });
            if (existingClub) {
                throw new Error(`Club with name ${body.name} already exists`, {
                    cause: 'name'
                });
            }

            const user: DBUser = {
                first_name: body.first_name,
                last_name: body.last_name,
                email: body.email.toLowerCase(),
                password: body.password,
                role: 'admin',
                status: 'active',
            };
            const userResponse = await addUser(database, user);

            const courts = [];
            for (let i=0; i < Number(body.courts_count); i++) {
                courts.push({
                    status: 'active'
                });
            }

            const club = {
                name: body.name,
                start_hour: Number(body.start_hour),
                end_hour: Number(body.end_hour),
                reservations_limit: Number(body.reservations_limit),
                courts,
                timestamp: new Date()
            };
            const clubResponse = await clubs.insertOne(club);
            const club_id = clubResponse.insertedId.toString();

            await database.collection<DBUser>('users').updateOne(
                {_id: new ObjectId(userResponse.insertedId)},
                {'$set' : {'club_id' : club_id}}
            );

            res.status(201).json({
                message: `Verein ${club.name} ist registeriert mit id ${club_id}`,
            });
        } catch (e) {
            console.error(e);
            const instancePath = (e.cause === 'invalid_email') ? '/email' : `/${e.cause ?? 'undefined'}`;
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
