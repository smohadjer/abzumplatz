import { FieldProps } from '../../types';
import { Password } from '../password/Password';
import { Input } from '../input/Input';

export function FormField(props: FieldProps) {
    return (
        <>
            { props.label &&
                <label
                    {...(props.required ? {className: 'required'} : {})}
                    htmlFor={props.id}>{props.label}:
                </label>
            }
            {
                props.type === 'hidden' ?
                <Input {...props} /> :
                <div>
                { props.type === 'password'
                    ? <Password {...props} />
                    : <Input {...props} />
                }
                <span className="error">{props.error}</span>
            </div>
            }
        </>
    )
}
