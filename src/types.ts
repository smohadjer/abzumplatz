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
  options?: any[];
  autocomplete?: string;
  hasStrengthIndicator?: boolean;
  hasDisplayToggle?: boolean;
}

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

export type Club = {
    _id: string;
    name: string;
    courts_count: number;
    reservations_limit: number;
    start_hour: number;
    end_hour: number;
}

export type ReservationItem = {
    //_id: string;
    _id?: ObjectId;
    club_id: string;
    user_id: string;
    date: string;
    court_num: string;
    start_time: number;
    end_time: number;
    label?: string;
    recurring?: boolean;
    deleted_dates?: string[];
    end_date?: string;
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

export type DBUser = {
    first_name: string;
    last_name: string;
    club_id: string;
    email: string;
    password: string;
    role: string;
}

export type AuthenticatedUser = {
    value: boolean;
    first_name: string;
    last_name: string;
    email: string;
    _id: string;
    club_id: string;
    role: string;
}

export type JwtPayload = StateUser & {
    club_id: string;
    email: string;
    role?: string;
    error?: string;
}
