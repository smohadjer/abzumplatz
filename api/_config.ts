import dotenv from 'dotenv';

dotenv.config();

let database_name = '';
let database_uri = '';

export const jwtSecret = process.env.jwtSecret;
export const environment = process.env.environment;

if (environment === 'local') {
    database_uri = process.env.db_uri_local;
    database_name = 'abzumplatz';
}

if (environment === 'prod') {
    database_uri = process.env.db_uri_remote;
    database_name = 'abzumplatz';
}

export { database_uri, database_name };

export const reservationsLimit = 5;

