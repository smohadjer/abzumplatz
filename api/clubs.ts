import { Collection, MongoClient, ObjectId, WithId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { sanitize, ajv, getCustomErrorMessage } from './_utils/_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './verifyAuth.js';
import { ClubWithBilling, DBUser, JwtPayload } from '../src/types.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { ClubDocument, ClubFormBody, CourtsFormBody } from './_utils/_types.js';
import { updateCourts } from './_utils/_updateCourts.js';
import { createInitialBillingPeriod, BillingPeriodDocument, getClubBillingState, isDowngradeLocked, processClubBillingRenewal } from './_utils/_billingPeriods.js';
import { getClubPlanState, getPlanChangeUpdate } from './_utils/_planTransitions.js';
import { fetchClub } from './_utils/_fetchClub.js';
import { isLowerPlan } from '../src/planConfig.js';
import { getEffectiveMembersLimitForPlan, hasMembersLimitOverride } from './_utils/_planLimits.js';

if (!database_uri || !database_name) {
    throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

const enrichClubWithBilling = async (
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  doc: ClubDocument | null
) : Promise<ClubWithBilling | null> => {
  if (!doc) {
    return null;
  }

  const { currentBillingPeriod } = await getClubBillingState(
    billingPeriodsCollection,
    doc
  );

  return {
    ...doc,
    _id: doc._id.toString(),
    current_billing_plan_type: currentBillingPeriod?.plan_type,
    current_billing_period_end: currentBillingPeriod?.period_end,
    downgrade_locked: isDowngradeLocked(doc, currentBillingPeriod),
    effective_members_limit: getEffectiveMembersLimitForPlan(doc.access_plan_type),
    members_limit_override_active: hasMembersLimitOverride(),
  };
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection<ClubDocument>('clubs');
    const billingPeriodsCollection = database.collection<BillingPeriodDocument>('billing_periods');
    const userCollection = database.collection<DBUser>('users');

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        if (Array.isArray(id)) {
          return res.status(400).json({error: 'Club id is invalid'});
        }

        const doc = await enrichClubWithBilling(collection, billingPeriodsCollection, await fetchClub(id, collection));
        if (doc) {
          return res.json(doc);
        } else {
          return res.status(404).end();
        }
      } else {
        const docs = await getAllClubs(collection, billingPeriodsCollection);
        return res.json(docs);
      }
    }

    if (req.method === 'POST') {
      const body = sanitize(req.body) as ClubFormBody | CourtsFormBody;

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
      if (requester.role !== 'admin') {
        return res.status(403).json({error: 'Only admins can edit clubs'});
      }

      if ('update_type' in body && body.update_type === 'courts') {
        const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/courts.json', 'utf8'));
        const validator = ajv.compile(schema);
        const valid = validator(body);

        if (!valid) {
          const errors = validator.errors ?? [];
          errors.map(error => {
            const customErrorMessage = getCustomErrorMessage(error);
            if (customErrorMessage) {
              error.message = customErrorMessage;
            }
            return error;
          });
          return res.json({error: errors});
        }

        return await updateCourts(collection, res, body, requester);
      }

      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/club.json', 'utf8'));
      const validator = ajv.compile(schema);
      const valid = validator(body);

      if (!valid) {
          const errors = validator.errors;
          if (errors) {
            errors.map(error => {
                const customErrorMessage = getCustomErrorMessage(error);
                if (customErrorMessage) {
                    error.message = customErrorMessage;
                }
                return error;
            });
            return res.status(500).json({error: errors});
          } else {
            return res.status(500).json({error: 'Ungültige Daten.'});   
          }
      }

      if (body._id) {
        return await updateClub(collection, billingPeriodsCollection, res, body as ClubFormBody, requester);
      } else {
        return await addClub(collection, billingPeriodsCollection, res, body as ClubFormBody, userCollection, payload, requester);
      }
    }

    return res.status(405).json({error: 'Method not allowed'});
  } catch (e) {
    console.error(e);
    const errors = [
      {
        message: e.message,
        instancePath: `#${e.cause}`
      }
    ];
    res.status(500).json({error: errors});
  } finally {
    await client.close();
  }
}

async function addClub(
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  res: VercelResponse,
  body: ClubFormBody,
  userCollection: Collection<DBUser>,
  payload: JwtPayload,
  requester: WithId<DBUser>
) {
  if (requester.club_id) {
    return res.status(403).json({error: 'Creating another club is not allowed'});
  }

  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const timezone = body.timezone;
  const reservations_limit = body.reservations_limit !== undefined ? Number(body.reservations_limit) : null;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    const error = new Error('Bitte geben Sie eine gültige IANA-Zeitzone an.', {
      cause: 'timezone'
    });
    throw error;
  }

  const doc = await collection.findOne({ name: body.name },{
    collation: { locale: "en", strength: 2 }
  });
  if (doc) {
    const error = new Error('Ein Verein mit diesem Namen existiert bereits.', {
      cause: 'name'
    });
    throw error;
  }

  const courts = [];
  for (let i=0; i < Number(body.courts_count); i++) {
    courts.push({
      status: 'active'
    });
  }

  const club = {
    name: body.name,
    address_line1: body.address_line1,
    postal_code: body.postal_code,
    city: body.city,
    country: body.country,
    access_plan_type: body.plan_type,
    next_plan_type: body.plan_type,
    start_hour,
    end_hour,
    timezone,
    reservations_limit,
    courts,
    timestamp: new Date()
  };
  const insertResponse = await collection.insertOne(club);
  const club_id = insertResponse.insertedId.toString();

  await createInitialBillingPeriod(billingPeriodsCollection, club_id, body.plan_type, 'signup');

  if (club_id) {
    const query = {_id: ObjectId.createFromHexString(payload._id)};
    await userCollection.updateOne(
        query,
        {'$set' : {'club_id' : club_id}}
    );
  }

  const docs = await getAllClubs(collection, billingPeriodsCollection);
  res.status(201).json({
    message: `Verein ${club.name} ist registeriert mit id ${club_id}`,
    data: {
      club_id,
      clubs: docs
    }
  });
}

async function updateClub(
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  res: VercelResponse,
  body: ClubFormBody,
  requester: WithId<DBUser>
) {
  if (requester.club_id !== body._id) {
    return res.status(403).json({error: 'Updating this club is not allowed'});
  }

  const courts_count = Number(body.courts_count);
  const start_hour = Number(body.start_hour);
  const end_hour = Number(body.end_hour);
  const timezone = body.timezone;
  const reservations_limit = body.reservations_limit !== undefined ? Number(body.reservations_limit) : null;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    const error = new Error('Bitte geben Sie eine gültige IANA-Zeitzone an.', {
      cause: 'timezone'
    });
    throw error;
  }

  const doc = await fetchClub(body._id, collection);
  if (!doc) {
    return res.status(404).json({error: 'Club not found'});
  }
  const { club: resolvedClub, currentBillingPeriod } = await processClubBillingRenewal(
    collection,
    billingPeriodsCollection,
    doc
  );
  const currentAccessPlanType = resolvedClub.access_plan_type;
  const currentPlanState = getClubPlanState(resolvedClub);
  const selectedPlanType = body.plan_type;
  const downgradeLocked = isDowngradeLocked(resolvedClub, currentBillingPeriod);

  if (downgradeLocked && isLowerPlan(selectedPlanType, currentAccessPlanType)) {
    return res.status(400).json({
      error: 'Nach einem Upgrade ist ein Downgrade erst ab der nächsten Verlängerung möglich.'
    });
  }

  const courts = doc.courts;
  if (courts_count < courts.length) {
    courts.length = courts_count;
  } else if (courts_count > courts.length) {
    const diff = courts_count - courts.length;
    for (let i=0; i < diff; i++) {
      courts.push({
        status: 'active'
      });
    }
  }

  const query = {_id: ObjectId.createFromHexString(body._id)};
  const planUpdateFields: Partial<ClubDocument> = getPlanChangeUpdate(currentPlanState, selectedPlanType);
  const unsetFields: Record<string, string> = {
    plan_type: '',
    members_limit: '',
    auto_renew: '',
  };

  const updateResonse = await collection.updateOne(
      query,
      {'$set' : {
        name : body.name,
        address_line1: body.address_line1,
        postal_code: body.postal_code,
        city: body.city,
        country: body.country,
        start_hour,
        end_hour,
        timezone,
        reservations_limit,
        courts,
        ...planUpdateFields,
      },
      '$unset': unsetFields}
  );

  if (!updateResonse) {
    throw new Error(`Club ${body.name} couldn't be updated`);
  }

  const docs = await getAllClubs(collection, billingPeriodsCollection);
  res.status(201).json({
    message: `Verein ${body.name} ist updated`,
    data: {
      club_id: body._id,
      clubs: docs
    }
  });
}

async function getAllClubs(
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>
) {
    const docs = await collection.find({})
    .collation({
        locale: 'en',
        strength: 2
    })
    .sort({ name: 1 })
    .toArray();
    return await Promise.all(docs.map(doc => enrichClubWithBilling(collection, billingPeriodsCollection, doc)));
};
