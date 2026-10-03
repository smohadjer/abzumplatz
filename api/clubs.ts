import { Collection, Db, MongoClient, MongoServerError, ObjectId, WithId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { sanitize, ajv, getCustomErrorMessage } from './_utils/_lib.js';
import * as fs from 'fs';
import { getJwtPayload } from './_auth/verify.js';
import { ClubWithBilling, DBUser, JwtPayload } from '../src/types.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { ClubDocument, ClubFormBody, CourtsFormBody, RulesFormBody } from './_utils/_types.js';
import { updateCourts } from './_utils/_updateCourts.js';
import { BillingPeriodDocument, createInitialBillingPeriod, getClubBillingState, InvoiceCounterDocument, ProcessedClubBillingRenewal, resumeClubBilling } from './_utils/_billingPeriods.js';
import { processClubBillingRenewalAndSendInvoices } from './_utils/_billingService.js';
import { sendBillingPeriodInvoiceEmail } from './_utils/_billingInvoices.js';
import { getClubPlanState, getPlanChangeUpdate } from './_utils/_planTransitions.js';
import { fetchClub } from './_utils/_fetchClub.js';
import { isHigherPlan, isLowerPlan } from '../src/planConfig.js';
import { defaultClubRules } from '../src/clubRules.js';
import { createDefaultCompetitionGroups } from './_utils/_competitionGroupDefaults.js';
import bcrypt from 'bcrypt';
import { getProCancellationTerms } from './_utils/_planCancellation.js';

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

  const cancellationTerms = getProCancellationTerms(doc, currentBillingPeriod);

  return {
    ...doc,
    _id: doc._id.toString(),
    current_billing_plan_type: currentBillingPeriod?.plan_type,
    current_billing_period_end: currentBillingPeriod?.period_end,
    ...(cancellationTerms.refundEligibleUntil ? {
      pro_refund_eligible_until: cancellationTerms.refundEligibleUntil.toISOString(),
      pro_refund_eligible: cancellationTerms.refundEligible,
    } : {}),
  };
};

type ClubAdminAuthorization =
  | {requester: WithId<DBUser>}
  | {error: {status: 401 | 403; message: string}};

const authorizeClubAdmin = async (
  req: VercelRequest,
  userCollection: Collection<DBUser>,
  clubId: string
): Promise<ClubAdminAuthorization> => {
  const payload = await getJwtPayload(req);
  if (!payload) {
    return {error: {status: 401, message: 'Authentication required'}};
  }

  const requester = await userCollection.findOne({
    _id: ObjectId.createFromHexString(payload._id)
  });
  if (!requester) {
    return {error: {status: 401, message: 'Authentication required'}};
  }
  if (requester.role !== 'admin' || requester.club_id !== clubId) {
    return {error: {status: 403, message: 'Updating this club is not allowed'}};
  }

  return {requester};
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const collection = database.collection<ClubDocument>('clubs');
    const billingPeriodsCollection = database.collection<BillingPeriodDocument>('billing_periods');
    const invoiceCountersCollection = database.collection<InvoiceCounterDocument>('invoice_counters');
    const userCollection = database.collection<DBUser>('users');

    if (req.method === 'GET') {
      const id = req.query?.id;
      if (id) {
        if (Array.isArray(id)) {
          return res.status(400).json({error: 'Club id is invalid'});
        }

        const rawClub = await fetchClub(id, collection);
        if (rawClub?.deleted_at) {
          const payload = await getJwtPayload(req);
          const requester = payload ? await userCollection.findOne({
            _id: ObjectId.createFromHexString(payload._id)
          }) : null;
          if (!requester || requester.role !== 'admin' || requester.club_id !== id) {
            return res.status(404).end();
          }
        }

        const doc = await enrichClubWithBilling(collection, billingPeriodsCollection, rawClub);
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

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || Array.isArray(id)) {
        return res.status(400).json({error: 'Club id is invalid'});
      }

      const authorization = await authorizeClubAdmin(req, userCollection, id);
      if ('error' in authorization) {
        return res.status(authorization.error.status).json({error: authorization.error.message});
      }

      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password || !await bcrypt.compare(password, authorization.requester.password)) {
        return res.status(401).json({error: 'Das Passwort ist nicht korrekt.'});
      }

      const result = await collection.updateOne(
        {_id: ObjectId.createFromHexString(id), deleted_at: {$exists: false}},
        {$set: {deleted_at: new Date()}}
      );
      if (!result.matchedCount) {
        return res.status(404).json({error: 'Club not found'});
      }

      const club = await enrichClubWithBilling(
        collection,
        billingPeriodsCollection,
        await fetchClub(id, collection)
      );
      return res.json(club);
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id;
      if (!id || Array.isArray(id)) {
        return res.status(400).json({error: 'Club id is invalid'});
      }

      const authorization = await authorizeClubAdmin(req, userCollection, id);
      if ('error' in authorization) {
        return res.status(authorization.error.status).json({error: authorization.error.message});
      }

      let restoredBilling: ProcessedClubBillingRenewal | undefined;
      let result;
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          const deletedClub = await collection.findOne({
            _id: ObjectId.createFromHexString(id),
            deleted_at: {$exists: true},
          }, {session});
          if (!deletedClub) {
            return;
          }

          restoredBilling = await resumeClubBilling(
            collection,
            billingPeriodsCollection,
            invoiceCountersCollection,
            deletedClub,
            new Date(),
            session
          );
          result = await collection.updateOne(
            {_id: ObjectId.createFromHexString(id), deleted_at: {$exists: true}},
            {$unset: {deleted_at: ''}},
            {session}
          );
        });
      } finally {
        await session.endSession();
      }

      if (!result?.matchedCount) {
        return res.status(404).json({error: 'Club not found'});
      }

      let invoiceEmailError: string | undefined;
      if (restoredBilling?.createdPeriods.length) {
        try {
          await Promise.all(restoredBilling.createdPeriods.map(period =>
            sendBillingPeriodInvoiceEmail(database, restoredBilling!.club, period, 'renewal')
          ));
        } catch (error) {
          console.error('Failed to send restored club invoice email', error);
          invoiceEmailError = error instanceof Error ? error.message : 'Invoice email delivery failed.';
        }
      }

      const club = await enrichClubWithBilling(
        collection,
        billingPeriodsCollection,
        await fetchClub(id, collection)
      );
      return res.json({
        ...club,
        ...(invoiceEmailError ? {invoice_email_error: invoiceEmailError} : {}),
      });
    }

    if (req.method === 'POST') {
      const body = sanitize(req.body) as ClubFormBody | CourtsFormBody | RulesFormBody;

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

      if (requester.club_id) {
        const requesterClub = await collection.findOne({
          _id: ObjectId.createFromHexString(requester.club_id),
          deleted_at: {$exists: false},
        }, {
          projection: {_id: 1},
        });
        if (!requesterClub) {
          return res.status(410).json({error: 'Club has been deleted'});
        }
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

      if ('update_type' in body && body.update_type === 'rules') {
        if (requester.club_id !== body.club_id) {
          return res.status(403).json({error: 'Updating these club rules is not allowed'});
        }
        if (!Array.isArray(body.rules) || body.rules.length > 50 || body.rules.some(rule => typeof rule !== 'string' || rule.length > 2000)) {
          return res.status(400).json({error: 'Bitte geben Sie höchstens 50 gültige Regeln ein.'});
        }

        await collection.updateOne(
          {_id: ObjectId.createFromHexString(body.club_id)},
          {$set: {rules: body.rules}}
        );
        const docs = await getAllClubs(collection, billingPeriodsCollection);
        return res.status(201).json({
          message: 'Regeln wurden gespeichert',
          data: {club_id: body.club_id, clubs: docs}
        });
      }

      const schema = JSON.parse(fs.readFileSync(process.cwd() + '/public/schema/club.json', 'utf8'));
      const validator = ajv.getSchema(schema.$id) ?? ajv.compile(schema);
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
        return await updateClub(database, collection, billingPeriodsCollection, invoiceCountersCollection, res, body as ClubFormBody, requester);
      } else {
        return await addClub(database, collection, billingPeriodsCollection, invoiceCountersCollection, res, body as ClubFormBody, userCollection, payload, requester);
      }
    }

    return res.status(405).json({error: 'Method not allowed'});
  } catch (e) {
    console.error(e);
    const duplicateClubName = e instanceof MongoServerError
      && e.code === 11000
      && Boolean(e.keyPattern?.name);
    const errors = [
      {
        message: duplicateClubName ? 'Ein Verein mit diesem Namen existiert bereits.' : e.message,
        instancePath: duplicateClubName ? '#name' : `#${e.cause}`
      }
    ];
    res.status(500).json({error: errors});
  } finally {
    await client.close();
  }
}

async function addClub(
  database: Db,
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
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
  const max_reservation_duration = body.max_reservation_duration !== undefined ? Number(body.max_reservation_duration) : 1;
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
    max_reservation_duration,
    reservations_limit,
    courts,
    rules: defaultClubRules,
    timestamp: new Date(),
    ...(body.plan_type === 'pro' ? {pro_started_at: new Date()} : {})
  };
  const clubObjectId = new ObjectId();
  const club_id = clubObjectId.toString();
  let createdProPeriod: BillingPeriodDocument | undefined;
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await collection.insertOne({...club, _id: clubObjectId}, {session});
      await createDefaultCompetitionGroups(database, club_id, session);

      const userUpdate = await userCollection.updateOne(
        {
          _id: ObjectId.createFromHexString(payload._id),
          $or: [{club_id: {$exists: false}}, {club_id: null}],
        },
        {'$set' : {'club_id' : club_id}},
        {session}
      );
      if (!userUpdate.matchedCount) {
        throw new Error('Der Benutzer wurde gleichzeitig einem anderen Verein zugeordnet.');
      }

      if (body.plan_type === 'pro') {
        createdProPeriod = await createInitialBillingPeriod(
          billingPeriodsCollection,
          invoiceCountersCollection,
          club_id,
          'pro',
          'signup',
          club.pro_started_at,
          club.pro_started_at.getDate(),
          session
        );
      }
    });
  } finally {
    await session.endSession();
  }

  let invoiceEmailError: string | undefined;
  if (createdProPeriod) {
    try {
      await sendBillingPeriodInvoiceEmail(
        database,
        {...club, _id: clubObjectId},
        createdProPeriod,
        'initial'
      );
    } catch (error) {
      console.error('Failed to send invoice email for newly created club', error);
      invoiceEmailError = error instanceof Error ? error.message : 'Invoice email delivery failed.';
    }
  }

  const docs = await getAllClubs(collection, billingPeriodsCollection);
  res.status(201).json({
    message: `Verein ${club.name} ist registriert mit id ${club_id}`,
    data: {
      club_id,
      clubs: docs,
      ...(invoiceEmailError ? {invoice_email_error: invoiceEmailError} : {}),
    }
  });
}

async function updateClub(
  database: Db,
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>,
  invoiceCountersCollection: Collection<InvoiceCounterDocument>,
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
  const max_reservation_duration = body.max_reservation_duration !== undefined
    ? Number(body.max_reservation_duration)
    : doc.max_reservation_duration ?? 1;
  const { club: resolvedClub, currentBillingPeriod } = await processClubBillingRenewalAndSendInvoices(
    database,
    collection,
    billingPeriodsCollection,
    invoiceCountersCollection,
    doc
  );
  const currentAccessPlanType = resolvedClub.access_plan_type;
  const currentPlanState = getClubPlanState(resolvedClub);
  const selectedPlanType = body.plan_type;
  const isProCancellation = currentAccessPlanType === 'pro' && isLowerPlan(selectedPlanType, currentAccessPlanType);
  const cancellationTerms = isProCancellation
    ? getProCancellationTerms(resolvedClub, currentBillingPeriod)
    : null;

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

  const query = {
    _id: ObjectId.createFromHexString(body._id),
    access_plan_type: currentPlanState.accessPlanType,
    next_plan_type: currentPlanState.nextPlanType,
  };
  const immediateCancellation = Boolean(cancellationTerms?.eligibleForImmediateCancellation);
  const planChangedAt = new Date();
  const planUpdateFields: Partial<ClubDocument> = immediateCancellation
    ? {access_plan_type: 'basic', next_plan_type: 'basic'}
    : getPlanChangeUpdate(currentPlanState, selectedPlanType);
  if (isHigherPlan(selectedPlanType, currentAccessPlanType)) {
    planUpdateFields.pro_started_at = planChangedAt;
  }
  const unsetFields: Record<string, ''> = {
    plan_type: '',
    members_limit: '',
    auto_renew: '',
  };

  let createdUpgradePeriod: BillingPeriodDocument | undefined;
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const updateResponse = await collection.updateOne(
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
          max_reservation_duration,
          reservations_limit,
          courts,
          ...planUpdateFields,
        },
        '$unset': unsetFields},
        {session}
      );

      if (!updateResponse.matchedCount) {
        throw new Error('Der Vereinsplan wurde gleichzeitig geändert. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
      }

      if (isHigherPlan(selectedPlanType, currentAccessPlanType)) {
        await billingPeriodsCollection.deleteMany(
          {club_id: body._id, plan_type: 'basic'},
          {session}
        );
        createdUpgradePeriod = await createInitialBillingPeriod(
          billingPeriodsCollection,
          invoiceCountersCollection,
          body._id,
          'pro',
          'upgrade',
          planChangedAt,
          planChangedAt.getDate(),
          session
        );
      }

      if (immediateCancellation && currentBillingPeriod?.plan_type === 'pro' && currentBillingPeriod._id) {
        const cancellationResult = await billingPeriodsCollection.updateOne(
          {_id: currentBillingPeriod._id, status: 'active'},
          {$set: {
            status: 'canceled',
            canceled_at: planChangedAt,
            ...(cancellationTerms?.refundEligible ? {
              refund_amount: cancellationTerms.refundAmount,
              refund_status: 'pending',
            } : {}),
          }},
          {session}
        );
        if (!cancellationResult.matchedCount) {
          throw new Error('Der Pro-Abrechnungszeitraum wurde gleichzeitig geändert. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
        }
      }
    });
  } finally {
    await session.endSession();
  }

  let invoiceEmailError: string | undefined;
  if (createdUpgradePeriod) {
    try {
      await sendBillingPeriodInvoiceEmail(
        database,
        {...resolvedClub, ...planUpdateFields},
        createdUpgradePeriod,
        'upgrade'
      );
    } catch (error) {
      console.error('Failed to send invoice email for upgraded club', error);
      invoiceEmailError = error instanceof Error ? error.message : 'Invoice email delivery failed.';
    }
  }

  const docs = await getAllClubs(collection, billingPeriodsCollection);
  res.status(201).json({
    message: `Verein ${body.name} ist updated`,
    data: {
      club_id: body._id,
      clubs: docs,
      ...(invoiceEmailError ? {invoice_email_error: invoiceEmailError} : {}),
      ...(isProCancellation ? {
        cancellation: {
          effective: immediateCancellation ? 'immediate' : 'period_end',
          refund_eligible: Boolean(cancellationTerms?.refundEligible),
          refund_amount: cancellationTerms?.refundAmount ?? 0,
          ...(cancellationTerms?.refundEligibleUntil ? {
            refund_eligible_until: cancellationTerms.refundEligibleUntil.toISOString(),
          } : {}),
        },
      } : {}),
    }
  });
}

async function getAllClubs(
  collection: Collection<ClubDocument>,
  billingPeriodsCollection: Collection<BillingPeriodDocument>
) {
  const docs = await collection.find({deleted_at: {$exists: false}})
    .collation({
        locale: 'en',
        strength: 2
    })
    .sort({ name: 1 })
    .toArray();
    return await Promise.all(docs.map(doc => enrichClubWithBilling(collection, billingPeriodsCollection, doc)));
};
