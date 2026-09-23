import { MongoClient, ObjectId } from 'mongodb';
import { database_name, database_uri } from '../_utils/_config.js';
import { getAuthenticatedUserContext } from '../_utils/_authenticatedUser.js';
import { getErrorMessage, isAppError } from '../_utils/_errors.js';
import type { VercelRequest, VercelResponse } from '../_utils/_apiTypes.js';
import type { CompetitionType, DBUser } from '../../src/types.js';

type CompetitionGroupDocument = {
  _id?: ObjectId;
  club_id: string;
  name: string;
  competition_type: CompetitionType;
  sex?: 'male' | 'female' | 'mixed';
  min_age?: number;
  max_age?: number;
};

if (!database_uri || !database_name) throw new Error('Database configuration is missing');

const client = new MongoClient(database_uri);
const validSexes = new Set(['male', 'female', 'mixed']);
const validCompetitionTypes: Record<string, CompetitionType['name']> = {
  single: 'Einzel',
  double: 'Doppel',
};

const serializeGroup = (group: CompetitionGroupDocument & {_id: ObjectId}) => ({
  ...group,
  _id: group._id.toString(),
});

function parseOptionalAge(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    throw new Error(`${fieldName} muss eine ganze Zahl zwischen 0 und 120 sein.`);
  }
  return age;
}

function parseGroupBody(body: VercelRequest['body']) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) throw new Error('Der Name der Konkurrenz ist erforderlich.');
  if (name.length > 100) throw new Error('Der Name der Konkurrenz darf höchstens 100 Zeichen lang sein.');

  const typeId = body?.competition_type?.id;
  const typeName = body?.competition_type?.name;
  if (typeof typeId !== 'string' || validCompetitionTypes[typeId] !== typeName) {
    throw new Error('Der Konkurrenztyp ist ungültig.');
  }

  const sex = body?.sex === '' || body?.sex === undefined ? undefined : body.sex;
  if (sex !== undefined && (typeof sex !== 'string' || !validSexes.has(sex))) {
    throw new Error('Die Geschlechtsbeschränkung ist ungültig.');
  }

  const minAge = parseOptionalAge(body?.min_age, 'Das Mindestalter');
  const maxAge = parseOptionalAge(body?.max_age, 'Das Höchstalter');
  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    throw new Error('Das Mindestalter darf nicht über dem Höchstalter liegen.');
  }

  return {
    name,
    competition_type: {id: typeId, name: typeName} as CompetitionType,
    ...(sex ? {sex: sex as CompetitionGroupDocument['sex']} : {}),
    ...(minAge !== undefined ? {min_age: minAge} : {}),
    ...(maxAge !== undefined ? {max_age: maxAge} : {}),
  };
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const users = database.collection<DBUser>('users');
    const groups = database.collection<CompetitionGroupDocument>('competition_groups');
    const {user} = await getAuthenticatedUserContext(req, users, {requireActive: true});

    if (!user.club_id) return res.status(400).json({error: 'Der Benutzer gehört keinem Verein an.'});

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        if (Array.isArray(id) || !ObjectId.isValid(id)) return res.status(400).json({error: 'Die Konkurrenz-ID ist ungültig.'});
        const group = await groups.findOne({_id: ObjectId.createFromHexString(id), club_id: user.club_id});
        if (!group) return res.status(404).json({error: 'Konkurrenz nicht gefunden.'});
        return res.json(serializeGroup(group));
      }
      const documents = await groups.find({club_id: user.club_id}).sort({name: 1}).toArray();
      return res.json(documents.map(serializeGroup));
    }

    if (user.role !== 'admin') return res.status(403).json({error: 'Nur Administratoren dürfen Konkurrenzen verwalten.'});

    if (req.method === 'POST') {
      const data = parseGroupBody(req.body);
      const duplicate = await groups.findOne({club_id: user.club_id, name: data.name}, {collation: {locale: 'de', strength: 2}});
      if (duplicate) return res.status(409).json({error: 'Eine Konkurrenz mit diesem Namen existiert bereits.'});
      const document: CompetitionGroupDocument = {...data, club_id: user.club_id};
      const result = await groups.insertOne(document);
      return res.status(201).json(serializeGroup({...document, _id: result.insertedId}));
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) return res.status(400).json({error: 'Die Konkurrenz-ID ist ungültig.'});
      const data = parseGroupBody(req.body);
      const objectId = ObjectId.createFromHexString(id);
      const duplicate = await groups.findOne({_id: {$ne: objectId}, club_id: user.club_id, name: data.name}, {collation: {locale: 'de', strength: 2}});
      if (duplicate) return res.status(409).json({error: 'Eine Konkurrenz mit diesem Namen existiert bereits.'});
      const fieldsToUnset: Record<string, ''> = {};
      if (!data.sex) fieldsToUnset.sex = '';
      if (data.min_age === undefined) fieldsToUnset.min_age = '';
      if (data.max_age === undefined) fieldsToUnset.max_age = '';
      const group = await groups.findOneAndUpdate(
        {_id: objectId, club_id: user.club_id},
        {$set: data, ...(Object.keys(fieldsToUnset).length ? {$unset: fieldsToUnset} : {})},
        {returnDocument: 'after'}
      );
      if (!group) return res.status(404).json({error: 'Konkurrenz nicht gefunden.'});
      return res.json(serializeGroup(group));
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || Array.isArray(id) || !ObjectId.isValid(id)) return res.status(400).json({error: 'Die Konkurrenz-ID ist ungültig.'});
      const objectId = ObjectId.createFromHexString(id);
      const result = await groups.deleteOne({_id: objectId, club_id: user.club_id});
      if (!result.deletedCount) return res.status(404).json({error: 'Konkurrenz nicht gefunden.'});
      return res.json({message: 'Konkurrenz gelöscht.'});
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({error: 'Method not allowed'});
  } catch (error) {
    if (isAppError(error)) return res.status(error.statusCode).json({error: error.message});
    console.error(error);
    const message = getErrorMessage(error);
    const isValidationError = message.startsWith('Der ') || message.startsWith('Das ') || message.startsWith('Die ');
    return res.status(isValidationError ? 400 : 500).json({error: message});
  }
};
