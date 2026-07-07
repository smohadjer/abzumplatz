import { MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { fetchUsers } from './_utils/_fetchUsers.js';
import { getJwtPayload } from './verifyAuth.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import sendEmail from './_utils/_sendEmail.js';
import { escapeHtml } from './_utils/_lib.js';
import { ReservationItem } from '../src/types.js';
import { ClubDocument } from './_utils/_types.js';
import { isReservationActive } from '../src/utils/utils.js';
import { BillingPeriodDocument, resolveClubBillingState } from './_utils/_billingPeriods.js';
import { getEffectiveMembersLimitForPlan } from './_utils/_planLimits.js';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function getRequestedUserIds(body: VercelRequest['body']): string[] {
  const singleUserId = isString(body?.user_id) ? body.user_id : undefined;
  const requestedUserIds: string[] = Array.isArray(body?.user_ids)
    ? body.user_ids.filter(isString)
    : singleUserId
      ? [singleUserId]
      : [];

  return requestedUserIds;
}
async function deleteActiveReservationsForUser(
  database: ReturnType<MongoClient['db']>,
  userId: string,
  clubId?: string
) {
  const reservationsCollection = database.collection<ReservationItem>('reservations');
  const reservations = await reservationsCollection.find({
    user_id: userId,
    ...(clubId ? {club_id: clubId} : {})
  }).toArray();
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

function buildStatusChangedEmail(
  targetUser: { first_name?: string; last_name?: string; email?: string; status?: string },
  clubName?: string,
  adminContact?: { first_name?: string; last_name?: string; email?: string }
) {
  const fullName = `${targetUser.first_name ?? ''} ${targetUser.last_name ?? ''}`.trim();
  const statusLabel = targetUser.status === 'active' ? 'aktiv' : 'inaktiv';
  const adminName = `${adminContact?.first_name ?? ''} ${adminContact?.last_name ?? ''}`.trim();

  return `
    <p>Hallo ${escapeHtml(targetUser.first_name ?? '')},</p>
    <p>der Status Ihres Benutzerkontos wurde aktualisiert.</p>
    <div style="padding: 10px; background: #f2f2f2;">
      <table cellspacing="0" style="border-collapse: collapse;">
        <tbody>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>Name</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(fullName)}</td></tr>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>E-Mail</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(targetUser.email)}</td></tr>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>Verein</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(clubName ?? 'Ab zum Platz')}</td></tr>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>Neuer Status</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(statusLabel)}</td></tr>
        </tbody>
      </table>
    </div>
    <p>Bei Fragen zu dieser Änderung wenden Sie sich bitte an ${escapeHtml(adminName || 'die Vereinsverwaltung')} (${escapeHtml(adminContact?.email ?? '-')}).</p>
  `;
}

function buildRemovedFromClubEmail(
  targetUser: { first_name?: string; last_name?: string; email?: string },
  clubName?: string,
  adminContact?: { first_name?: string; last_name?: string; email?: string }
) {
  const fullName = `${targetUser.first_name ?? ''} ${targetUser.last_name ?? ''}`.trim();
  const adminName = `${adminContact?.first_name ?? ''} ${adminContact?.last_name ?? ''}`.trim();

  return `
    <p>Hallo ${escapeHtml(targetUser.first_name ?? '')},</p>
    <p>Sie wurden aus ${escapeHtml(clubName ?? 'Ihrem Verein')} entfernt.</p>
    <div style="padding: 10px; background: #f2f2f2;">
      <table cellspacing="0" style="border-collapse: collapse;">
        <tbody>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>Name</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(fullName)}</td></tr>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>E-Mail</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(targetUser.email)}</td></tr>
          <tr><td style="padding: 6px 6px 6px 0;"><strong>Verein</strong></td><td style="padding: 6px 6px 6px 0;">${escapeHtml(clubName ?? '-')}</td></tr>
        </tbody>
      </table>
    </div>
    <p>Ihr Konto bleibt bestehen, ist aber keinem Verein mehr zugeordnet. Aktive Reservierungen wurden entfernt.</p>
    <p>Bei Fragen wenden Sie sich bitte an ${escapeHtml(adminName || 'die Vereinsverwaltung')} (${escapeHtml(adminContact?.email ?? '-')}).</p>
  `;
}

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection('users');
    const clubCollection = database.collection<ClubDocument>('clubs');
    const billingPeriodsCollection = database.collection<BillingPeriodDocument>('billing_periods');

    if (req.method === 'GET') {
      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await collection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const user_id = req.query?.id;
      if (user_id) {
        if (Array.isArray(user_id)) {
          return res.status(400).json({error: 'User id is invalid'});
        }

        const doc = await fetchUsers(database, user_id, undefined);
        if (doc) {
          if (doc._id.toString() !== payload._id && doc.club_id !== requester.club_id) {
            return res.status(403).json({error: 'Reading this member is not allowed'});
          }

          return res.json(doc);
        } else {
          return res.status(404).end();
        }
      } else {
        const club_id = req.query?.club_id;
        if (!club_id) {
            throw new Error('You did not provide club id');
        }
        if (Array.isArray(club_id)) {
          return res.status(400).json({error: 'Club id is invalid'});
        }

        if (requester.club_id !== club_id) {
          return res.status(403).json({error: 'Reading these members is not allowed'});
        }

        const docs = await fetchUsers(database, undefined, club_id);
        return res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const action = req.body.action;
      const requestedUserIds = getRequestedUserIds(req.body);

      if (!requestedUserIds.length || !action) {
        throw new Error('You did not provide user ids or action');
      }
      if (!['activate', 'deactivate', 'remove'].includes(action)) {
        return res.status(400).json({error: 'Invalid action'});
      }

      const payload = await getJwtPayload(req);
      if (!payload) {
        return res.status(401).json({error: 'Authentication required'});
      }

      const requester = await collection.findOne({
        _id: ObjectId.createFromHexString(payload._id)
      });
      if (!requester) {
        return res.status(401).json({error: 'Authentication required'});
      }
      if (requester.role !== 'admin') {
        return res.status(403).json({error: 'Only admins can update members'});
      }

      const club = requester.club_id ? await clubCollection.findOne({
        _id: ObjectId.createFromHexString(requester.club_id)
      }) : null;
      const billingState = requester.club_id && club
        ? await resolveClubBillingState(clubCollection, billingPeriodsCollection, club)
        : null;
      const resolvedClub = billingState?.club ?? club;
      const currentBillingPeriod = billingState?.currentBillingPeriod ?? null;
      const normalizedUserIds: string[] = [...new Set<string>(requestedUserIds)];
      const targetUsers = [];

      for (const userId of normalizedUserIds) {
        const query = {_id: ObjectId.createFromHexString(userId)};
        const targetUser = await collection.findOne(query);
        if (!targetUser) {
          return res.status(404).json({error: `User with id ${userId} not found!`});
        }
        if (targetUser.club_id !== requester.club_id) {
          return res.status(403).json({error: 'Updating this member is not allowed'});
        }
        if (targetUser.role === 'admin') {
          return res.status(403).json({error: 'Admin users cannot be changed here'});
        }
        if (action === 'remove' && targetUser.status === 'active') {
          return res.status(400).json({error: 'Only inactive members can be removed from club'});
        }

        targetUsers.push({
          userId,
          targetUser,
          query
        });
      }

      const membersLimit = getEffectiveMembersLimitForPlan(resolvedClub?.access_plan_type);
      const updatedUsers: Array<{_id: string; status: string; club_id?: null}> = [];
      const removedUserIds: string[] = [];

      if (action === 'activate' && membersLimit != null) {
        const activeMembersCount = await collection.countDocuments({
          club_id: requester.club_id,
          status: {$ne: 'inactive'}
        });
        const activationCount = targetUsers.filter(({targetUser}) => targetUser.status === 'inactive').length;

        if (activeMembersCount + activationCount > membersLimit) {
          return res.status(400).json({
            error: `In Ihrem Plan können höchstens ${membersLimit} aktive Mitglieder freigeschaltet werden.`
          });
        }
      }

      for (const {userId, targetUser, query} of targetUsers) {
        if (action === 'remove') {
          await deleteActiveReservationsForUser(database, userId, requester.club_id);
          const result = await collection.updateOne(query, {
            $set: {status: 'inactive'},
            $unset: {club_id: ''}
          });

          if (result.modifiedCount === 0) {
            return res.status(404).json({error: `User with id ${userId} not found!`});
          }

          if (targetUser.email) {
            try {
              await sendEmail({
                email: targetUser.email,
                subject: `Sie wurden aus ${club?.name ?? 'Ihrem Verein'} entfernt`,
                html: buildRemovedFromClubEmail({
                  first_name: targetUser.first_name,
                  last_name: targetUser.last_name,
                  email: targetUser.email,
                }, club?.name, {
                  first_name: requester.first_name,
                  last_name: requester.last_name,
                  email: requester.email,
                }),
              });
            } catch (emailError) {
              console.error('Failed to send member removal email', emailError);
            }
          }

          removedUserIds.push(targetUser._id.toString());
          continue;
        }

        const status = action === 'activate' ? 'active' : 'inactive';

        if (status === 'inactive') {
          await deleteActiveReservationsForUser(database, userId, requester.club_id);
        }

        const result = await collection.updateOne(query, {
          $set: {status}
        });
        if (result.modifiedCount === 0) {
          return res.status(404).json({error: `User with id ${userId} not found!`});
        }

        if (targetUser.email) {
          try {
            await sendEmail({
              email: targetUser.email,
              subject: `Ihr Kontostatus bei ${club?.name ?? 'Ab zum Platz'} wurde aktualisiert`,
              html: buildStatusChangedEmail({
                first_name: targetUser.first_name,
                last_name: targetUser.last_name,
                email: targetUser.email,
                status,
              }, club?.name, {
                first_name: requester.first_name,
                last_name: requester.last_name,
                email: requester.email,
              }),
            });
          } catch (emailError) {
            console.error('Failed to send member status change email', emailError);
          }
        }

        updatedUsers.push({
          _id: targetUser._id.toString(),
          status
        });
      }

      return res.json({
        updatedUsers,
        removedUserIds
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({error: e.message});
  } finally {
    await client.close();
  }
}
