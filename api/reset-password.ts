import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import bcrypt from 'bcrypt';

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/resetPassword.json', 'utf8'));
const client = new MongoClient(database_uri);
const saltRounds = 10;

export default async (req, res) => {
    if (req.method === 'POST') {
        const validator = ajv.compile(schema);
        const valid = validator(sanitize(req.body));
        if (!valid) {
            const errors = validator.errors;
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
            return res.json({error: errors});
        } else {
            const { resetToken, password } = req.body;
            //return res.json('Server received valid data');

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection('users');
                const filter = {
                    resetToken,
                    resetTokenExpiry: { $gt: Date.now() },
                };
                const doc = await collection.findOne(filter);

                if (!doc) {
                    //throw new Error(`Email ${email} already exists`);
                    return res.status(500).json({error: [
                        {
                            instancePath: '/password',
                            message: `No user with valid token was found!`
                        }
                    ]});
                }

                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const updateDoc = {
                    $set: {
                        password: hashedPassword,
                        resetToken: undefined,
                        resetTokenExpiry: undefined
                    },
                };
                const result = await collection.updateOne(filter, updateDoc);
                console.log(
                    `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
                );
                return res.status(201).json({message: `Password is updated now`});
                // res.setHeader('Location', '/login');
                // res.status(302).end();
                //return res.redirect(307, '/login');
            } catch (e) {
                console.error(e);
                return res.status(500).json({error: [{
                    instancePath: '/undefined',
                    message: e.message
                }]});
            }
        }
    }
}
