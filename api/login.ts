import { sanitize, ajv } from './_lib.js';
import * as fs from 'fs';

const schema = JSON.parse(fs.readFileSync(process.cwd() + '/schema/login.json', 'utf8'));

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
            return res.json('Server received valid data');
        }
    }
}
