import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import bcrypt from 'bcrypt';

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/signup.json', 'utf8'));
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
            const { first_name, last_name, email, password } = req.body;
            //return res.json('Server received valid data');

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection('users');
                const doc = await collection.findOne({ email });
                if (doc) {
                    throw new Error(`Email ${email} is already exists.`);
                }

                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const user = {
                    first_name,
                    last_name,
                    email,
                    password: hashedPassword
                };
                const insertResponse = await collection.insertOne(user);
                res.status(201).json({message: `User ${first_name} is registered`});
            } catch (e) {
                console.error(e);
                res.status(500).json({error: e.message});
            }
        }
    }
}
