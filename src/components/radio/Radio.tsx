import { Option, CheckboxProps } from '../../types';
import './radio.css';

export function Radio({id, required, options, hasError}: CheckboxProps) {
  return (
      options.map((option: Option) => {
        return (
          <span key={option.id}>
            <input
              defaultChecked={option.checked}
              type="radio"
              value={option.value}
              id={option.id}
              name={id}
              required={required}
              {...(hasError ?
                {className: 'hasError'} : {})}/>
            <label htmlFor={option.id}>{option.name}</label>
          </span>
        )
      })
  )
}


