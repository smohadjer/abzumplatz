import { sanitize, ajv, getCustomErrorMessage } from './_utils/_lib.js';
import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import { jwtSecret, environment, database_uri, database_name } from './_utils/_config.js';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { AuthenticatedUserResponse, DBUser, JwtPayload } from '../src/types.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { getErrorMessage } from './_utils/_errors.js';

type LoginBody = {
    email: string;
    password: string;
}

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/login.json', 'utf8'));

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST') {
        const body = sanitize(req.body) as LoginBody;
        const validator = ajv.compile(schema);
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
                return res.json({error: errors});
            } else {
                return res.json({error: 'Ungültige Daten.'});
            }
        } else {
            const { email, password } = body;
            const normalizedEmail = email.toLowerCase();
            //return res.json('Server received valid data');
            let authenticated = false;

            try {
                await client.connect();
                const database = client.db(database_name);
                const collection = database.collection<DBUser>('users');
                const user = await collection.findOne({ email: normalizedEmail });
                if (!user) {
                  throw new Error('Anmeldung fehlgeschlagen.');
                } else {
                  if (await bcrypt.compare(password, user.password)) {
                    authenticated = true;
                  } else {
                    throw new Error('Anmeldung fehlgeschlagen.');
                  }
                }

                if (authenticated) {
                    const role = user.role || 'player';

                    if (!user.first_name || !user.last_name) {
                      throw new Error('Benutzerkonto ist unvollständig konfiguriert.');
                    }
                    const secret = new TextEncoder().encode(jwtSecret);
                    const alg = 'HS256';
                    const payload: JwtPayload = {
                      _id: user._id.toString(),
                      first_name: user.first_name,
                      last_name: user.last_name,
                      club_id: user.club_id ?? '',
                      email: user.email,
                      role,
                    };
                    const responsePayload: AuthenticatedUserResponse = {
                      ...payload,
                      status: user.status ?? 'inactive',
                    };
                    const token = await new SignJWT(payload)
                      .setProtectedHeader({ alg })
                      .setExpirationTime('10w')
                      .sign(secret);

                    setCookieServerless(res, token);

                    // login form is submitted via ajax, redirect happens on client
                    return res.json(responsePayload);

                    // login form is submitted without ajax, redirect happens on server
                    // res.setHeader('Location', '/admin');
                    // res.status(302).end();
                }
            } catch (e) {
                const message = getErrorMessage(e);
                console.error(message);

                // login form is submitted via ajax, redirect happens on client
                res.status(401).json({
                    error: [{
                        'instancePath': '/email',
                        'message': message
                    }]
                });

                // login form is submitted without ajax, redirect happens on server
                // res.setHeader('Location', '/login');
                // res.status(302).end();
            }
        }
    }
}


function setCookieServerless(res: VercelResponse, token: string) {
    // if we are not running app locally use secure so cookie is sent only over https
    const secure = (environment === 'local') ? '' : '; Secure';

    // set cookie expiry date to a year later
    const cookieDate = new Date();
    cookieDate.setFullYear(cookieDate.getFullYear() + 1);

    // setting token in a httpOnly cookie, we need to specify Path since we
    // want browser to send cookie when page outside /api folder is requested
    // as we also use the cookie to allow access to public/admin.html
    res.setHeader('Set-Cookie', [`jwt=${token}; Expires=${cookieDate.toUTCString()}; HttpOnly; SameSite=Lax; Path=/${secure}`]);
  }
