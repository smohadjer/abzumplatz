import { BillingPeriodDocument } from './_billingPeriods.js';
import { ClubDocument } from './_types.js';

const REFUND_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type ProCancellationTerms = {
  eligibleForImmediateCancellation: boolean;
  refundEligible: boolean;
  refundEligibleUntil?: Date;
  refundAmount: number;
};

export function getProCancellationTerms(
  club: ClubDocument,
  currentBillingPeriod: BillingPeriodDocument | null,
  now = new Date()
): ProCancellationTerms {
  if (club.access_plan_type !== 'pro') {
    return {
      eligibleForImmediateCancellation: false,
      refundEligible: false,
      refundAmount: 0,
    };
  }

  const periodStart = currentBillingPeriod?.plan_type === 'pro'
    ? new Date(`${currentBillingPeriod.period_start}T12:00:00`)
    : undefined;
  const contractStart = club.pro_started_at ?? periodStart ?? club.timestamp;
  const startedAt = contractStart ? new Date(contractStart) : null;
  if (!startedAt || Number.isNaN(startedAt.getTime())) {
    return {
      eligibleForImmediateCancellation: false,
      refundEligible: false,
      refundAmount: 0,
    };
  }

  const refundEligibleUntil = new Date(startedAt.getTime() + REFUND_WINDOW_MS);
  const eligibleForImmediateCancellation = now.getTime() <= refundEligibleUntil.getTime();
  const refundEligible = eligibleForImmediateCancellation
    && currentBillingPeriod?.plan_type === 'pro'
    && currentBillingPeriod.status === 'active'
    && currentBillingPeriod.price > 0;

  return {
    eligibleForImmediateCancellation,
    refundEligible,
    refundEligibleUntil,
    refundAmount: refundEligible ? currentBillingPeriod.price : 0,
  };
}
