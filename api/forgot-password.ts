import sendEmail from './_utils/_sendEmail.js';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { database_uri, database_name } from './_utils/_config.js';
import { VercelRequest, VercelResponse } from '@vercel/node';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

const hashResetToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const myCallback = (res: VercelResponse) => {
    // console.log('Email was sent scuccessfully!');
    res.status(200).send({ message: 'Wenn die E-Mail-Adresse bei uns registriert ist, erhalten Sie in Kürze eine Nachricht mit weiteren Schritten.' });
};

export default async (req: VercelRequest, res: VercelResponse) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expiry = Date.now() + 1800000; // 30 minutes

    if (req.method === 'POST') {
        try {
            await client.connect();
            const database = client.db(database_name);
            const collection = database.collection('users');
            const user = await collection.findOne({ email });
            if (!user) {
                return myCallback(res);
            } else {
                const updateDoc = {
                    $set: {
                      resetTokenHash: tokenHash,
                      resetTokenExpiry: expiry
                    },
                    $unset: {
                      resetToken: ''
                    }
                };
                await collection.updateOne({email}, updateDoc);
                // console.log(
                //     `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
                // );

                const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
                await sendEmail({
                    email,
                    subject: 'Passwort zurücksetzen',
                    html: `<p>Besuchen Sie die <a href="${resetLink}">folgende Seite</a>, um Ihr Kontopasswort zurückzusetzen. Der Link ist 30 Minuten gültig. Nach Ablauf können Sie einen neuen Link anfordern. Nach der Passwortänderung müssen Sie sich mit dem neuen Passwort anmelden.</p>`,
                    callback: () => {
                      myCallback(res);
                    }
                });
            }
        } catch (e) {
            console.error(e.message);

            res.status(500).json({
                error: [{
                    'instancePath': '/email',
                    'message': 'Die Anfrage konnte derzeit nicht verarbeitet werden.'
                }]
            });
        } finally {
            // Close the connection after the operation completes
            // console.log('closing connection')
            await client.close();
        }
    }
}
