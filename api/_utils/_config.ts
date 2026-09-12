const database_name = 'abzumplatz';
const jwtSecret = process.env.jwtSecret;
const environment = process.env.environment;
const database_uri = process.env.db_uri;
const plan_limit = process.env.MEMBERS_LIMIT;
const cron_secret = process.env.CRON_SECRET;
const bank_iban = process.env.BANK_IBAN;
const bank_name = process.env.BANK_NAME;
const bank_account_holder = process.env.BANK_ACCOUNT_HOLDER;
const invoice_email_from = process.env.INVOICE_EMAIL_FROM ?? 'rechnung@abzumplatz.de';

export {
    bank_account_holder,
    bank_iban,
    bank_name,
    database_name,
    jwtSecret,
    environment,
    database_uri,
    invoice_email_from,
    plan_limit,
    cron_secret
};
