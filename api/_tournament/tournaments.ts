import { Collection, MongoClient, ObjectId } from 'mongodb';
import { database_name, database_uri } from '../_utils/_config.js';
import { getAuthenticatedUserContext } from '../_utils/_authenticatedUser.js';
import { getErrorMessage, isAppError } from '../_utils/_errors.js';
import type { VercelRequest, VercelResponse } from '../_utils/_apiTypes.js';
import type { CompetitionType, DBUser, TournamentPaymentMethod, TournamentStatus } from '../../src/types.js';

type StoredTournamentStatus = TournamentStatus | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';

type TournamentDocument = {
  _id?: ObjectId;
  club_id: string;
  name: string;
  description?: string;
  format?: string;
  start_date: string;
  end_date: string;
  registration_deadline: Date;
  draw?: Date;
  entry_fee?: number;
  payment_method?: TournamentPaymentMethod;
  status: StoredTournamentStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
};

type CompetitionGroupDocument = {
  _id?: ObjectId;
  club_id: string;
  name: string;
  competition_type: CompetitionType;
  sex?: 'male' | 'female' | 'mixed';
  min_age?: number;
  max_age?: number;
};

type TournamentGroupDocument = {
  _id?: ObjectId;
  tournament_id: ObjectId;
  source_group_id: ObjectId;
  name: string;
  competition_type: CompetitionType;
  sex?: 'male' | 'female' | 'mixed';
  min_age?: number;
  max_age?: number;
};

const statuses = new Set<TournamentStatus>([
  'draft',
  'published',
]);
const legacyPublishedStatuses: StoredTournamentStatus[] = ['published', 'registration_open', 'registration_closed', 'in_progress', 'completed'];
const normalizeStatus = (status: StoredTournamentStatus): TournamentStatus => status === 'draft' || status === 'cancelled' ? 'draft' : 'published';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const paymentMethods = new Set<TournamentPaymentMethod>(['cash', 'bank_transfer']);

if (!database_uri || !database_name) {
  throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

const serializeTournament = (
  tournament: TournamentDocument & {_id: ObjectId},
  groups: Array<TournamentGroupDocument & {_id: ObjectId}> = [],
  registrantsCount = 0,
  groupRegistrantsCount: Record<string, number> = {},
  currentUserRegistrations: Record<string, object> = {}
) => ({
  ...tournament,
  status: normalizeStatus(tournament.status),
  _id: tournament._id.toString(),
  groups: groups.map(group => ({
    ...group,
    _id: group._id.toString(),
    tournament_id: group.tournament_id.toString(),
    source_group_id: group.source_group_id.toString(),
  })),
  registration_deadline: tournament.registration_deadline.toISOString(),
  ...(tournament.draw ? {draw: tournament.draw.toISOString()} : {}),
  created_at: tournament.created_at.toISOString(),
  updated_at: tournament.updated_at.toISOString(),
  registrants_count: registrantsCount,
  group_registrants_count: groupRegistrantsCount,
  current_user_registrations: currentUserRegistrations,
});

async function getRegistrantCounts(database: ReturnType<MongoClient['db']>, tournamentIds: ObjectId[], currentUserId: string) {
  const totals = new Map<string, number>();
  const byGroup = new Map<string, Record<string, number>>();
  const currentUserRegistrations = new Map<string, Record<string, object>>();
  if (!tournamentIds.length) return {totals, byGroup, currentUserRegistrations};
  const registrations = await database.collection<{
    tournament_id: ObjectId;
    group_id: ObjectId;
    user_ids: string[];
    registered_at: Date;
  }>('tournament_registrations')
    .find({tournament_id: {$in: tournamentIds}})
    .toArray();
  registrations.forEach(registration => {
    const tournamentId = registration.tournament_id.toString();
    const groupId = registration.group_id.toString();
    const participants = registration.user_ids.length;
    totals.set(tournamentId, (totals.get(tournamentId) ?? 0) + participants);
    const tournamentGroups = byGroup.get(tournamentId) ?? {};
    tournamentGroups[groupId] = (tournamentGroups[groupId] ?? 0) + 1;
    byGroup.set(tournamentId, tournamentGroups);
    if (registration.user_ids.includes(currentUserId)) {
      const tournamentRegistrations = currentUserRegistrations.get(tournamentId) ?? {};
      tournamentRegistrations[groupId] = {
        _id: registration._id.toString(),
        tournament_id: tournamentId,
        group_id: groupId,
        user_ids: registration.user_ids,
        registered_at: registration.registered_at.toISOString(),
      };
      currentUserRegistrations.set(tournamentId, tournamentRegistrations);
    }
  });
  return {totals, byGroup, currentUserRegistrations};
}

async function getTournamentGroups(database: ReturnType<MongoClient['db']>, tournamentIds: ObjectId[]) {
  const groupsByTournament = new Map<string, Array<TournamentGroupDocument & {_id: ObjectId}>>();
  if (!tournamentIds.length) return groupsByTournament;
  const groups = await database.collection<TournamentGroupDocument>('tournament_groups')
    .find({tournament_id: {$in: tournamentIds}})
    .sort({name: 1})
    .toArray();
  groups.forEach(group => {
    const tournamentId = group.tournament_id.toString();
    const current = groupsByTournament.get(tournamentId) ?? [];
    current.push(group);
    groupsByTournament.set(tournamentId, current);
  });
  return groupsByTournament;
}

const readString = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const createTournamentGroup = (
  tournamentId: ObjectId,
  template: CompetitionGroupDocument & {_id: ObjectId}
): TournamentGroupDocument => ({
  tournament_id: tournamentId,
  source_group_id: template._id,
  name: template.name,
  competition_type: template.competition_type,
  ...(template.sex ? {sex: template.sex} : {}),
  ...(template.min_age !== undefined ? {min_age: template.min_age} : {}),
  ...(template.max_age !== undefined ? {max_age: template.max_age} : {}),
});

async function parseTournamentBody(
  body: VercelRequest['body'],
  clubId: string,
  groups: Collection<CompetitionGroupDocument>,
  existingSourceGroupIds = new Set<string>()
) {
  const name = readString(body?.name);
  const description = readString(body?.description);
  const format = readString(body?.format);
  const startDate = readString(body?.start_date);
  const endDate = readString(body?.end_date);
  const deadlineValue = readString(body?.registration_deadline);
  const drawValue = readString(body?.draw);
  const status = readString(body?.status) as TournamentStatus;
  const paymentMethodValue = readString(body?.payment_method);
  const rawGroupIds = Array.isArray(body?.group_ids) ? body.group_ids : [];

  if (!name) throw new Error('Der Turniername ist erforderlich.');
  if (name.length > 150) throw new Error('Der Turniername darf höchstens 150 Zeichen lang sein.');
  if (description.length > 3000) throw new Error('Die Beschreibung darf höchstens 3000 Zeichen lang sein.');
  if (format.length > 1000) throw new Error('Der Spielmodus darf höchstens 1000 Zeichen lang sein.');
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    throw new Error('Start- und Enddatum sind erforderlich.');
  }
  if (endDate < startDate) throw new Error('Das Enddatum darf nicht vor dem Startdatum liegen.');
  if (!statuses.has(status)) throw new Error('Der Turnierstatus ist ungültig.');
  if (paymentMethodValue && !paymentMethods.has(paymentMethodValue as TournamentPaymentMethod)) {
    throw new Error('Die Zahlungsart ist ungültig.');
  }

  const registrationDeadline = new Date(deadlineValue);
  if (!deadlineValue || Number.isNaN(registrationDeadline.getTime())) {
    throw new Error('Der Meldeschluss ist ungültig.');
  }
  const draw = drawValue ? new Date(drawValue) : undefined;
  if (draw && Number.isNaN(draw.getTime())) {
    throw new Error('Der Zeitpunkt der Auslosung ist ungültig.');
  }
  let entryFee: number | undefined;
  if (body?.entry_fee !== undefined && body.entry_fee !== '') {
    entryFee = Number(body.entry_fee);
    if (!Number.isInteger(entryFee) || entryFee < 0) {
      throw new Error('Das Startgeld muss eine nicht-negative ganze Zahl sein.');
    }
  }

  if (!rawGroupIds.length || !rawGroupIds.every(id => typeof id === 'string' && ObjectId.isValid(id))) {
    throw new Error('Mindestens eine gültige Konkurrenz ist erforderlich.');
  }
  const groupIdStrings = [...new Set(rawGroupIds as string[])];
  const groupIds = groupIdStrings.map(id => ObjectId.createFromHexString(id));
  const matchingGroups = await groups.find({
    _id: {$in: groupIds},
    club_id: clubId,
  }).toArray();
  const matchingGroupIds = new Set(matchingGroups.map(group => group._id.toString()));
  const invalidGroupIds = groupIds.filter(groupId =>
    !matchingGroupIds.has(groupId.toString()) && !existingSourceGroupIds.has(groupId.toString())
  );
  if (invalidGroupIds.length) {
    throw new Error('Eine ausgewählte Konkurrenz gehört nicht zu diesem Verein.');
  }

  return {
    name,
    ...(description ? {description} : {}),
    ...(format ? {format} : {}),
    start_date: startDate,
    end_date: endDate,
    registration_deadline: registrationDeadline,
    ...(draw ? {draw} : {}),
    ...(entryFee !== undefined ? {entry_fee: entryFee} : {}),
    ...(paymentMethodValue ? {payment_method: paymentMethodValue as TournamentPaymentMethod} : {}),
    status,
    selected_group_ids: groupIds,
    group_templates: matchingGroups,
  };
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const users = database.collection<DBUser>('users');
    const tournaments = database.collection<TournamentDocument>('tournaments');
    const groups = database.collection<CompetitionGroupDocument>('competition_groups');
    const tournamentGroups = database.collection<TournamentGroupDocument>('tournament_groups');
    const {payload, user} = await getAuthenticatedUserContext(req, users, {requireActive: true});

    if (!user.club_id) return res.status(403).json({error: 'Der Benutzer gehört keinem Verein an.'});

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        if (Array.isArray(id) || !ObjectId.isValid(id)) {
          return res.status(400).json({error: 'Die Turnier-ID ist ungültig.'});
        }
        const tournament = await tournaments.findOne({
          _id: ObjectId.createFromHexString(id),
          club_id: user.club_id,
          deleted_at: {$exists: false},
          ...(user.role === 'admin' ? {} : {status: {$in: legacyPublishedStatuses}}),
        });
        if (!tournament) return res.status(404).json({error: 'Turnier nicht gefunden.'});
        const [counts, groupsByTournament] = await Promise.all([
          getRegistrantCounts(database, [tournament._id], user._id.toString()),
          getTournamentGroups(database, [tournament._id]),
        ]);
        return res.json(serializeTournament(
          tournament,
          groupsByTournament.get(tournament._id.toString()) ?? [],
          counts.totals.get(tournament._id.toString()) ?? 0,
          counts.byGroup.get(tournament._id.toString()) ?? {},
          counts.currentUserRegistrations.get(tournament._id.toString()) ?? {}
        ));
      }
      const documents = await tournaments.find({
        club_id: user.club_id,
        deleted_at: {$exists: false},
        ...(user.role === 'admin' ? {} : {status: {$in: legacyPublishedStatuses}}),
      })
        .sort({start_date: -1, name: 1})
        .toArray();
      const tournamentIds = documents.map(document => document._id);
      const [counts, groupsByTournament] = await Promise.all([
        getRegistrantCounts(database, tournamentIds, user._id.toString()),
        getTournamentGroups(database, tournamentIds),
      ]);
      return res.json(documents.map(document => serializeTournament(
        document,
        groupsByTournament.get(document._id.toString()) ?? [],
        counts.totals.get(document._id.toString()) ?? 0,
        counts.byGroup.get(document._id.toString()) ?? {},
        counts.currentUserRegistrations.get(document._id.toString()) ?? {}
      )));
    }

    if (user.role !== 'admin') {
      return res.status(403).json({error: 'Nur Administratoren dürfen Turniere verwalten.'});
    }

    if (req.method === 'POST') {
      const parsed = await parseTournamentBody(req.body, user.club_id, groups);
      const {group_templates: groupTemplates, ...parsedData} = parsed;
      const {selected_group_ids: _selectedGroupIds, ...data} = parsedData;
      const now = new Date();
      const document: TournamentDocument = {
        ...data,
        club_id: user.club_id,
        created_by: payload._id,
        created_at: now,
        updated_at: now,
      };
      const result = await tournaments.insertOne(document);
      let insertedGroups: Array<TournamentGroupDocument & {_id: ObjectId}> = [];
      try {
        const groupDocuments = groupTemplates.map(template => createTournamentGroup(result.insertedId, template));
        const groupResult = await tournamentGroups.insertMany(groupDocuments);
        insertedGroups = groupDocuments.map((group, index) => ({...group, _id: groupResult.insertedIds[index]}));
      } catch (error) {
        await Promise.all([
          tournamentGroups.deleteMany({tournament_id: result.insertedId}),
          tournaments.deleteOne({_id: result.insertedId}),
        ]);
        throw error;
      }
      return res.status(201).json(serializeTournament({...document, _id: result.insertedId}, insertedGroups));
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
        return res.status(400).json({error: 'Die Turnier-ID ist ungültig.'});
      }
      const tournamentId = ObjectId.createFromHexString(id);
      const existingTournament = await tournaments.findOne({_id: tournamentId, club_id: user.club_id, deleted_at: {$exists: false}});
      if (!existingTournament) return res.status(404).json({error: 'Turnier nicht gefunden.'});
      const existingGroups = await tournamentGroups.find({tournament_id: tournamentId}).toArray();
      const existingSourceGroupIds = new Set(existingGroups.map(group => group.source_group_id.toString()));
      const parsed = await parseTournamentBody(req.body, user.club_id, groups, existingSourceGroupIds);
      const {group_templates: groupTemplates, selected_group_ids: selectedGroupIds, ...data} = parsed;
      const desiredSourceIds = new Set(selectedGroupIds.map(groupId => groupId.toString()));
      const groupsToRemove = existingGroups.filter(group => !desiredSourceIds.has(group.source_group_id.toString()));
      if (groupsToRemove.length) {
        const registration = await database.collection('tournament_registrations').findOne({
          tournament_id: tournamentId,
          group_id: {$in: groupsToRemove.map(group => group._id)},
        });
        if (registration) {
          return res.status(409).json({error: 'Eine Konkurrenz mit bestehenden Anmeldungen kann nicht aus dem Turnier entfernt werden.'});
        }
      }
      const existingSourceIds = new Set(existingGroups.map(group => group.source_group_id.toString()));
      const groupsToAdd = groupTemplates
        .filter(group => !existingSourceIds.has(group._id.toString()))
        .map(group => createTournamentGroup(tournamentId, group));
      if (groupsToAdd.length) await tournamentGroups.insertMany(groupsToAdd);
      if (groupsToRemove.length) await tournamentGroups.deleteMany({_id: {$in: groupsToRemove.map(group => group._id)}});
      const fieldsToUnset: Record<string, ''> = {};
      if (!data.description) fieldsToUnset.description = '';
      if (!data.format) fieldsToUnset.format = '';
      if (!data.draw) fieldsToUnset.draw = '';
      if (data.entry_fee === undefined) fieldsToUnset.entry_fee = '';
      if (!data.payment_method) fieldsToUnset.payment_method = '';
      const result = await tournaments.findOneAndUpdate(
        {_id: tournamentId, club_id: user.club_id, deleted_at: {$exists: false}},
        {
          $set: {...data, updated_at: new Date()},
          ...(Object.keys(fieldsToUnset).length ? {$unset: fieldsToUnset} : {}),
        },
        {returnDocument: 'after'}
      );
      if (!result) return res.status(404).json({error: 'Turnier nicht gefunden.'});
      const [counts, updatedGroups] = await Promise.all([
        getRegistrantCounts(database, [result._id], user._id.toString()),
        tournamentGroups.find({tournament_id: result._id}).sort({name: 1}).toArray(),
      ]);
      return res.json(serializeTournament(
        result,
        updatedGroups,
        counts.totals.get(result._id.toString()) ?? 0,
        counts.byGroup.get(result._id.toString()) ?? {},
        counts.currentUserRegistrations.get(result._id.toString()) ?? {}
      ));
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) {
        return res.status(400).json({error: 'Die Turnier-ID ist ungültig.'});
      }
      const tournamentId = ObjectId.createFromHexString(id);
      const existingTournament = await tournaments.findOne({_id: tournamentId, club_id: user.club_id, deleted_at: {$exists: false}});
      if (!existingTournament) return res.status(404).json({error: 'Turnier nicht gefunden.'});
      const now = new Date();
      await tournaments.updateOne(
        {_id: tournamentId, club_id: user.club_id, deleted_at: {$exists: false}},
        {$set: {deleted_at: now, updated_at: now}}
      );
      return res.status(200).json({message: 'Turnier gelöscht.'});
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({error: 'Method not allowed'});
  } catch (error) {
    if (isAppError(error)) {
      return res.status(error.statusCode).json({error: error.message});
    }
    console.error(error);
    const message = getErrorMessage(error);
    const knownValidationError = message.startsWith('Der ') || message.startsWith('Das ') || message.startsWith('Die ') || message.startsWith('Mindestens') || message.startsWith('Eine ');
    return res.status(knownValidationError ? 400 : 500).json({error: message});
  }
};
