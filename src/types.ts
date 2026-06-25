import { ObjectId } from 'mongodb';

export type Field = {
  type: string;
  name: string;
  value:  string | number | string[];
  error?: string;
  hasError?: boolean;
  hidden?: boolean;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  hintByValue?: Record<string, string>;
  footnote?: string;
  options?: {
    disabled?: boolean;
    label: string;
    value: string | number;
  }[];
  autocomplete?: string;
  hasStrengthIndicator?: boolean;
  hasDisplayToggle?: boolean;
}

export type PlanType = 'basic' | 'pro' | 'elite';
export type NormalizedPlanType = 'basic' | 'pro' | 'elite';

export type FormDataInterface = {
  form: FormAttributes;
  fields: Field[]
}

export type FormAttributes = {
  method: string;
  action: string;
  disableBrowserValidation: boolean;
  disableClientSideValidation: boolean;
}

export type ErrorType = {
  instancePath: string,
  message: string
  keyword: string;
  params: {
    missingProperty: string;
  }
}

export type State = {
    isLoggedin: boolean;
}

export type Court = {
  status: string;
}

export type Club = {
    _id: string;
    name: string;
    timestamp?: Date | string;
    address_line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    courts: Court[];
    reservations_limit?: number | null;
    start_hour: number;
    end_hour: number;
    timezone: string;
    access_plan_type?: PlanType;
    next_plan_type: PlanType;
}

export type ClubWithBilling = Club & {
    plan_type?: PlanType;
    current_billing_period_end?: string;
    downgrade_locked?: boolean;
    effective_members_limit?: number | null;
    members_limit_override_active?: boolean;
}

export type BillingPeriod = {
    _id?: string;
    club_id: string;
    plan_type: Exclude<PlanType, 'basic'>;
    anchor_day: number;
    period_start: string;
    period_end: string;
    status: 'active' | 'completed' | 'canceled';
    created_at: Date | string;
    source?: string;
}

export type ReservationItem = {
    //_id: string;
    _id?: ObjectId;
    club_id: string;
    user_id: string;
    date: string;
    court_nums: string[];
    start_time: number;
    end_time: number;
    label: string;
    recurring?: boolean;
    deleted_dates?: string[];
    end_date?: string;
    timestamp?: Date | string;
}

/* we make _id optional so we can insert reservation items into db without an id */
// export type ReservationItemDB = Omit<ReservationItem, '_id'> & {
//     _id?: ObjectId;
//     timestamp: Date;
// }

export type NormalizedReservationItem = ReservationItem & {
    user_name: string;
}

export type StateUser = {
    _id: string;
    first_name: string;
    last_name: string;
}

export type JwtPayload = StateUser & {
    club_id: string;
    email: string;
    role: string;
}

export type DBUser = {
    first_name: string;
    last_name: string;
    club_id?: string;
    email: string;
    password: string;
    role: string;
    status?: string;
    timestamp?: Date | string;
}

export type AuthenticatedUser = {
    value: boolean;
    first_name: string;
    last_name: string;
    email: string;
    _id: string;
    club_id: string;
    role: string;
    // Display-only client cache; it is not the backend authorization source of truth.
    status?: string;
}

export type AuthenticatedUserResponse = Omit<AuthenticatedUser, 'value'> & {
    error?: string;
}
