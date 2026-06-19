import { ObjectId } from 'mongodb';
import { ClubWithBilling, PlanType } from '../../src/types.js';

export type ClubDocument = Omit<ClubWithBilling, '_id' | 'paid_until' | 'downgrade_locked'> & {
    _id?: ObjectId;
    timestamp?: Date;
}

export type ClubNameDocument = {
    name?: string;
    plan_type?: PlanType;
    access_plan_type?: PlanType;
    next_plan_type: PlanType;
}

export type AdminEmailDocument = {
    email?: string;
}

export type ClubFormBody = {
    _id?: string;
    name: string;
    address_line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    plan_type: PlanType;
    courts_count: number | string;
    start_hour: number | string;
    end_hour: number | string;
    timezone: string;
    reservations_limit?: number | string;
}

export type CourtsFormBody = {
    _id?: string;
    update_type?: 'courts';
    courts: string[];
}

export type SignupClubBody = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    name: string;
    address_line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    plan_type: PlanType;
    courts_count: number | string;
    start_hour: number | string;
    end_hour: number | string;
    timezone: string;
    reservations_limit?: number | string;
}
