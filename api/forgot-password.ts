import sendEmail from './_sendEmail.js';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);

const myCallback = (res) => {
    console.log('Email was sent scuccessfully!');
    res.status(200).send({ message: "Mail sent" });
};

export default async (req, res) => {
    const {email} = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    if (req.method === 'POST') {
        try {
            await client.connect();
            const database = client.db(database_name);
            const collection = database.collection('users');
            const user = await collection.findOne({ email });
            if (!user) {
                throw new Error(`User with email ${email} does not exist!`);
            } else {
                const updateDoc = {
                    $set: {
                      resetToken: token,
                      resetTokenExpiry: expiry
                    },
                };
                const result = await collection.updateOne({email}, updateDoc);
                console.log(
                    `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
                );

                const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
                sendEmail({
                    email: req.body.email,
                    subject: 'Passwort zurücksetzen',
                    html: `<p>Besuchen Sie die <a href="${resetLink}">folgende Seite</a>, um Ihr Kontopasswort zurückzusetzen. Nach der Passwortänderung müssen Sie sich mit dem neuen Passwort anmelden.</p>`,
                    callback: () => {
                      myCallback(res);
                    }
                });
            }
        } catch (e) {
            console.error(e.message);

            res.status(401).json({
                error: [{
                    'instancePath': '/email',
                    'message': e.message
                }]
            });
        } finally {
            // Close the connection after the operation completes
            console.log('closing connection')
            await client.close();
        }
    }
}
