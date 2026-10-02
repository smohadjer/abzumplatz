import { Field } from '../types'
import { ChangeEventHandler } from 'react';

type Option = {
  disabled?: boolean;
  label: string;
  value: string | number;
}

type Props = {
  item: Field;
  handleChange: ChangeEventHandler;
}

export default function Radio(props: Props) {
  const {item, handleChange} = props;

  return (
    item.options?.map((option: Option, index: number) =>
      <span key={index} className="nowrap">
        <input
          type="radio"
          id={`${item.name}-${option.value}`}
          name={item.name}
          value={option.value}
          checked={String(item.value) === String(option.value)}
          disabled={option.disabled}
          onChange={handleChange}
        />
        <label
          className="label--radio"
          htmlFor={`${item.name}-${option.value}`}>
            {option.label}
        </label>
      </span>
    )
  )
}
