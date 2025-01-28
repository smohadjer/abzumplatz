import { MongoClient } from 'mongodb';
import { database_uri } from './_config.js';

const client = new MongoClient(database_uri);

export default client;

