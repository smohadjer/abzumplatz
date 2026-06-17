import { Field } from './types';

export const FREE_PLAN_MEMBERS_LIMIT = 100;
export const PAID_PLAN_DURATION_MONTHS: number = 1;
export const PAID_PLAN_PRICE_EUR = 10;

function getLocalDateString(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalDate(dateString: string) {
    return new Date(`${dateString}T12:00:00`);
}

function addMonthsKeepingDay(fromDate: Date, months: number) {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const day = fromDate.getDate();
    const targetMonthIndex = month + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const normalizedTargetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDayOfTargetMonth = new Date(targetYear, normalizedTargetMonth + 1, 0).getDate();
    const targetDay = Math.min(day, lastDayOfTargetMonth);

    return new Date(targetYear, normalizedTargetMonth, targetDay, 12, 0, 0, 0);
}

export function getMembersLimitForPlan(planType?: 'free' | 'paid') {
    return planType === 'free' ? FREE_PLAN_MEMBERS_LIMIT : null;
}

export function getNextBillingPeriodStartForPlan(planType?: 'free' | 'paid', fromDate = new Date()) {
    if (planType !== 'paid') {
        return undefined;
    }

    const nextPeriodStart = addMonthsKeepingDay(fromDate, PAID_PLAN_DURATION_MONTHS);
    return getLocalDateString(nextPeriodStart);
}

export function getPaidUntilFromPeriodEnd(periodEnd?: string) {
    if (!periodEnd) {
        return undefined;
    }

    const paidUntil = getLocalDate(periodEnd);
    paidUntil.setDate(paidUntil.getDate() - 1);
    return getLocalDateString(paidUntil);
}

export function hasFuturePaidUntil(paidUntil?: string, now = new Date()) {
    if (!paidUntil) {
        return false;
    }

    const endOfPaidDay = new Date(`${paidUntil}T23:59:59.999`);
    return endOfPaidDay > now;
}

export function hasFutureBillingPeriodEnd(periodEnd?: string, now = new Date()) {
    if (!periodEnd) {
        return false;
    }

    return getLocalDate(periodEnd) > now;
}

export function getPaidPlanDurationLabel() {
    return PAID_PLAN_DURATION_MONTHS === 1
        ? 'monatlich'
        : `für ${PAID_PLAN_DURATION_MONTHS} Monate`;
}

export function getPaidPlanLabel() {
    return `Bezahlplan (${PAID_PLAN_PRICE_EUR}€ ${getPaidPlanDurationLabel()})`;
}

export function getPaidPlanName() {
    return 'Bezahlplan';
}

export function getFreePlanName() {
    return 'Free';
}

export function getFreePlanHint(membersLimit = FREE_PLAN_MEMBERS_LIMIT) {
    return `Nur ${membersLimit} aktive Mitglieder zulässig`;
}

export function getPaidPlanHint() {
    return `Keine Einschränkungen. Eine Rechnung über ${PAID_PLAN_PRICE_EUR}€ ${getPaidPlanDurationLabel()} wird erstellt und per E-Mail an den Admin des Vereins gesendet. Ein Wechsel zum Free Plan ist jederzeit möglich.`;
}

export function applyPlanConfigToFields(fields: Field[], planType: 'free' | 'paid') {
    const membersLimit = getMembersLimitForPlan(planType) ?? FREE_PLAN_MEMBERS_LIMIT;
    const hintByValue = {
        free: getFreePlanHint(membersLimit),
        paid: getPaidPlanHint()
    };

    return fields.map(field => {
        if (field.name !== 'plan_type') {
            return field;
        }

        return {
            ...field,
            hintByValue,
            hint: hintByValue[planType],
            options: field.options?.map(option => {
                if (option.value === 'free') {
                    return {
                        ...option,
                        label: getFreePlanName()
                    };
                }

                if (option.value === 'paid') {
                    return {
                        ...option,
                        label: getPaidPlanLabel()
                    };
                }

                return option;
            })
        };
    });
}
