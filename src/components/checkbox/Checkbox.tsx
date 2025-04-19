import { Option, Select_CheckboxProps } from '../../types';
import './checkbox.css';

export function Checkbox({id, required, options, hasError}: Select_CheckboxProps) {
  const option: Option = options[0];

  return (
      <>
        <input
          type="checkbox"
          value={option.value}
          id={id}
          name={id}
          required={required}
          {...(hasError ?
            {className: 'hasError'} : {})}
        />
        <label htmlFor={id}>{option.name}</label>
    </>
  )
}


