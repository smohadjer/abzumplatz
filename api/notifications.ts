import { MongoClient, ObjectId } from 'mongodb';
import { database_name, database_uri } from './_utils/_config.js';
import { getAuthenticatedUserContext } from './_utils/_authenticatedUser.js';
import { getErrorMessage, isAppError } from './_utils/_errors.js';
import { createClubNotification } from './_utils/_notifications.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import type { DBUser } from '../src/types.js';
import { clubHasProFeatures, PRO_PLAN_FEATURE_ERROR } from './_utils/_planFeatures.js';

if (!database_uri || !database_name) throw new Error('Database configuration is missing');
const client = new MongoClient(database_uri);
const readString = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const users = database.collection<DBUser>('users');
    const {payload, user} = await getAuthenticatedUserContext(req, users, {requireActive: true});
    if (!user.club_id) return res.status(403).json({error: 'Der Benutzer gehört keinem Verein an.'});
    const isAdminManagementRequest = req.method === 'POST'
      || (req.method === 'GET' && req.query?.view === 'published')
      || (req.method === 'PATCH' && req.query?.action === 'edit');
    if (isAdminManagementRequest && !await clubHasProFeatures(database, user.club_id)) {
      return res.status(403).json({error: PRO_PLAN_FEATURE_ERROR});
    }

    if (req.method === 'GET') {
      const limitValue = Number(req.query?.limit ?? 50);
      const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50;
      if (req.query?.view === 'published') {
        if (user.role !== 'admin') return res.status(403).json({error: 'Nur Administratoren dürfen veröffentlichte Benachrichtigungen sehen.'});
        const id = req.query?.id;
        const filter: Record<string, unknown> = {club_id: user.club_id};
        if (id !== undefined) {
          if (Array.isArray(id) || !ObjectId.isValid(id)) return res.status(400).json({error: 'Die Benachrichtigungs-ID ist ungültig.'});
          filter._id = ObjectId.createFromHexString(id);
        }
        const items = await database.collection('notifications').find(
          filter,
          {projection: {type: 1, title: 1, body: 1, link: 1, link_label: 1, created_at: 1, updated_at: 1}}
        ).sort({created_at: -1}).limit(limit).toArray();
        return res.json({
          items: items.map(item => ({
            ...item,
            _id: item._id.toString(),
            created_at: item.created_at.toISOString(),
            ...(item.updated_at ? {updated_at: item.updated_at.toISOString()} : {}),
          })),
        });
      }
      const recipients = database.collection('notification_recipients');
      const [items, unreadCount, dismissedCount] = await Promise.all([
        recipients.aggregate([
          {$match: {user_id: user._id, dismissed_at: {$exists: false}}},
          {$sort: {created_at: -1}},
          {$limit: limit},
          {$lookup: {from: 'notifications', localField: 'notification_id', foreignField: '_id', as: 'notification'}},
          {$unwind: '$notification'},
          {$match: {'notification.club_id': user.club_id}},
          {$project: {
            _id: '$notification._id',
            type: '$notification.type',
            title: '$notification.title',
            body: '$notification.body',
            link: '$notification.link',
            link_label: '$notification.link_label',
            created_at: '$notification.created_at',
            read_at: '$read_at',
          }},
        ]).toArray(),
        recipients.aggregate([
          {$match: {user_id: user._id, read_at: {$exists: false}, dismissed_at: {$exists: false}}},
          {$lookup: {from: 'notifications', localField: 'notification_id', foreignField: '_id', as: 'notification'}},
          {$unwind: '$notification'},
          {$match: {'notification.club_id': user.club_id}},
          {$count: 'count'},
        ]).toArray().then(result => result[0]?.count ?? 0),
        recipients.aggregate([
          {$match: {user_id: user._id, dismissed_at: {$exists: true}}},
          {$lookup: {from: 'notifications', localField: 'notification_id', foreignField: '_id', as: 'notification'}},
          {$unwind: '$notification'},
          {$match: {'notification.club_id': user.club_id}},
          {$count: 'count'},
        ]).toArray().then(result => result[0]?.count ?? 0),
      ]);
      return res.json({
        items: items.map(item => ({
          ...item,
          _id: item._id.toString(),
          created_at: item.created_at.toISOString(),
          ...(item.read_at ? {read_at: item.read_at.toISOString()} : {}),
        })),
        unread_count: unreadCount,
        dismissed_count: dismissedCount,
      });
    }

    if (req.method === 'PATCH') {
      if (req.query?.action === 'edit') {
        if (user.role !== 'admin') return res.status(403).json({error: 'Nur Administratoren dürfen Benachrichtigungen bearbeiten.'});
        const id = req.query?.id;
        if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
          return res.status(400).json({error: 'Die Benachrichtigungs-ID ist ungültig.'});
        }
        const title = readString(req.body?.title);
        const body = readString(req.body?.body);
        const link = readString(req.body?.link);
        const linkLabel = readString(req.body?.link_label);
        if (!title || title.length > 150) {
          return res.status(400).json({error: 'Der Titel ist erforderlich und darf höchstens 150 Zeichen lang sein.'});
        }
        if (!body || body.length > 3000) {
          return res.status(400).json({error: 'Der Text ist erforderlich und darf höchstens 3000 Zeichen lang sein.'});
        }
        if (link && (!link.startsWith('/') || link.startsWith('//'))) {
          return res.status(400).json({error: 'Der Link muss ein interner Pfad sein.'});
        }
        if (linkLabel.length > 100) {
          return res.status(400).json({error: 'Die Link-Beschriftung darf höchstens 100 Zeichen lang sein.'});
        }
        const notificationId = ObjectId.createFromHexString(id);
        const updatedAt = new Date();
        const result = await database.collection('notifications').findOneAndUpdate(
          {_id: notificationId, club_id: user.club_id},
          {$set: {
            title,
            body,
            ...(link ? {link} : {}),
            ...(link && linkLabel ? {link_label: linkLabel} : {}),
            updated_at: updatedAt,
          }, ...(!link ? {$unset: {link: '', link_label: ''}} : !linkLabel ? {$unset: {link_label: ''}} : {})},
          {returnDocument: 'after'}
        );
        if (!result) return res.status(404).json({error: 'Benachrichtigung nicht gefunden.'});
        return res.json({notification: {
          _id: result._id.toString(),
          type: result.type,
          title: result.title,
          body: result.body,
          link: result.link,
          link_label: result.link_label,
          created_at: result.created_at.toISOString(),
          updated_at: updatedAt.toISOString(),
        }});
      }
      if (req.query?.action === 'restore-dismissed') {
        const clubNotifications = await database.collection('notifications')
          .find({club_id: user.club_id}, {projection: {_id: 1}})
          .toArray();
        const result = await database.collection('notification_recipients').updateMany(
          {
            user_id: user._id,
            notification_id: {$in: clubNotifications.map(notification => notification._id)},
            dismissed_at: {$exists: true},
          },
          {$unset: {dismissed_at: ''}}
        );
        return res.json({restored: result.modifiedCount});
      }
      const id = req.query?.id;
      const filter: Record<string, unknown> = {
        user_id: user._id,
        read_at: {$exists: false},
        dismissed_at: {$exists: false},
      };
      if (id === 'all') {
        const clubNotifications = await database.collection('notifications')
          .find({club_id: user.club_id}, {projection: {_id: 1}})
          .toArray();
        filter.notification_id = {$in: clubNotifications.map(notification => notification._id)};
      } else {
        if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
          return res.status(400).json({error: 'Die Benachrichtigungs-ID ist ungültig.'});
        }
        const notificationId = ObjectId.createFromHexString(id);
        const notification = await database.collection('notifications').findOne({_id: notificationId, club_id: user.club_id});
        if (!notification) return res.status(404).json({error: 'Benachrichtigung nicht gefunden.'});
        filter.notification_id = notificationId;
      }
      const result = await database.collection('notification_recipients').updateMany(filter, {$set: {read_at: new Date()}});
      return res.json({updated: result.modifiedCount});
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
        return res.status(400).json({error: 'Die Benachrichtigungs-ID ist ungültig.'});
      }
      const notificationId = ObjectId.createFromHexString(id);
      const notification = await database.collection('notifications').findOne({_id: notificationId, club_id: user.club_id});
      if (!notification) return res.status(404).json({error: 'Benachrichtigung nicht gefunden.'});
      const result = await database.collection('notification_recipients').updateOne(
        {notification_id: notificationId, user_id: user._id, dismissed_at: {$exists: false}},
        {$set: {dismissed_at: new Date()}}
      );
      if (!result.matchedCount) return res.status(404).json({error: 'Benachrichtigung nicht gefunden.'});
      return res.json({dismissed: true});
    }

    if (req.method === 'POST') {
      if (user.role !== 'admin') return res.status(403).json({error: 'Nur Administratoren dürfen Benachrichtigungen veröffentlichen.'});
      const title = readString(req.body?.title);
      const body = readString(req.body?.body);
      const link = readString(req.body?.link);
      const linkLabel = readString(req.body?.link_label);
      if (!title || title.length > 150) {
        return res.status(400).json({error: 'Der Titel ist erforderlich und darf höchstens 150 Zeichen lang sein.'});
      }
      if (!body || body.length > 3000) {
        return res.status(400).json({error: 'Der Text ist erforderlich und darf höchstens 3000 Zeichen lang sein.'});
      }
      if (link && (!link.startsWith('/') || link.startsWith('//'))) {
        return res.status(400).json({error: 'Der Link muss ein interner Pfad sein.'});
      }
      if (linkLabel.length > 100) {
        return res.status(400).json({error: 'Die Link-Beschriftung darf höchstens 100 Zeichen lang sein.'});
      }
      const id = await createClubNotification(database, {
        clubId: user.club_id,
        type: 'announcement',
        title,
        body,
        ...(link ? {link} : {}),
        ...(link && linkLabel ? {linkLabel} : {}),
        createdBy: payload._id,
      });
      const notification = await database.collection('notifications').findOne({_id: id});
      if (!notification) return res.status(500).json({error: 'Die Benachrichtigung konnte nicht geladen werden.'});
      return res.status(201).json({
        notification: {
          _id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          link_label: notification.link_label,
          created_at: notification.created_at.toISOString(),
        },
      });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({error: 'Method not allowed'});
  } catch (error) {
    if (isAppError(error)) return res.status(error.statusCode).json({error: error.message});
    console.error(error);
    return res.status(500).json({error: getErrorMessage(error)});
  }
};
