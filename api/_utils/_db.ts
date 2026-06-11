import { MongoClient } from 'mongodb';
import { database_uri } from './_config.js';

if (!database_uri) {
    throw new Error('Database URI is not defined. Please set the DATABASE_URI environment variable.');
}

const client = new MongoClient(database_uri);

export default client;

