import { MongoClient, MongoServerError, ObjectId } from 'mongodb';
import { database_name, database_uri } from '../_utils/_config.js';
import { getAuthenticatedUserContext } from '../_utils/_authenticatedUser.js';
import { getErrorMessage, isAppError } from '../_utils/_errors.js';
import type { VercelRequest, VercelResponse } from '../_utils/_apiTypes.js';
import type { CompetitionType, DBUser } from '../../src/types.js';

type TournamentDocument = {
  _id?: ObjectId;
  club_id: string;
  registration_deadline: Date;
  status: 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  deleted_at?: Date;
};

const publishedStatuses: TournamentDocument['status'][] = ['published', 'registration_open', 'registration_closed', 'in_progress', 'completed'];
const isPublished = (status: TournamentDocument['status']) => publishedStatuses.includes(status);

type TournamentGroupDocument = {
  _id?: ObjectId;
  tournament_id: ObjectId;
  competition_type: CompetitionType;
};

type RegistrationDocument = {
  _id?: ObjectId;
  tournament_id: ObjectId;
  group_id: ObjectId;
  user_ids: string[];
  registered_at: Date;
};

if (!database_uri || !database_name) throw new Error('Database configuration is missing');
const client = new MongoClient(database_uri);

const serializeRegistration = (
  registration: RegistrationDocument & {_id: ObjectId},
  members: Map<string, {first_name?: string; last_name?: string}>
) => ({
  ...registration,
  _id: registration._id.toString(),
  tournament_id: registration.tournament_id.toString(),
  group_id: registration.group_id.toString(),
  registered_at: registration.registered_at.toISOString(),
  users: registration.user_ids.map(userId => members.get(userId)).filter(Boolean),
});

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const users = database.collection<DBUser>('users');
    const tournaments = database.collection<TournamentDocument>('tournaments');
    const groups = database.collection<TournamentGroupDocument>('tournament_groups');
    const registrations = database.collection<RegistrationDocument>('tournament_registrations');
    const {user} = await getAuthenticatedUserContext(req, users, {requireActive: true});
    if (!user.club_id) return res.status(403).json({error: 'Der Benutzer gehört keinem Verein an.'});

    if (req.method === 'GET') {
      const tournamentIdValue = req.query?.tournament_id;
      if (!tournamentIdValue || Array.isArray(tournamentIdValue) || !ObjectId.isValid(tournamentIdValue)) {
        return res.status(400).json({error: 'Die Turnier-ID ist ungültig.'});
      }
      const tournamentId = ObjectId.createFromHexString(tournamentIdValue);
      const tournament = await tournaments.findOne({
        _id: tournamentId,
        club_id: user.club_id,
        deleted_at: {$exists: false},
        ...(user.role === 'admin' ? {} : {status: {$in: publishedStatuses}}),
      });
      if (!tournament) return res.status(404).json({error: 'Turnier nicht gefunden.'});

      const documents = await registrations.find({tournament_id: tournamentId}).sort({registered_at: 1}).toArray();
      const memberIds = [...new Set(documents.flatMap(item => item.user_ids))];
      const memberDocuments = memberIds.length ? await users.find(
        {_id: {$in: memberIds.map(id => ObjectId.createFromHexString(id))}},
        {projection: {first_name: 1, last_name: 1}}
      ).toArray() : [];
      const members = new Map(memberDocuments.map(member => [member._id.toString(), member]));
      return res.json(documents.map(document => serializeRegistration(document, members)));
    }

    if (req.method === 'POST') {
      const tournamentIdValue = req.body?.tournament_id;
      const groupIdValue = req.body?.group_id;
      const requestedUserIds = Array.isArray(req.body?.user_ids)
        ? req.body.user_ids
        : [user._id.toString()];
      if (![tournamentIdValue, groupIdValue].every(value => typeof value === 'string' && ObjectId.isValid(value))
        || !requestedUserIds.length
        || !requestedUserIds.every(value => typeof value === 'string' && ObjectId.isValid(value))) {
        return res.status(400).json({error: 'Turnier, Konkurrenz oder Mitglied ist ungültig.'});
      }
      const playerIds = [...new Set(requestedUserIds as string[])];
      if (playerIds.length !== requestedUserIds.length) return res.status(400).json({error: 'Mitglieder dürfen nicht doppelt ausgewählt werden.'});
      if (user.role !== 'admin' && !playerIds.includes(user._id.toString())) {
        return res.status(403).json({error: 'Sie müssen selbst Teil der Anmeldung sein.'});
      }

      const tournamentId = ObjectId.createFromHexString(tournamentIdValue);
      const groupId = ObjectId.createFromHexString(groupIdValue);
      const tournament = await tournaments.findOne({_id: tournamentId, club_id: user.club_id, deleted_at: {$exists: false}});
      if (!tournament) return res.status(404).json({error: 'Turnier nicht gefunden.'});
      if (user.role !== 'admin' && (!isPublished(tournament.status) || tournament.registration_deadline.getTime() < Date.now())) {
        return res.status(409).json({error: 'Die Anmeldung für dieses Turnier ist geschlossen.'});
      }
      const group = await groups.findOne({_id: groupId, tournament_id: tournamentId});
      if (!group) return res.status(404).json({error: 'Konkurrenz nicht gefunden.'});
      const isDoubles = group.competition_type.id === 'double';
      if (isDoubles && playerIds.length !== 2) return res.status(400).json({error: 'Für eine Doppelkonkurrenz sind genau zwei Mitglieder erforderlich.'});
      if (!isDoubles && playerIds.length !== 1) return res.status(400).json({error: 'Für eine Einzelkonkurrenz ist genau ein Mitglied erforderlich.'});

      const players = await users.find({
        _id: {$in: playerIds.map(id => ObjectId.createFromHexString(id))},
        club_id: user.club_id,
        status: 'active',
      }).toArray();
      if (players.length !== playerIds.length) return res.status(400).json({error: 'Alle Teilnehmenden müssen aktive Mitglieder dieses Vereins sein.'});

      const duplicate = await registrations.findOne({
        tournament_id: tournamentId,
        group_id: groupId,
        user_ids: {$in: playerIds},
      });
      if (duplicate) return res.status(409).json({error: 'Mindestens ein Mitglied ist bereits für diese Konkurrenz angemeldet.'});

      const document: RegistrationDocument = {
        tournament_id: tournamentId,
        group_id: groupId,
        user_ids: playerIds,
        registered_at: new Date(),
      };
      let result;
      try {
        result = await registrations.insertOne(document);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          return res.status(409).json({error: 'Mindestens ein Mitglied ist bereits für diese Konkurrenz angemeldet.'});
        }
        throw error;
      }
      const memberMap = new Map(players.map(player => [player._id.toString(), player]));
      return res.status(201).json(serializeRegistration({...document, _id: result.insertedId}, memberMap));
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) return res.status(400).json({error: 'Die Anmeldungs-ID ist ungültig.'});
      const registration = await registrations.findOne({_id: ObjectId.createFromHexString(id)});
      if (!registration) return res.status(404).json({error: 'Anmeldung nicht gefunden.'});
      const tournament = await tournaments.findOne({_id: registration.tournament_id, club_id: user.club_id, deleted_at: {$exists: false}});
      if (!tournament) return res.status(403).json({error: 'Diese Anmeldung gehört nicht zu Ihrem Verein.'});
      if (user.role !== 'admin') {
        const userId = user._id.toString();
        if (!registration.user_ids.includes(userId)) {
          return res.status(403).json({error: 'Sie können nur Ihre eigene Anmeldung entfernen.'});
        }
        if (!isPublished(tournament.status) || tournament.registration_deadline.getTime() < Date.now()) {
          return res.status(409).json({error: 'Die Abmeldung für dieses Turnier ist geschlossen.'});
        }
      }
      await registrations.deleteOne({_id: registration._id});
      return res.json({message: 'Anmeldung entfernt.'});
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({error: 'Method not allowed'});
  } catch (error) {
    if (isAppError(error)) return res.status(error.statusCode).json({error: error.message});
    console.error(error);
    return res.status(500).json({error: getErrorMessage(error)});
  }
};
