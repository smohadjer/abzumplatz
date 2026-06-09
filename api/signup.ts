import { sanitize, ajv, getCustomErrorMessage, escapeHtml } from './_utils/_lib.js';
import * as fs from 'fs';
import { addUser } from './_utils/_addUser.js';
import sendEmail from './_utils/_sendEmail.js';
import type { DBUser } from '../src/types.js';
import type { Db } from 'mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createError, getErrorCause, getErrorMessage } from './_utils/_errors.js';
import { AdminEmailDocument, ClubDocument } from './_utils/_types.js';

type SignupBody = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    club_id?: string;
}

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup.json', 'utf8'));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const getAppOrigin = (req: VercelRequest) => {
    const protocol = req.headers['x-forwarded-proto'] ?? 'https';
    const host = req.headers.host;
    return host ? `${protocol}://${host}` : '';
};

function buildNewUserNotificationEmail(user: DBUser, club: ClubDocument, membersUrl: string) {
    const fullName = `${user.first_name} ${user.last_name}`;
    const registeredAt = new Date().toLocaleString('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Berlin',
    });

    return `
        <p>Ein neuer Benutzer hat sich bei ${escapeHtml(club.name ?? 'Ihrem Verein')} registriert und wartet auf Freischaltung.</p>
        <div style="padding: 10px; background: #f2f2f2;">
            <table cellspacing="0" style="border-collapse: collapse;">
                <tbody>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Name</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(fullName)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>E-Mail</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.email)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Rolle</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.role)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Status</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.status ?? 'inactive')}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Verein</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(club.name)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Vereins-ID</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.club_id ?? '-')}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Registriert am</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(registeredAt)}</td></tr>
                </tbody>
            </table>
        </div>
        <p style="margin-top: 16px;">
            <a href="${escapeHtml(membersUrl)}" style="display: inline-block; padding: 10px 16px; background: #3264c8; color: #ffffff; text-decoration: none; border-radius: 4px;">Neue Mitglieder aktivieren</a>
        </p>
    `;
}

function buildWelcomeEmail(user: DBUser, club?: ClubDocument) {
    const hasClub = Boolean(user.club_id && club);

    return `
        <p>Hallo ${escapeHtml(user.first_name)},</p>
        <p>willkommen bei ${escapeHtml(hasClub ? club?.name : 'abzumplatz.de')}! Ihr Benutzerkonto wurde erfolgreich registriert.</p>
        <div style="padding: 10px; background: #f2f2f2;">
            <table cellspacing="0" style="border-collapse: collapse;">
                <tbody>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Name</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(`${user.first_name} ${user.last_name}`)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>E-Mail</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.email)}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Verein</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(hasClub ? club?.name : '-')}</td></tr>
                    <tr><td style="padding: 6px 6px 6px 0;"><strong>Status</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(user.status ?? 'inactive')}</td></tr>
                </tbody>
            </table>
        </div>
        ${hasClub
            ? '<p>Ihr Konto ist derzeit inaktiv. Bitte warten Sie, bis der Vereinsadministrator Ihr Konto freischaltet.</p>'
            : '<p>Bitte wählen Sie nach dem Login einen Verein aus, um Reservierungen vornehmen zu können.</p>'}
    `;
}

async function notifyClubAdmins(database: Db, user: DBUser, club: ClubDocument, membersUrl: string) {
    if (!user.club_id) {
        return;
    }

    const admins = await database.collection<AdminEmailDocument>('users').find({
        club_id: user.club_id,
        role: 'admin',
        status: 'active',
    }, {
        projection: {
            email: 1,
        }
    }).toArray();
    const adminEmails = admins
        .map(admin => admin.email?.toLowerCase())
        .filter((email): email is string => Boolean(email));

    if (!adminEmails.length) {
        return;
    }

    const subject = `Neue Registrierung wartet auf Freischaltung: ${user.first_name} ${user.last_name}`;
    const html = buildNewUserNotificationEmail(user, club, membersUrl);
    const results = await Promise.allSettled(adminEmails.map(email => sendEmail({
        email,
        subject,
        html,
    })));
    const failedNotifications = results.filter(result => result.status === 'rejected');

    if (failedNotifications.length) {
        throw new Error(`Failed to send ${failedNotifications.length} admin registration notification(s)`);
    }
}

async function sendWelcomeEmail(user: DBUser, club?: ClubDocument) {
    await sendEmail({
        email: user.email,
        subject: `Willkommen bei ${club?.name ?? 'abzumplatz.de'}`,
        html: buildWelcomeEmail(user, club),
    });
}

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST') {
        const validator = ajv.compile(schema);
        const body = sanitize(req.body) as SignupBody;
        const valid = validator(body);
        if (!valid) {
            const errors = validator.errors ?? [];
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
        } else {
            const { first_name, last_name, password } = body;
            const club_id = body.club_id?.trim();
            const email = body.email.toLowerCase();
            const user: DBUser = {
                first_name,
                last_name,
                email,
                password,
                ...(club_id ? {club_id} : {}),
                role: 'player',
                status: 'inactive',
            };

            try {
                await client.connect();
                const database = client.db(database_name);
                let club: ClubDocument | null = null;

                if (club_id) {
                    if (!objectIdPattern.test(club_id)) {
                        throw createError('Der ausgewählte Verein existiert nicht.', 'club_id');
                    }
                    club = await database.collection<ClubDocument>('clubs').findOne({
                        _id: ObjectId.createFromHexString(club_id)
                    });
                    if (!club) {
                        throw createError('Der ausgewählte Verein existiert nicht.', 'club_id');
                    }
                }

                await addUser(database, user);
                if (club && club_id) {
                    try {
                        const membersUrl = `${getAppOrigin(req)}/admin/members?tab=inactive`;
                        await notifyClubAdmins(database, user, club, membersUrl);
                    } catch (notificationError) {
                        console.error('Failed to notify club admins about new user registration', notificationError);
                    }
                }
                try {
                    await sendWelcomeEmail(user, club ?? undefined);
                } catch (welcomeEmailError) {
                    console.error('Failed to send welcome email after new user registration', welcomeEmailError);
                }
                res.status(201).json({
                  message: `User ${first_name} ${last_name} is registered`,
                });
            } catch (e) {
                console.error(e);
                const cause = getErrorCause(e);
                const instancePath = cause === 'invalid_email' ? '/email' : `/${cause ?? 'undefined'}`;
                const message = cause === 'invalid_email'
                    ? 'Registrierung fehlgeschlagen.'
                    : getErrorMessage(e);
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
}
