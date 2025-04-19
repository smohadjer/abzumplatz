import { Select_CheckboxProps, Option } from '../../types';

export function Select({id, required, options, hasError}: Select_CheckboxProps) {
    const optionsMarkup = options.map((item: Option, index) => {
        return <option key={index} value={item.value}>{item.name}</option>
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
