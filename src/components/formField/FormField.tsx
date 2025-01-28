import { FieldProps } from '../../types';
import { Password } from '../password/Password';
import { Input } from '../input/Input';

export function FormField(props: FieldProps) {
    return (
        <>
            <label
                {...(props.required ? {className: 'required'} : {})}
                htmlFor={props.id}>{props.label}:
            </label>
            <div>
                { props.type === 'password'
                    ? <Password {...props} />
                    : <Input {...props} />
                }
                <span className="error">{props.error}</span>
            </div>
        </>
    )
}
