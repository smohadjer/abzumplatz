import dotenv from 'dotenv';

dotenv.config();

let database_name = 'abzumplatz';
let database_uri = '';

export const jwtSecret = process.env.jwtSecret;
export const environment = process.env.environment;

if (environment === 'local') {
    database_uri = process.env.db_uri_local;
}

if (environment === 'stage') {
    database_uri = process.env.db_uri_stage;
}

if (environment === 'prod') {
    database_uri = process.env.db_uri_prod;
}

export { database_uri, database_name };
