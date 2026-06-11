import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import sendEmail from './_sendEmail.js';
import { DBUser } from '../src/types.js';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ClubDocument, SignupClubBody } from './types.js';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup-club.json', 'utf8'));

const getPaidUntilOneYearFromNow = () => {
    const paidUntil = new Date();
    paidUntil.setFullYear(paidUntil.getFullYear() + 1);
    return paidUntil.toISOString().slice(0, 10);
};

const sendNewClubNotification = async (body: SignupClubBody, clubId: string) => {
    await sendEmail({
        email: 'info@abzumplatz@de',
        subject: `New club registration: ${body.name}`,
        text: `A new club has been registered on Abzumplatz.\n\nClub: ${body.name}\nClub ID: ${clubId}\nPlan: ${body.plan_type}\nAdmin: ${body.first_name} ${body.last_name}\nAdmin email: ${body.email}\nCourts: ${body.courts_count}`,
    });
};

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
                    const customErrorMessage = getCustomErrorMessage(error);
                    if (customErrorMessage) {
                        error.message = customErrorMessage;
                    }
                    return error;
                });
                return res.status(500).json({error: errors});
            } else {
                return res.status(500).json({error: 'Ungültige Daten.'});
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
                throw new Error('Ein Verein mit diesem Namen existiert bereits.', {
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

            try {
                new Intl.DateTimeFormat('en-US', { timeZone: body.timezone });
            } catch {
                throw new Error('Bitte geben Sie eine gültige IANA-Zeitzone an.', {
                    cause: 'timezone'
                });
            }

            const club = {
                name: body.name,
                address_line1: body.address_line1,
                postal_code: body.postal_code,
                city: body.city,
                country: body.country,
                auto_renew: body.plan_type === 'paid',
                paid_until: body.plan_type === 'paid' ? getPaidUntilOneYearFromNow() : undefined,
                plan_type: body.plan_type,
                members_limit: body.plan_type === 'free' ? 100 : null,
                start_hour: Number(body.start_hour),
                end_hour: Number(body.end_hour),
                timezone: body.timezone,
                reservations_limit: body.reservations_limit !== undefined ? Number(body.reservations_limit) : null,
                courts,
                timestamp: new Date()
            };
            const clubResponse = await clubs.insertOne(club);
            const club_id = clubResponse.insertedId.toString();

            await database.collection<DBUser>('users').updateOne(
                {_id: new ObjectId(userResponse.insertedId)},
                {'$set' : {'club_id' : club_id}}
            );

            try {
                await sendNewClubNotification(body, club_id);
            } catch (emailError) {
                console.error('Failed to send new club registration email', emailError);
            }

            res.status(201).json({
                message: `Verein ${club.name} ist registeriert mit id ${club_id}`,
            });
        } catch (e) {
            console.error(e);
            const instancePath = (e.cause === 'invalid_email') ? '/email' : `/${e.cause ?? 'undefined'}`;
            const message = e.cause === 'invalid_email'
                ? 'Registrierung fehlgeschlagen.'
                : e.message;
            res.status(500).json({error: [
                {
                    instancePath: instancePath,
                    message
                }
            ]});
        }  finally {
            await client.close();
        }
    }
}
