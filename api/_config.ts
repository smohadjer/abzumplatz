const database_name = 'abzumplatz';
const jwtSecret = process.env.jwtSecret;
const environment = process.env.environment;

let database_uri = '';

if (environment === 'local') {
    database_uri = process.env.db_uri_local;
}

if (environment === 'stage') {
    database_uri = process.env.db_uri_stage;
}

if (environment === 'prod') {
    database_uri = process.env.db_uri_prod;
}

export {
    database_name,
    jwtSecret,
    environment,
    database_uri
};
