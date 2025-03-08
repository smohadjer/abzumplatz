import { SelectProps, Option } from '../../types';

export function Select({id, required, options, hasError}: SelectProps) {
    console.log('options:', options);
    const optionsMarkup = options.map((item: Option) => {
        return <option value={item.value}>{item.name}</option>
    });

    return (
        <select
            id={id}
            name={id}
            {...(hasError ?
                {className: 'hasError'} : {})}
            required={required}>
            {optionsMarkup}
        </select>
    )
}
