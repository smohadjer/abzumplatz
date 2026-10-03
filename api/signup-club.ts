import { sanitize, ajv, getCustomErrorMessage } from './_utils/_lib.js';
import * as fs from 'fs';
import { addUser, ensureUserEmailIndex } from './_utils/_addUser.js';
import sendEmail from './_utils/_sendEmail.js';
import { DBUser } from '../src/types.js';
import { MongoClient, MongoServerError, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { ClubDocument, SignupClubBody } from './_utils/_types.js';
import { BillingPeriodDocument, createInitialBillingPeriod, InvoiceCounterDocument } from './_utils/_billingPeriods.js';
import { sendBillingPeriodInvoiceEmail } from './_utils/_billingInvoices.js';
import { createDefaultCompetitionGroups } from './_utils/_competitionGroupDefaults.js';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup-club.json', 'utf8'));
const clubSchema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/club.json', 'utf8'));
const signupSchema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup.json', 'utf8'));
[clubSchema, signupSchema].forEach(sharedSchema => {
    if (!ajv.getSchema(sharedSchema.$id)) {
        ajv.addSchema(sharedSchema);
    }
});

const sendNewClubNotification = async (body: SignupClubBody) => {
    await sendEmail({
        email: 'info@abzumplatz.de',
        subject: `New club registration: ${body.name}`,
        text: `A new club has been registered on Abzumplatz.\n\nClub: ${body.name}\nPlan: ${body.plan_type}\nAdmin: ${body.first_name} ${body.last_name}\nAdmin email: ${body.email}\nCourts: ${body.courts_count}`,
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
            const billingPeriods = database.collection<BillingPeriodDocument>('billing_periods');
            const invoiceCounters = database.collection<InvoiceCounterDocument>('invoice_counters');
            await ensureUserEmailIndex(database);
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

            const registrationStartedAt = new Date();
            const club = {
                name: body.name,
                address_line1: body.address_line1,
                postal_code: body.postal_code,
                city: body.city,
                country: body.country,
                access_plan_type: body.plan_type,
                next_plan_type: body.plan_type,
                start_hour: Number(body.start_hour),
                end_hour: Number(body.end_hour),
                timezone: body.timezone,
                max_reservation_duration: body.max_reservation_duration !== undefined ? Number(body.max_reservation_duration) : 1,
                reservations_limit: body.reservations_limit !== undefined ? Number(body.reservations_limit) : null,
                courts,
                timestamp: registrationStartedAt,
                ...(body.plan_type === 'pro' ? {pro_started_at: registrationStartedAt} : {})
            };
            const clubObjectId = new ObjectId();
            const club_id = clubObjectId.toString();
            let createdProPeriod: BillingPeriodDocument | undefined;
            const session = client.startSession();
            try {
                await session.withTransaction(async () => {
                    const userResponse = await addUser(database, user, session);
                    await clubs.insertOne({...club, _id: clubObjectId}, {session});
                    await createDefaultCompetitionGroups(database, club_id, session);

                    await database.collection<DBUser>('users').updateOne(
                        {_id: userResponse.insertedId},
                        {'$set' : {'club_id' : club_id}},
                        {session}
                    );

                    if (body.plan_type === 'pro') {
                        createdProPeriod = await createInitialBillingPeriod(
                            billingPeriods,
                            invoiceCounters,
                            club_id,
                            'pro',
                            'signup',
                            registrationStartedAt,
                            registrationStartedAt.getDate(),
                            session
                        );
                    }
                });
            } finally {
                await session.endSession();
            }

            let invoiceEmailError: string | undefined;
            if (createdProPeriod) {
                try {
                    await sendBillingPeriodInvoiceEmail(
                        database,
                        {...club, _id: clubObjectId},
                        createdProPeriod,
                        'initial'
                    );
                } catch (error) {
                    console.error('Failed to send invoice email for newly registered club', error);
                    invoiceEmailError = error instanceof Error ? error.message : 'Invoice email delivery failed.';
                }
            }

            try {
                await sendNewClubNotification(body);
            } catch (emailError) {
                console.error('Failed to send new club registration email', emailError);
            }

            res.status(201).json({
                message: `Verein ${club.name} ist registriert mit id ${club_id}`,
                club: {
                    ...club,
                    _id: club_id,
                },
                ...(invoiceEmailError ? {invoice_email_error: invoiceEmailError} : {}),
            });
        } catch (e) {
            console.error(e);
            const duplicateClubName = e instanceof MongoServerError
                && e.code === 11000
                && Boolean(e.keyPattern?.name);
            const instancePath = duplicateClubName
                ? '/name'
                : (e.cause === 'invalid_email') ? '/email' : `/${e.cause ?? 'undefined'}`;
            const message = duplicateClubName
                ? 'Ein Verein mit diesem Namen existiert bereits.'
                : e.cause === 'invalid_email'
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
