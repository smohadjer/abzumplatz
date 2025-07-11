import { FieldProps, CheckboxProps, SelectProps } from '../../types';
import { Password } from '../password/Password';
import { Input } from '../input/Input';
import { Select } from '../select/Select';
import { Checkbox } from '../checkbox/Checkbox';
import { Radio } from '../radio/Radio';

export function FormField(props: FieldProps) {
    const getField = ((field: FieldProps | SelectProps | CheckboxProps) => {
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
            case 'checkbox':
                return <Checkbox {...field as CheckboxProps} />
                break;
            case 'radio':
                return <Radio {...field as CheckboxProps} />
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
