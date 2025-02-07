import { InputProps } from '../../types';

export function Input({
        id, type, value, placeholder, hasError, required, pattern, onInput, autocomplete
    }: InputProps) {
    return (
        <input
            id={id}
            name={id}
            type={type}
            placeholder={placeholder}
            {...(hasError ?
                {className: 'hasError'} : {})}
            value={value}
            required={required}
            pattern={pattern}
            onInput={onInput}
            autoComplete={autocomplete}
        />
    )
}
