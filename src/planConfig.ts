export const FREE_PLAN_MEMBERS_LIMIT = 100;

export function getMembersLimitForPlan(planType?: 'free' | 'paid') {
    return planType === 'free' ? FREE_PLAN_MEMBERS_LIMIT : null;
}
