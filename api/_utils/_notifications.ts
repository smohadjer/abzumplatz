import { ObjectId, type Db } from 'mongodb';
import type { DBUser, NotificationType } from '../../src/types.js';

type CreateClubNotificationOptions = {
  clubId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  linkLabel?: string;
  createdBy: string;
  sourceKey?: string;
};

export async function createClubNotification(database: Db, options: CreateClubNotificationOptions) {
  const notifications = database.collection('notifications');
  const now = new Date();
  let notificationId: ObjectId;

  if (options.sourceKey) {
    const notification = await notifications.findOneAndUpdate(
      {club_id: options.clubId, source_key: options.sourceKey},
      {$setOnInsert: {
        club_id: options.clubId,
        type: options.type,
        title: options.title,
        body: options.body,
        ...(options.link ? {link: options.link} : {}),
        ...(options.link && options.linkLabel ? {link_label: options.linkLabel} : {}),
        source_key: options.sourceKey,
        created_by: options.createdBy,
        created_at: now,
      }},
      {upsert: true, returnDocument: 'after'}
    );
    if (!notification) throw new Error('Die Benachrichtigung konnte nicht erstellt werden.');
    notificationId = notification._id;
  } else {
    notificationId = (await notifications.insertOne({
      club_id: options.clubId,
      type: options.type,
      title: options.title,
      body: options.body,
      ...(options.link ? {link: options.link} : {}),
      ...(options.link && options.linkLabel ? {link_label: options.linkLabel} : {}),
      created_by: options.createdBy,
      created_at: now,
    })).insertedId;
  }

  const recipients = await database.collection<DBUser>('users').find({
    club_id: options.clubId,
  }, {projection: {_id: 1}}).toArray();

  if (recipients.length) {
    await database.collection('notification_recipients').bulkWrite(recipients.map(recipient => ({
      updateOne: {
        filter: {notification_id: notificationId, user_id: recipient._id},
        update: {$setOnInsert: {notification_id: notificationId, user_id: recipient._id, created_at: now}},
        upsert: true,
      },
    })), {ordered: false});
  }

  return notificationId;
}
