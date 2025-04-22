import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { jwtSecret, environment, database_uri, database_name } from './_config.js';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { Payload } from './_types';

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/login.json', 'utf8'));
const client = new MongoClient(database_uri);

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
            const { email, password } = req.body;
            //return res.json('Server received valid data');
            let authenticated = false;

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection('users');
                const user = await collection.findOne({ email: email.toLowerCase() });
                if (!user) {
                  throw new Error(`User with email ${email} does not exist!`);
                } else {
                  if (await bcrypt.compare(password, user.password)) {
                    authenticated = true;
                  } else {
                    throw new Error('Login failed');
                  }
                }

                if (authenticated) {
                    const secret = new TextEncoder().encode(jwtSecret);
                    const alg = 'HS256';
                    const payload: Payload = {
                      _id: user._id.toString(),
                      first_name: user.first_name,
                      last_name: user.last_name,
                      club_id: user.club_id,
                      email: user.email,
                      role: user.role,
                    };
                    const token = await new SignJWT(payload)
                      .setProtectedHeader({ alg })
                      .setExpirationTime('10w')
                      .sign(secret);

                    setCookieServerless(res, token);

                    // login form is submitted via ajax, redirect happens on client
                    res.json(payload);

                    // login form is submitted without ajax, redirect happens on server
                    // res.setHeader('Location', '/admin');
                    // res.status(302).end();
                }
            } catch (e) {
                console.error(e.message);

                // login form is submitted via ajax, redirect happens on client
                res.status(401).json({
                    error: [{
                        'instancePath': '/email',
                        'message': e.message
                    }]
                });

                // login form is submitted without ajax, redirect happens on server
                // res.setHeader('Location', '/login');
                // res.status(302).end();
            }
        }
    }
}


function setCookieServerless(res, token) {
    // if we are not running app locally use secure so cookie is sent only over https
    const secure = (environment === 'local') ? '' : '; Secure';

    // set cookie expiry date to a year later
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + 1);

    // setting token in a httpOnly cookie, we need to specify Path since we
    // want browser to send cookie when page outside /api folder is requested
    // as we also use the cookie to allow access to public/admin.html
    res.setHeader('Set-Cookie', [`jwt=${token}; Expires=${cookieDate.toUTCString()}; HttpOnly; Path=/${secure}`]);
  }
