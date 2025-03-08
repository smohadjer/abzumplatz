import Ajv from 'ajv';

type Data = {
    [key:string]: string;
}

export function sanitize(data: Data) {
    const temp = {};
    for (const [key, value] of Object.entries(data)) {
        // if a string property has no value don't send it to api
        if (typeof value === 'string' && value.length === 0) {
            // do nothing
        } else {
            temp[key] = value;
        }
    }
    return temp;
}

export const ajv = new Ajv({
    coerceTypes: true,
    allErrors: true, // when set to true all errors for a property are returned instead of just the first error
    strict: false, // by setting strict to false we can add custom properties such as "errorMessage" to schema
    verbose: true // adds additional propertie sto error object that we use for custom error messages
});


