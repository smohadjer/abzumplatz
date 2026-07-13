import { MongoClient, ObjectId } from 'mongodb';
import { cron_secret, database_uri, database_name } from './_utils/_config.js';
import { sanitize } from './_utils/_lib.js';
import { getJwtPayload } from './verifyAuth.js';
import type { VercelRequest, VercelResponse } from './_utils/_apiTypes.js';
import { DBUser, PlanType } from '../src/types.js';
import { ClubDocument } from './_utils/_types.js';
import { BillingPeriodDocument, BillingPeriodStatus, processBillingRenewals, processClubBillingRenewal } from './_utils/_billingPeriods.js';
import { getPlanStateAtRenewal } from './_utils/_planTransitions.js';
import { getPlanPrice } from '../src/planConfig.js';
import { getRequiredBillingPrice, sendBillingPeriodInvoiceEmail } from './_utils/_billingInvoices.js';

type BillingBody = {
  action?: 'create_period' | 'send_invoice';
  billing_period_id?: string;
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
    price: getRequiredBillingPrice(period),
    _id: period._id?.toString(),
  };
}

// Renewal intentionally lives on GET /api/billing instead of a dedicated route:
// - Vercel Cron invokes scheduled functions with GET requests
// - the Vercel free tier endpoint limit makes an extra renewal route expensive
// - using the same GET branch locally and in production keeps behavior consistent
function isAuthorizedRenewalRequest(req: VercelRequest) {
  if (!cron_secret) {
    return false;
  }

  return req.method === 'GET' && req.headers.authorization === `Bearer ${cron_secret}`;
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

    if (isAuthorizedRenewalRequest(req)) {
      const { summary, renewedClubs } = await processBillingRenewals(clubs, billingPeriods);
      const invoiceDeliveries = await Promise.allSettled(renewedClubs.flatMap(({club, createdPeriods}) => createdPeriods.map(async (period) => {
        if (!club._id) {
          return;
        }

        await sendBillingPeriodInvoiceEmail(
          database,
          club,
          period,
          'renewal'
        );
      })));

      const failedInvoiceDeliveries = invoiceDeliveries.filter((result) => result.status === 'rejected');
      if (failedInvoiceDeliveries.length) {
        failedInvoiceDeliveries.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Failed to send renewal invoice email', result.reason);
          }
        });

        return res.status(502).json({
          error: 'Billing renewals were processed, but one or more invoice emails could not be delivered.',
          data: {
            ...summary,
            failed_invoice_deliveries: failedInvoiceDeliveries.length,
          },
        });
      }

      return res.status(200).json({
        message: 'Billing renewals processed.',
        data: summary,
      });
    }

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
      const action = body.action ?? 'create_period';
      const billing_period_id = isString(body.billing_period_id) ? body.billing_period_id : undefined;
      const club_id = isString(body.club_id) ? body.club_id : undefined;
      const plan_type = isString(body.plan_type) ? body.plan_type as PlanType : undefined;
      const anchor_day = typeof body.anchor_day === 'number' ? body.anchor_day : undefined;
      const period_start = isString(body.period_start) ? body.period_start : undefined;
      const period_end = isString(body.period_end) ? body.period_end : undefined;
      const status = body.status ?? 'active';
      const source = isString(body.source) ? body.source : undefined;

      if (action === 'send_invoice') {
        if (!billing_period_id) {
          return res.status(400).json(validationError('/billing_period_id', 'Bitte geben Sie eine Abrechnungs-ID an.'));
        }
        if (!isObjectIdString(billing_period_id)) {
          return res.status(400).json(validationError('/billing_period_id', 'Bitte geben Sie eine gültige Abrechnungs-ID an.'));
        }

        const period = await billingPeriods.findOne({
          _id: ObjectId.createFromHexString(billing_period_id),
        });
        if (!period) {
          return res.status(404).json(validationError('/billing_period_id', 'Abrechnungszeitraum nicht gefunden.'));
        }
        if (period.club_id !== requester.club_id) {
          return res.status(403).json({error: 'Reading billing periods for another club is not allowed'});
        }

        const club = await clubs.findOne({
          _id: ObjectId.createFromHexString(period.club_id),
        });
        if (!club) {
          return res.status(404).json({error: 'Club not found for billing period'});
        }

        try {
          await sendBillingPeriodInvoiceEmail(
            database,
            club,
            period,
            'resend'
          );
        } catch (emailError) {
          console.error('Failed to resend invoice email', emailError);
          const detail = emailError instanceof Error
            ? ` ${emailError.message}`
            : '';
          return res.status(502).json({
            error: `Die Rechnung wurde bereits erstellt, aber die E-Mail konnte nicht zugestellt werden.${detail}`,
            data: {
              _id: period._id?.toString(),
              club_id: period.club_id,
              period_start: period.period_start,
              period_end: period.period_end,
            },
          });
        }

        return res.status(200).json({
          message: 'Invoice email sent.',
          data: normalizeBillingPeriod(period),
        });
      }

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

      const { club: resolvedClub } = await processClubBillingRenewal(clubs, billingPeriods, club);

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
        price: getPlanPrice(billingPlanType),
        anchor_day: anchor_day ?? startDate.getDate(),
        period_start,
        period_end,
        status,
        created_at: new Date(),
        ...(source ? {source} : {})
      };

      const insertResult = await billingPeriods.insertOne(period);
      period._id = insertResult.insertedId;

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

      try {
        await sendBillingPeriodInvoiceEmail(
          database,
          club,
          period,
          'manual'
        );
      } catch (emailError) {
        console.error('Failed to send invoice email for manually created billing period', emailError);
        const detail = emailError instanceof Error
          ? ` ${emailError.message}`
          : '';
        return res.status(502).json({
          error: `Der Abrechnungszeitraum wurde angelegt, aber die Rechnungs-E-Mail konnte nicht zugestellt werden.${detail}`,
          data: normalizeBillingPeriod(period),
        });
      }

      return res.status(201).json({
        message: 'Billing period created.',
        data: {
          ...normalizeBillingPeriod({
            ...period,
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
