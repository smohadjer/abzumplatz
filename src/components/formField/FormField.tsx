import { FieldProps, SelectProps } from '../../types';
import { Password } from '../password/Password';
import { Input } from '../input/Input';
import { Select } from '../select/Select';

export function FormField(props: FieldProps) {
    console.log(props);

    const getField = ((field: FieldProps) => {
        switch (field.type) {
            case 'password':
                return <Password {...field} />
                break;
            case 'text':
            case 'email':
                return  <Input {...field} />
                break;
            case 'select':
                return <Select {...field as SelectProps} />
                break;
        }
    })

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
                    {getField(props)}
                    <span className="error">{props.error}</span>
                </div>
            }
        </>
    )
}
