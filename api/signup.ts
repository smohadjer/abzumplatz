import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';
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
            const { first_name, last_name, club_id, password, role } = req.body;
            const email = req.body.email.toLowerCase();
            //return res.json('Server received valid data');

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection('users');
                const collectionClubs = database.collection('clubs');
                collection.createIndex(
                    {
                       first_name: 1,
                       last_name: 1,
                    },
                    {
                       collation:
                          {
                             locale : 'en',
                             strength : 1
                          }
                    }
                 )
                const doc = await collection.findOne({ email });
                if (doc) {
                    //throw new Error(`Email ${email} already exists`);
                    return res.status(500).json({error: [
                        {
                            instancePath: '/email',
                            message: `Email ${email} already exists`
                        }
                    ]});
                }

                const clubQuery = { _id: ObjectId.createFromHexString(club_id)};
                const club = await collectionClubs.findOne(clubQuery);
                if (!club) {
                    //throw new Error('Club not found');
                    return res.status(500).json({error: [
                        {
                            instancePath: '/club_id',
                            message: 'Club not found'
                        }
                    ]});
                }

                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const user = {
                    first_name,
                    last_name,
                    club_id,
                    email,
                    password: hashedPassword,
                    role
                };
                const insertResponse = await collection.insertOne(user);
                res.status(201).json({message: `User ${first_name} ${last_name} is registered`});
            } catch (e) {
                console.error(e);
                res.status(500).json({error: [{
                    instancePath: '/undefined',
                    message: e.message
                }]});
            }
        }
    }
}
