import { PlanType } from '../../src/types.js';
import { getMembersLimitForPlan } from '../../src/planConfig.js';
import { plan_limit } from './_config.js';

const parsedPlanLimit = Number(plan_limit);

export const membersLimitOverride = Number.isFinite(parsedPlanLimit) && parsedPlanLimit >= 0
    ? parsedPlanLimit
    : null;

export function hasMembersLimitOverride() {
    return membersLimitOverride != null;
}

export function getEffectiveMembersLimitForPlan(planType?: PlanType) {
    return membersLimitOverride ?? getMembersLimitForPlan(planType);
}
