const database_name = 'abzumplatz';
const jwtSecret = process.env.jwtSecret;
const environment = process.env.environment;
const database_uri = process.env.db_uri;
const plan_limit = process.env.MEMBERS_LIMIT;
const cron_secret = process.env.CRON_SECRET;

export {
    database_name,
    jwtSecret,
    environment,
    database_uri,
    plan_limit,
    cron_secret
};
