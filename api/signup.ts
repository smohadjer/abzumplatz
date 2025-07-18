import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { addUser } from './_addUser.js';
import { DBUser } from '../src/types.js';
import { fetchUsers } from './_fetchUsers.js';
import { MongoClient } from 'mongodb';
import { database_uri, database_name } from './_config.js';

const client = new MongoClient(database_uri);
const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/signup.json', 'utf8'));

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
            const { first_name, last_name, club_id, password, role } = req.body;
            const email = req.body.email.toLowerCase();
            const user: DBUser = {
                first_name,
                last_name,
                club_id,
                email,
                password,
                role
            };
            try {
                await client.connect();
                const database = client.db(database_name);
                const insertResponse = await addUser(database, user);
                const docs = await fetchUsers(database, undefined, club_id);
                res.status(201).json({
                  message: `User ${first_name} ${last_name} is registered`,
                  data: docs
                });
            } catch (e) {
                console.error(e);
                const instancePath = (e.cause === 'invalid_email') ? '/email' :
                (e.cause === 'invalid_club') ? '/club_id' : '/undefined';
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
