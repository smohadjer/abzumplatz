import { Collection, MongoClient, ObjectId } from 'mongodb';
import { database_uri, database_name } from './_utils/_config.js';
import { sanitize } from './_utils/_lib.js';
import { getJwtPayload } from './verifyAuth.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { DBUser, PlanType } from '../src/types.js';
import { ClubDocument } from './_utils/_types.js';
import { BillingPeriodDocument, BillingPeriodStatus, resolveClubBillingState } from './_utils/_billingPeriods.js';
import { getPlanStateAtRenewal } from './_utils/_planTransitions.js';

type BillingBody = {
  club_id?: string;
  plan_type?: PlanType;
  anchor_day?: number;
  period_start?: string;
  period_end?: string;
  status?: BillingPeriodStatus;
  source?: string;
}

function validationError(instancePath: string, message: string) {
  return {
    error: [
      {
        instancePath,
        message,
      }
    ]
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isObjectIdString(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function isBillingStatus(value: unknown): value is BillingPeriodStatus {
  return value === 'active' || value === 'completed' || value === 'canceled';
}

function parseLocalDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`);
}

function isValidDateOnlyString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseLocalDate(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeBillingPeriod(period: BillingPeriodDocument) {
  return {
    ...period,
    _id: period._id?.toString(),
  };
}

if (!database_uri || !database_name) {
  throw new Error('Database configuration is missing');
}

const client = new MongoClient(database_uri);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await client.connect();
    const database = client.db(database_name);
    const users = database.collection<DBUser>('users');
    const clubs = database.collection<ClubDocument>('clubs');
    const billingPeriods = database.collection<BillingPeriodDocument>('billing_periods');

    const payload = await getJwtPayload(req);
    if (!payload) {
      return res.status(401).json({error: 'Authentication required'});
    }

    const requester = await users.findOne({
      _id: ObjectId.createFromHexString(payload._id)
    });
    if (!requester) {
      return res.status(401).json({error: 'Authentication required'});
    }
    if (requester.role !== 'admin') {
      return res.status(403).json({error: 'Only admins can access billing periods'});
    }
    if (!requester.club_id) {
      return res.status(403).json({error: 'Admin is not assigned to a club'});
    }

    if (req.method === 'GET') {
      const requestedClubId = isString(req.query?.club_id)
        ? req.query.club_id
        : requester.club_id;

      if (requestedClubId !== requester.club_id) {
        return res.status(403).json({error: 'Reading billing periods for another club is not allowed'});
      }

      const club = await clubs.findOne({
        _id: ObjectId.createFromHexString(requestedClubId)
      });
      if (club) {
        await resolveClubBillingState(clubs, billingPeriods, club);
      }

      const periods = await billingPeriods.find({
        club_id: requestedClubId
      }).sort({
        period_start: -1,
        created_at: -1
      }).toArray();

      return res.json(periods.map(normalizeBillingPeriod));
    }

    if (req.method === 'POST') {
      const body = sanitize(req.body) as BillingBody;
      const club_id = isString(body.club_id) ? body.club_id : undefined;
      const plan_type = isString(body.plan_type) ? body.plan_type as PlanType : undefined;
      const anchor_day = typeof body.anchor_day === 'number' ? body.anchor_day : undefined;
      const period_start = isString(body.period_start) ? body.period_start : undefined;
      const period_end = isString(body.period_end) ? body.period_end : undefined;
      const status = body.status ?? 'active';
      const source = isString(body.source) ? body.source : undefined;

      if (!club_id) {
        return res.status(400).json(validationError('/club_id', 'Bitte geben Sie eine Vereins-ID an.'));
      }
      if (!isObjectIdString(club_id)) {
        return res.status(400).json(validationError('/club_id', 'Bitte geben Sie eine gültige Vereins-ID an.'));
      }
      if (club_id !== requester.club_id) {
        return res.status(403).json({error: 'Creating billing periods for another club is not allowed'});
      }
      if (!period_start || !isValidDateOnlyString(period_start)) {
        return res.status(400).json(validationError('/period_start', 'Bitte geben Sie ein gültiges Startdatum im Format YYYY-MM-DD an.'));
      }
      if (!period_end || !isValidDateOnlyString(period_end)) {
        return res.status(400).json(validationError('/period_end', 'Bitte geben Sie ein gültiges Enddatum im Format YYYY-MM-DD an.'));
      }
      if (!isBillingStatus(status)) {
        return res.status(400).json(validationError('/status', 'Bitte geben Sie einen gültigen Status an.'));
      }

      const startDate = parseLocalDate(period_start);
      const endDate = parseLocalDate(period_end);
      if (endDate <= startDate) {
        return res.status(400).json(validationError('/period_end', 'Das Enddatum muss nach dem Startdatum liegen.'));
      }

      const club = await clubs.findOne({
        _id: ObjectId.createFromHexString(club_id)
      });
      if (!club) {
        return res.status(404).json(validationError('/club_id', 'Verein nicht gefunden.'));
      }

      const { club: resolvedClub } = await resolveClubBillingState(clubs, billingPeriods, club);

      const billingPlanType = plan_type ?? resolvedClub.next_plan_type;

      if (status === 'active') {
        const existingActivePeriod = await billingPeriods.findOne({
          club_id,
          status: 'active'
        });
        if (existingActivePeriod) {
          return res.status(409).json(validationError('/status', 'Für diesen Verein existiert bereits ein aktiver Abrechnungszeitraum.'));
        }
      }

      const period: BillingPeriodDocument = {
        club_id,
        plan_type: billingPlanType,
        anchor_day: anchor_day ?? startDate.getDate(),
        period_start,
        period_end,
        status,
        created_at: new Date(),
        ...(source ? {source} : {})
      };

      const insertResult = await billingPeriods.insertOne(period);

      if (status === 'active') {
        await clubs.updateOne(
          {_id: ObjectId.createFromHexString(club_id)},
          {
            $set: getPlanStateAtRenewal(billingPlanType),
            $unset: {
              plan_type: '',
            }
          }
        );
      }

      return res.status(201).json({
        message: 'Billing period created.',
        data: {
          ...normalizeBillingPeriod({
            ...period,
            _id: insertResult.insertedId,
          })
        }
      });
    }

    return res.status(405).json({error: 'Method not allowed'});
  } catch (e) {
    console.error(e);
    return res.status(500).json({error: e instanceof Error ? e.message : 'Unknown server error'});
  } finally {
    await client.close();
  }
}
