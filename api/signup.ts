import { sanitize, ajv, getCustomErrorMessage } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import sendEmail from './_sendEmail.js';
import type { DBUser } from '../src/types.js';
import type { Db } from 'mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/signup.json', 'utf8'));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

type ClubDocument = {
    name?: string;
}

type AdminUserDocument = {
    email?: string;
}

function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildNewUserNotificationEmail(user: DBUser, club: ClubDocument) {
    const fullName = `${user.first_name} ${user.last_name}`;
    const registeredAt = new Date().toLocaleString('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Berlin',
    });

    return `
        <p>Ein neuer Benutzer hat sich bei ${escapeHtml(club.name ?? 'Ihrem Verein')} registriert.</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tbody>
                <tr><td><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
                <tr><td><strong>E-Mail</strong></td><td>${escapeHtml(user.email)}</td></tr>
                <tr><td><strong>Rolle</strong></td><td>${escapeHtml(user.role)}</td></tr>
                <tr><td><strong>Status</strong></td><td>${escapeHtml(user.status)}</td></tr>
                <tr><td><strong>Verein</strong></td><td>${escapeHtml(club.name)}</td></tr>
                <tr><td><strong>Vereins-ID</strong></td><td>${escapeHtml(user.club_id)}</td></tr>
                <tr><td><strong>Registriert am</strong></td><td>${escapeHtml(registeredAt)}</td></tr>
            </tbody>
        </table>
    `;
}

function buildWelcomeEmail(user: DBUser, club: ClubDocument) {
    return `
        <p>Hallo ${escapeHtml(user.first_name)},</p>
        <p>willkommen bei ${escapeHtml(club.name ?? 'Ab zum Platz')}! Ihr Benutzerkonto wurde erfolgreich registriert.</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tbody>
                <tr><td><strong>Name</strong></td><td>${escapeHtml(`${user.first_name} ${user.last_name}`)}</td></tr>
                <tr><td><strong>E-Mail</strong></td><td>${escapeHtml(user.email)}</td></tr>
                <tr><td><strong>Verein</strong></td><td>${escapeHtml(club.name)}</td></tr>
                <tr><td><strong>Status</strong></td><td>${escapeHtml(user.status)}</td></tr>
            </tbody>
        </table>
        <p>Sie können sich jetzt in der App anmelden und Plätze reservieren.</p>
    `;
}

async function notifyClubAdmins(database: Db, user: DBUser, club: ClubDocument) {
    const admins = await database.collection<AdminUserDocument>('users').find({
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

    const subject = `Neue Registrierung: ${user.first_name} ${user.last_name}`;
    const html = buildNewUserNotificationEmail(user, club);
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

async function sendWelcomeEmail(user: DBUser, club: ClubDocument) {
    await sendEmail({
        email: user.email,
        subject: `Willkommen bei ${club.name ?? 'Ab zum Platz'}`,
        html: buildWelcomeEmail(user, club),
    });
}

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
                    throw new Error('Der ausgewählte Verein existiert nicht.', { cause: 'club_id' });
                }
                const club = await database.collection<ClubDocument>('clubs').findOne({
                    _id: ObjectId.createFromHexString(club_id)
                });
                if (!club) {
                    throw new Error('Der ausgewählte Verein existiert nicht.', { cause: 'club_id' });
                }
                await addUser(database, user);
                try {
                    await notifyClubAdmins(database, user, club);
                } catch (notificationError) {
                    console.error('Failed to notify club admins about new user registration', notificationError);
                }
                try {
                    await sendWelcomeEmail(user, club);
                } catch (welcomeEmailError) {
                    console.error('Failed to send welcome email after new user registration', welcomeEmailError);
                }
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
