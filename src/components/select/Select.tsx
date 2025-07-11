import { SelectProps, Option } from '../../types';

export function Select({id, required, options, hasError, defaultValue}: SelectProps) {
    const optionsMarkup = options.map((item: Option, index) => {
        return <option key={index} value={item.value}>{item.name}</option>
    });

    return (
        <select
            defaultValue={defaultValue}
            id={id}
            name={id}
            {...(hasError ?
                {className: 'hasError'} : {})}
            required={required}>
            {optionsMarkup}
        </select>
    )
}
