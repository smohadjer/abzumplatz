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
    [name: string]: [value: string]
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
