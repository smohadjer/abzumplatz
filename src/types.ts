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

export type SelectProps = {
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
}

export interface FormProps {
    method: string;
    action: string;
    fields: FieldProps[];
    label: string;
    disableValidation?: boolean;
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
}

export type ReservationItem = {
    _id: string;
    club_id: string;
    user_id: string;
    date: string;
    court_num: number;
    start_time: number;
    end_time: number;
}

export type User = {
    _id: string;
    first_name: string;
    last_name: string;
}

