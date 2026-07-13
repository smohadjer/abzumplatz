import { Db } from 'mongodb';
import { getCoveredUntilFromPeriodEnd, getPlanName } from '../../src/planConfig.js';
import { bank_account_holder, bank_iban, bank_name } from './_config.js';
import { escapeHtml } from './_lib.js';
import sendEmail from './_sendEmail.js';
import { BillingPeriodDocument } from './_billingPeriods.js';
import { AdminEmailDocument, ClubDocument } from './_types.js';

export type BillingInvoiceNotificationType = 'manual' | 'renewal' | 'resend';

function parseLocalDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`);
}

export function getRequiredBillingPrice(period: Pick<BillingPeriodDocument, '_id' | 'club_id' | 'period_start' | 'price'>) {
  if (!Number.isFinite(period.price)) {
    const reference = period._id?.toString() ?? `${period.club_id}:${period.period_start}`;
    throw new Error(`Billing period ${reference} is missing a valid price.`);
  }

  return period.price;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function getIncludedVatAmount(value: number, vatRate = 0.19) {
  return value * vatRate / (1 + vatRate);
}

function getNetAmount(value: number, vatRate = 0.19) {
  return value / (1 + vatRate);
}

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? parseLocalDate(value) : value;
  return date.toLocaleDateString('de-DE');
}

function buildClubAddressLines(club: Pick<ClubDocument, 'address_line1' | 'postal_code' | 'city' | 'country'>) {
  const cityLine = [club.postal_code, club.city].filter(Boolean).join(' ');

  return [
    club.address_line1,
    cityLine || undefined,
  ].filter((line): line is string => Boolean(line));
}

export function getBillingInvoiceReference(clubId: string, period: BillingPeriodDocument) {
  const periodKey = period.period_start.replaceAll('-', '');
  const clubKey = clubId.slice(-6).toUpperCase();
  const idKey = period._id?.toString().slice(-6).toUpperCase();

  return ['AZP', clubKey, periodKey, idKey].filter(Boolean).join('-');
}

function buildBillingPeriodNotificationEmail(
  club: Pick<ClubDocument, '_id' | 'name' | 'address_line1' | 'postal_code' | 'city' | 'country'>,
  period: BillingPeriodDocument,
  notificationType: BillingInvoiceNotificationType
) {
  const clubId = club._id?.toString() ?? period.club_id;
  const price = getRequiredBillingPrice(period);
  const invoiceReference = getBillingInvoiceReference(clubId, period);
  const coveredUntil = getCoveredUntilFromPeriodEnd(period.period_end) ?? period.period_end;
  const issueDate = formatDate(period.created_at);
  const serviceStart = formatDate(period.period_start);
  const serviceEnd = formatDate(coveredUntil);
  const planName = getPlanName(period.plan_type);
  const amountLabel = formatCurrency(price);
  const netAmountLabel = formatCurrency(getNetAmount(price));
  const vatLabel = formatCurrency(getIncludedVatAmount(price));
  const clubAddressLines = buildClubAddressLines(club);
  const hasBankDetails = Boolean(bank_iban && bank_name && bank_account_holder);
  const note = notificationType === 'renewal'
    ? 'Dieser Abrechnungszeitraum wurde automatisch bei der Verlängerung Ihres Plans angelegt.'
    : notificationType === 'resend'
      ? 'Diese Rechnung wurde auf Anfrage erneut versendet.'
      : 'Dieser Abrechnungszeitraum wurde manuell angelegt.';

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5; max-width: 720px;">
      <table cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>
          <tr>
            <td style="vertical-align: top;">
              <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.02em;">Rechnung</div>
              <div style="color: #4b5563;">Abzumplatz | Denzlingerstr. 20, 79108 Freiburg im Breisgau</div>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <div><strong>Rechnungsnr.</strong> ${escapeHtml(invoiceReference)}</div>
              <div><strong>Rechnungsdatum</strong> ${escapeHtml(issueDate)}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin-bottom: 24px;">
        <div style="font-size: 16px;">${escapeHtml(club.name ?? 'Verein')}</div>
        ${clubAddressLines.map(line => `<div style="font-size: 17px;">${escapeHtml(line)}</div>`).join('')}
      </div>

      <table cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 10px 0; border-bottom: 2px solid #d1d5db;">Leistung</th>
            <th style="text-align: left; padding: 10px 0; border-bottom: 2px solid #d1d5db;">Zeitraum</th>
            <th style="text-align: right; padding: 10px 0; border-bottom: 2px solid #d1d5db;">Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(planName)} Plan</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              ${escapeHtml(serviceStart)} - ${escapeHtml(serviceEnd)}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
              ${escapeHtml(amountLabel)}
            </td>
          </tr>
        </tbody>
      </table>

      <table cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>
          <tr>
            <td style="padding: 6px 0;"><strong>Nettobetrag</strong></td>
            <td style="padding: 6px 0; text-align: right;">${escapeHtml(netAmountLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Umsatzsteuer (19%)</strong></td>
            <td style="padding: 6px 0; text-align: right;">${escapeHtml(vatLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 20px;"><strong>Rechnungsbetrag</strong></td>
            <td style="padding: 6px 0; text-align: right; font-size: 20px;"><strong>${escapeHtml(amountLabel)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p style="margin: 0 0 10px 0;">${escapeHtml(note)}</p>
      ${hasBankDetails ? `
        <div style="margin: 20px 0 10px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">Zahlungshinweis</div>
          <p style="margin: 0 0 10px 0;">Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnr. ${escapeHtml(invoiceReference)} auf folgendes Konto:</p>
          <table cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tbody>
              <tr><td style="padding: 4px 12px 4px 0;"><strong>Kontoinhaber</strong></td><td style="padding: 4px 0;">${escapeHtml(bank_account_holder ?? '-')}</td></tr>
              <tr><td style="padding: 4px 12px 4px 0;"><strong>Bank</strong></td><td style="padding: 4px 0;">${escapeHtml(bank_name ?? '-')}</td></tr>
              <tr><td style="padding: 4px 12px 4px 0;"><strong>IBAN</strong></td><td style="padding: 4px 0;">${escapeHtml(bank_iban ?? '-')}</td></tr>
            </tbody>
          </table>
        </div>
      ` : ''}
      <p style="margin: 0; color: #6b7280; font-size: 13px;">Diese E-Mail dient aktuell als Rechnungsbeleg für den gespeicherten Abrechnungszeitraum.</p>
    </div>
  `;
}

async function notifyClubAdminsOfBillingPeriod(
  database: Db,
  clubId: string,
  subject: string,
  html: string
) {
  const admins = await database.collection<AdminEmailDocument>('users').find({
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
    throw new Error('Invoice email delivery failed because no active admin email recipients were found.');
  }

  const results = await Promise.allSettled(adminEmails.map(email => sendEmail({
    email,
    subject,
    html,
  })));

  const failedDeliveries = results.filter((result) => result.status === 'rejected');
  if (failedDeliveries.length) {
    throw new Error(`Invoice email delivery failed for ${failedDeliveries.length} of ${adminEmails.length} admin recipient(s).`);
  }
}

export async function sendBillingPeriodInvoiceEmail(
  database: Db,
  club: Pick<ClubDocument, '_id' | 'name' | 'address_line1' | 'postal_code' | 'city' | 'country'>,
  period: BillingPeriodDocument,
  notificationType: BillingInvoiceNotificationType
) {
  const clubId = club._id?.toString() ?? period.club_id;
  const subject = `Rechnung ${getBillingInvoiceReference(clubId, period)} für ${club.name ?? 'Verein'}`;
  const html = buildBillingPeriodNotificationEmail(
    club,
    period,
    notificationType
  );

  await notifyClubAdminsOfBillingPeriod(
    database,
    clubId,
    subject,
    html
  );
}
