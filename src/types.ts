import { ObjectId } from 'mongodb';

export interface FieldError {
    id: string;
    error: string;
}

export type FieldProps = PasswordProps & {
    label?: string,
    error?: string;
}

export type PasswordProps = InputProps & {
    hasStrengthIndicator?: boolean;
    hasDisplayToggle?: boolean;
}

export type InputProps = {
    id: string;
    type: string;
    placeholder?: string;
    hasError?: boolean;
    required?: boolean;
    pattern?: string;
    onInput?: React.FormEventHandler;
    autocomplete?: string;
    value?: string;
    options?: Option[];
}

export type Select_CheckboxProps = {
    id: string;
    type: string;
    hasError?: boolean;
    required?: boolean;
    options: Option[];
    value?: string;
}

export type Option = {
    name: string;
    value: string;
    id?: string;
    checked?: boolean;
}

export interface ServerError {
    instancePath: string;
    message: string;
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
}

/* we make _id optional so we can insert reservation items into db without an id */
// export type ReservationItemDB = Omit<ReservationItem, '_id'> & {
//     _id?: ObjectId;
//     timestamp: Date;
// }

export type NormalizedReservationItem = ReservationItem & {
    user_name: string;
}

export type User = {
    _id: string;
    first_name: string;
    last_name: string;
    role?: string;
}

export type JwtPayload = {
    _id: string;
    first_name: string;
    last_name: string;
    club_id: string;
    email: string;
    role?: string;
}
