import { Field, NormalizedPlanType, PlanType } from './types';

type PlanConfigItem = {
    durationMonths: number;
    features: Array<{
        icon: string;
        label: string;
    }>;
    label: string;
    price: number;
}

export const PLAN_CONFIG: Record<PlanType, PlanConfigItem> = {
    basic: {
        durationMonths: 1,
        features: [
            {icon: 'reservation', label: 'Kostenlose Platzreservierung für alle Mitglieder'},
            {icon: 'unlimited-members', label: 'Unbegrenzte Mitgliederzahl'},
            {icon: 'block', label: 'Plätze für Spiele und Veranstaltungen sperren'},
            {icon: 'rules', label: 'Flexible Buchungsregeln'},
            {icon: 'recurring', label: 'Wiederkehrende Trainingszeiten'},
            {icon: 'members', label: 'Mitglieder einfach verwalten'},
            {icon: 'browser', label: 'Auf Smartphone, Tablet und Computer nutzbar'},
            {icon: 'email', label: 'E-Mail-Support'},
        ],
        label: 'Basic',
        price: 0,
    },
    pro: {
        durationMonths: 12,
        features: [
            {icon: 'included', label: 'Alle Funktionen des Basic-Plans'},
            {icon: 'tournaments', label: 'Vereinsturniere organisieren'},
            {icon: 'competitions', label: 'Konkurrenzen verwalten'},
            {icon: 'notifications', label: 'Mitglieder benachrichtigen'},
            {icon: 'support', label: 'E-Mail- und Telefonsupport'},
        ],
        label: 'Pro',
        price: 50,
    },
};

export const PAID_PLAN_DURATION_LABEL = ' / Jahr';
export const FORM_PLAN_DURATION_LABEL = ' / J';

function getLocalDateString(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalDate(dateString: string) {
    return new Date(`${dateString}T12:00:00`);
}

function addMonthsKeepingDay(fromDate: Date, months: number, preferredDay = fromDate.getDate()) {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const targetMonthIndex = month + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const normalizedTargetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDayOfTargetMonth = new Date(targetYear, normalizedTargetMonth + 1, 0).getDate();
    const targetDay = Math.min(preferredDay, lastDayOfTargetMonth);

    return new Date(targetYear, normalizedTargetMonth, targetDay, 12, 0, 0, 0);
}

export function normalizePlanType(planType?: PlanType): NormalizedPlanType {
    if (planType === 'pro') {
        return 'pro';
    }

    return 'basic';
}

export function getPlanConfig(planType?: PlanType) {
    return PLAN_CONFIG[normalizePlanType(planType)];
}

export function getPlanLevel(planType?: PlanType) {
    const normalizedPlanType = normalizePlanType(planType);

    if (normalizedPlanType === 'pro') {
        return 2;
    }

    return 0;
}

export function isHigherPlan(targetPlanType?: PlanType, currentPlanType?: PlanType) {
    return getPlanLevel(targetPlanType) > getPlanLevel(currentPlanType);
}

export function isLowerPlan(targetPlanType?: PlanType, currentPlanType?: PlanType) {
    return getPlanLevel(targetPlanType) < getPlanLevel(currentPlanType);
}

export function getPlanPrice(planType?: PlanType) {
    return getPlanConfig(planType).price;
}

export function getNextBillingPeriodStartForPlan(planType?: PlanType, fromDate = new Date(), anchorDay = fromDate.getDate()) {
    const config = getPlanConfig(planType);
    const nextPeriodStart = addMonthsKeepingDay(fromDate, config.durationMonths, anchorDay);
    return getLocalDateString(nextPeriodStart);
}

export function getCoveredUntilFromPeriodEnd(periodEnd?: string) {
    if (!periodEnd) {
        return undefined;
    }

    const paidUntil = getLocalDate(periodEnd);
    paidUntil.setDate(paidUntil.getDate() - 1);
    return getLocalDateString(paidUntil);
}

export function hasFutureBillingPeriodEnd(periodEnd?: string, now = new Date()) {
    if (!periodEnd) {
        return false;
    }

    return getLocalDate(periodEnd) > now;
}

function getPaidPlanLabel(planType: PlanType) {
    const config = getPlanConfig(planType);
    if (config.price <= 0) {
        return config.label;
    }

    return `${config.label} (${config.price} ${'\u20ac'}${FORM_PLAN_DURATION_LABEL})`;
}

export function getProPlanLabel() {
    return getPaidPlanLabel('pro');
}

export function getBasicPlanLabel() {
    return `${PLAN_CONFIG.basic.label} (Kostenlos)`;
}

export function getBasicPlanHint() {
    return `Mitgliederverwaltung und Platzreservierung`;
}

export function getProPlanHint() {
    return `Turniere erstellen und Konkurrenzen verwalten`;
}

export function getPlanName(planType?: PlanType) {
    return getPlanConfig(planType).label;
}

export function applyPlanConfigToFields(fields: Field[], planType: PlanType) {
    const normalizedPlanType = normalizePlanType(planType);
    const hintByValue = {
        basic: getBasicPlanHint(),
        pro: getProPlanHint()
    };

    return fields.map(field => {
        if (field.name !== 'plan_type') {
            return field;
        }

        return {
            ...field,
            hintByValue,
            hint: hintByValue[normalizedPlanType],
            options: field.options?.map(option => {
                if (option.value === 'basic') {
                    return {
                        ...option,
                        label: getBasicPlanLabel()
                    };
                }

                if (option.value === 'pro') {
                    return {
                        ...option,
                        label: getProPlanLabel()
                    };
                }

                return option;
            })
        };
    });
}
