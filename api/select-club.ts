import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_config.js';
import { sanitize, escapeHtml } from './_lib.js';
import { getJwtPayload } from './verifyAuth.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { DBUser, ReservationItem } from '../src/types.js';
import sendEmail from './_sendEmail.js';
import { isReservationActive } from '../src/utils/utils.js';

type ClubDocument = {
  name?: string;
}

type AdminUserDocument = {
  email?: string;
}

const validationError = (message: string) => ({
  error: [
    {
      instancePath: '/club_id',
      message,
    }
  ]
});

async function deleteActiveReservationsForUser(
  reservationsCollection: ReturnType<MongoClient['db']>['collection'],
  userId: string,
  clubId?: string
) {
  const reservations = await reservationsCollection.find({
    user_id: userId,
    ...(clubId ? {club_id: clubId} : {})
  }).toArray() as ReservationItem[];
  const activeReservationIds = reservations
    .filter(reservation => isReservationActive(reservation))
    .map(reservation => reservation._id)
    .filter((id): id is ObjectId => Boolean(id));

  if (!activeReservationIds.length) {
    return 0;
  }

  const deleteResult = await reservationsCollection.deleteMany({
    _id: {$in: activeReservationIds}
  });

  return deleteResult.deletedCount;
}

const getAppOrigin = (req: VercelRequest) => {
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers.host;
  return host ? `${protocol}://${host}` : '';
};

function buildClubChangeNotificationEmail(
  user: Pick<DBUser, 'first_name' | 'last_name' | 'email'>,
  fromClubName?: string,
  toClubName?: string,
  membersUrl?: string
) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return `
    <p>Ein Spieler hat seine Vereinszuordnung geändert.</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <tbody>
        <tr><td><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td><strong>E-Mail</strong></td><td>${escapeHtml(user.email)}</td></tr>
        <tr><td><strong>Bisheriger Verein</strong></td><td>${escapeHtml(fromClubName ?? '-')}</td></tr>
        <tr><td><strong>Neuer Verein</strong></td><td>${escapeHtml(toClubName ?? '-')}</td></tr>
      </tbody>
    </table>
    ${membersUrl ? `<p style="margin-top: 16px;"><a href="${escapeHtml(membersUrl)}" style="display: inline-block; padding: 10px 16px; background: #3264c8; color: #ffffff; text-decoration: none; border-radius: 4px;">Neue Mitglieder aktivieren</a></p>` : ''}
  `;
}

async function notifyClubAdminsOfChange(
  database: ReturnType<MongoClient['db']>,
  clubId: string,
  subject: string,
  html: string
) {
  const admins = await database.collection<AdminUserDocument>('users').find({
    club_id: clubId,
    role: 'admin',
    status: 'active',
  }, {
    projection: {
      email: 1,
    }
  }).toArray();
  const adminEmails = admins
    .map(admin => admin.email?.toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (!adminEmails.length) {
    return;
  }

  await Promise.allSettled(adminEmails.map(email => sendEmail({
    email,
    subject,
    html,
  })));
}

if (!database_uri || !database_name) {
  throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const userCollection = database.collection<DBUser>('users');
    const clubCollection = database.collection<ClubDocument>('clubs');
    const reservationsCollection = database.collection<ReservationItem>('reservations');

    if (req.method === 'POST') {
      const body = sanitize(req.body);
      const { club_id, action } = body;
      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await userCollection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }
      if (requester.role === 'admin') {
        return res.status(403).json({error: 'Admins cannot select an existing club'});
      }

      const previousClubId = requester.club_id;
      const previousClub = previousClubId ? await clubCollection.findOne({
        _id: ObjectId.createFromHexString(previousClubId)
      }) : null;
      const query = {_id: ObjectId.createFromHexString(payload._id)};

      if (action === 'leave' || club_id === '') {
        if (previousClubId) {
          await deleteActiveReservationsForUser(reservationsCollection, payload._id, previousClubId);
        }

        await userCollection.updateOne(query, {
          $set: {status: 'inactive'},
          $unset: {club_id: ''}
        });

        if (previousClubId) {
          const html = buildClubChangeNotificationEmail({
            first_name: requester.first_name,
            last_name: requester.last_name,
            email: requester.email,
          }, previousClub?.name, undefined);

          try {
            await notifyClubAdminsOfChange(
              database,
              previousClubId,
              `${requester.first_name} ${requester.last_name} hat ${previousClub?.name ?? 'Ihren Verein'} verlassen`,
              html
            );
          } catch (emailError) {
            console.error('Failed to notify club admins about club leave', emailError);
          }
        }

        return res.status(201).json({
          message: 'Removed club_id from logged-in user in database.',
          data: {
            club_id: '',
            status: 'inactive'
          }
        });
      }

      if (!club_id) {
        return res.status(400).json(validationError('Bitte wählen Sie einen gültigen Verein aus.'));
      }

      const club = await clubCollection.findOne({
        _id: ObjectId.createFromHexString(club_id)
      });
      if (!club) {
        return res.status(404).json(validationError('Verein nicht gefunden.'));
      }

      if (requester.club_id === club_id) {
        return res.status(409).json(validationError('Sie sind diesem Verein bereits zugeordnet.'));
      }

      if (previousClubId && previousClubId !== club_id) {
        await deleteActiveReservationsForUser(reservationsCollection, payload._id, previousClubId);
      }

      await userCollection.updateOne(
        query,
        {'$set' : {'club_id' : club_id, 'status': 'inactive'}}
      );

      const membersUrl = `${getAppOrigin(req)}/admin/members?tab=inactive`;
      const html = buildClubChangeNotificationEmail({
        first_name: requester.first_name,
        last_name: requester.last_name,
        email: requester.email,
      }, previousClub?.name, club.name, membersUrl);

      try {
        await Promise.allSettled([
          ...(previousClubId && previousClubId !== club_id ? [notifyClubAdminsOfChange(
            database,
            previousClubId,
            `${requester.first_name} ${requester.last_name} hat ${previousClub?.name ?? 'Ihren Verein'} verlassen`,
            html
          )] : []),
          notifyClubAdminsOfChange(
            database,
            club_id,
            `${requester.first_name} ${requester.last_name} wartet auf Freischaltung bei ${club.name ?? 'Ihrem Verein'}`,
            html
          )
        ]);
      } catch (emailError) {
        console.error('Failed to notify club admins about club change', emailError);
      }

      return res.status(201).json({
        message: `Added club_id ${club_id} to logged-in user in database.`,
        data: {
          club_id,
          status: 'inactive'
        }
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
