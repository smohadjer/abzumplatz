/*
Run from the project root:

  node migrations/add_status_to_active_for_all_users.js

*/

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const databaseName = 'abzumplatz';
const databaseUri = process.env.db_uri;

if (!databaseUri) {
  throw new Error('Missing db_uri environment variable');
}

const client = new MongoClient(databaseUri);

async function run() {
  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection('users');
    await collection.updateMany({}, {
      $set: {
        status: 'active'
      }
    });
    // console.log(`Updated ${result.modifiedCount} documents`);
  } finally {
    // Close the connection after the operation completes
    await client.close();
  }
}

// Run the program and print any thrown exceptions
run().catch(console.dir);
