import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

dotenv.config({quiet: true});

const client = new MongoClient(process.env.db_uri);

try {
  await client.connect();
  const database = client.db('abzumplatz');
  await Promise.all([
    database.collection('notifications').createIndex(
      {club_id: 1, source_key: 1},
      {unique: true, partialFilterExpression: {source_key: {$type: 'string'}}}
    ),
    database.collection('notification_recipients').createIndex(
      {notification_id: 1, user_id: 1},
      {unique: true}
    ),
    database.collection('notification_recipients').createIndex(
      {user_id: 1, created_at: -1}
    ),
    database.collection('notification_recipients').createIndex(
      {user_id: 1, read_at: 1}
    ),
  ]);
  console.log('Notification indexes created.');
} finally {
  await client.close();
}
