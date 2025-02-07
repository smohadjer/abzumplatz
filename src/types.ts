export interface FieldError {
    id: string;
    error: string;
}

export interface FieldProps extends PasswordProps {
    label?: string,
    error?: string;
}

export interface PasswordProps extends InputProps {
    hasStrengthIndicator?: boolean;
    hasDisplayToggle?: boolean;
}

export interface InputProps {
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
