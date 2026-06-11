const database_name = 'abzumplatz';
const jwtSecret = process.env.jwtSecret;
const environment = process.env.environment;
const database_uri = process.env.db_uri;

export {
    database_name,
    jwtSecret,
    environment,
    database_uri
};
