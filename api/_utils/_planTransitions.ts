import { PlanType } from '../../src/types.js';
import { isHigherPlan, isLowerPlan } from '../../src/planConfig.js';
import { ClubDocument } from './_types.js';

export type ClubPlanState = {
    accessPlanType: PlanType;
    nextPlanType: PlanType;
}

type ClubPlanSource = Pick<ClubDocument, 'access_plan_type' | 'next_plan_type'>;

export function getClubPlanState(club: ClubPlanSource): ClubPlanState {
    return {
        accessPlanType: club.access_plan_type,
        nextPlanType: club.next_plan_type,
    };
}

export function getPlanStateAtRenewal(nextPlanType: PlanType) {
    return {
        access_plan_type: nextPlanType,
        next_plan_type: nextPlanType,
    };
}

export function getPlanChangeUpdate(
    currentPlanState: ClubPlanState,
    targetPlanType: PlanType
) {
    if (targetPlanType === currentPlanState.nextPlanType) {
        return {
            access_plan_type: currentPlanState.accessPlanType,
            next_plan_type: currentPlanState.nextPlanType,
        };
    }

    if (isHigherPlan(targetPlanType, currentPlanState.accessPlanType)) {
        return {
            access_plan_type: targetPlanType,
            next_plan_type: targetPlanType,
        };
    }

    if (isLowerPlan(targetPlanType, currentPlanState.accessPlanType)) {
        return {
            access_plan_type: currentPlanState.accessPlanType,
            next_plan_type: targetPlanType,
        };
    }

    return {
        access_plan_type: currentPlanState.accessPlanType,
        next_plan_type: targetPlanType,
    };
}
